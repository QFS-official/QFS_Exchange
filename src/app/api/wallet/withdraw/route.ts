import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { debitBalance, getOrCreateBalance } from "@/app/api/balance/route";

interface NetworkFee {
  fee: number;
  min: number;
  max: number;
  estimatedTime: string;
}

// Per-token, per-network withdrawal configuration
const WITHDRAWAL_CONFIG: Record<string, Record<string, NetworkFee>> = {
  USDT: {
    "Ethereum (ERC20)":    { fee: 5,    min: 10,   max: 100000, estimatedTime: "~15 min" },
    "BSC (BEP20)":          { fee: 0.8,  min: 5,    max: 100000, estimatedTime: "~5 min" },
    "Polygon":              { fee: 0.5,  min: 5,    max: 100000, estimatedTime: "~3 min" },
    "Arbitrum One":         { fee: 0.5,  min: 5,    max: 100000, estimatedTime: "~3 min" },
    "Optimism":             { fee: 0.5,  min: 5,    max: 100000, estimatedTime: "~3 min" },
    "Avalanche C-Chain":    { fee: 0.8,  min: 5,    max: 100000, estimatedTime: "~5 min" },
    "Base":                 { fee: 0.5,  min: 5,    max: 100000, estimatedTime: "~3 min" },
    "Tron (TRC20)":         { fee: 1,    min: 5,    max: 100000, estimatedTime: "~5 min" },
    "Solana (SPL)":         { fee: 0.5,  min: 5,    max: 100000, estimatedTime: "~1 min" },
  },
  GCRM: {
    "Ethereum (ERC20)":    { fee: 2,    min: 1,    max: 1000000, estimatedTime: "~15 min" },
    "BSC (BEP20)":          { fee: 0.3,  min: 1,    max: 1000000, estimatedTime: "~5 min" },
    "Polygon":              { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Arbitrum One":         { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Base":                 { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
  },
  QFS: {
    "Ethereum (ERC20)":    { fee: 2,    min: 1,    max: 1000000, estimatedTime: "~15 min" },
    "BSC (BEP20)":          { fee: 0.3,  min: 1,    max: 1000000, estimatedTime: "~5 min" },
    "Polygon":              { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Arbitrum One":         { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Base":                 { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
  },
  ALARAB: {
    "Polygon":              { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "BSC (BEP20)":          { fee: 0.3,  min: 1,    max: 1000000, estimatedTime: "~5 min" },
    "Ethereum (ERC20)":    { fee: 2,    min: 1,    max: 1000000, estimatedTime: "~15 min" },
    "Arbitrum One":         { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
  },
  NESG: {
    "Ethereum (ERC20)":    { fee: 2,    min: 1,    max: 1000000, estimatedTime: "~15 min" },
    "BSC (BEP20)":          { fee: 0.3,  min: 1,    max: 1000000, estimatedTime: "~5 min" },
    "Polygon":              { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Arbitrum One":         { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
    "Base":                 { fee: 0.2,  min: 1,    max: 1000000, estimatedTime: "~3 min" },
  },
};

// GET /api/wallet/withdraw?wallet=0x...&symbol=USDT → get withdrawal info
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const symbol = req.nextUrl.searchParams.get("symbol");

  if (!wallet || !symbol) {
    return NextResponse.json({ error: "wallet and symbol required" }, { status: 400 });
  }

  const tokenConfig = WITHDRAWAL_CONFIG[symbol.toUpperCase()];
  if (!tokenConfig) {
    return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
  }

  const balance = await getOrCreateBalance(wallet.toLowerCase(), symbol.toUpperCase());

  // Build networks list with fee info
  const networks = Object.entries(tokenConfig).map(([network, cfg]) => ({
    network,
    fee: cfg.fee,
    min: cfg.min,
    max: cfg.max,
    estimatedTime: cfg.estimatedTime,
  }));

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    available: balance,
    networks,
  });
}

// POST /api/wallet/withdraw → process withdrawal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, symbol, amount, network, toAddress, memo } = body;

    if (!walletAddress || !symbol || !amount || !network || !toAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sym = symbol.toUpperCase();
    const tokenConfig = WITHDRAWAL_CONFIG[sym];
    if (!tokenConfig) {
      return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
    }

    const networkCfg = tokenConfig[network];
    if (!networkCfg) {
      return NextResponse.json({ error: `Network '${network}' not supported for ${sym} withdrawal` }, { status: 400 });
    }

    const amt = parseFloat(amount);
    const fee = networkCfg.fee;

    if (amt < networkCfg.min) {
      return NextResponse.json({ error: `Minimum withdrawal is ${networkCfg.min} ${sym} on ${network}` }, { status: 400 });
    }
    if (amt > networkCfg.max) {
      return NextResponse.json({ error: `Maximum withdrawal is ${networkCfg.max} ${sym} on ${network}` }, { status: 400 });
    }

    // Validate address format
    const isTron = network.includes("TRC20");
    const isSolana = network.includes("SPL");
    if (isTron) {
      if (!/^[T][a-km-zA-HJ-NP-Z1-9]{33}$/.test(toAddress)) {
        return NextResponse.json({ error: "Invalid Tron address. Must start with T and be 34 characters." }, { status: 400 });
      }
    } else if (isSolana) {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(toAddress)) {
        return NextResponse.json({ error: "Invalid Solana address." }, { status: 400 });
      }
    } else {
      if (!/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
        return NextResponse.json({ error: "Invalid EVM address. Must be 0x... (42 characters)." }, { status: 400 });
      }
    }

    const w = walletAddress.toLowerCase();

    const currentBalance = await getOrCreateBalance(w, sym);
    if (currentBalance < amt + fee) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${currentBalance.toFixed(6)} ${sym} (fee: ${fee} ${sym})` },
        { status: 400 }
      );
    }

    const debited = await debitBalance(w, sym, amt + fee);
    if (!debited) {
      return NextResponse.json({ error: "Failed to debit balance. Please try again." }, { status: 500 });
    }

    const tx = await prisma.walletTransaction.create({
      data: {
        walletAddress: w,
        type: "withdraw",
        symbol: sym,
        amount: amt,
        fee: fee,
        status: "processing",
        toAddress: toAddress.toLowerCase(),
        fromAddress: w,
        network: network,
        memo: memo || null,
      },
    });

    return NextResponse.json({
      success: true,
      transaction: tx,
      message: `Withdrawal of ${amt} ${sym} via ${network} submitted. Fee: ${fee} ${sym}. ETA: ${networkCfg.estimatedTime}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Withdraw] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
