import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { creditBalance } from "@/app/api/balance/route";

interface NetworkConfig {
  depositAddress: string;
  minDeposit: number;
  confirmations: number;
  estimatedTime: string;
}

// Per-token, per-network deposit configuration
const TOKEN_NETWORKS: Record<string, Record<string, NetworkConfig>> = {
  USDT: {
    "Ethereum (ERC20)":     { depositAddress: "0xGCRM-USDT-ERC20-DEPOSIT",  minDeposit: 1,    confirmations: 12, estimatedTime: "~5 min" },
    "BSC (BEP20)":           { depositAddress: "0xGCRM-USDT-BEP20-DEPOSIT",  minDeposit: 1,    confirmations: 15, estimatedTime: "~3 min" },
    "Polygon":               { depositAddress: "0xGCRM-USDT-POLY-DEPOSIT",   minDeposit: 1,    confirmations: 24, estimatedTime: "~2 min" },
    "Arbitrum One":          { depositAddress: "0xGCRM-USDT-ARB-DEPOSIT",   minDeposit: 1,    confirmations: 10, estimatedTime: "~1 min" },
    "Optimism":              { depositAddress: "0xGCRM-USDT-OP-DEPOSIT",    minDeposit: 1,    confirmations: 10, estimatedTime: "~1 min" },
    "Avalanche C-Chain":     { depositAddress: "0xGCRM-USDT-AVA-DEPOSIT",   minDeposit: 1,    confirmations: 12, estimatedTime: "~2 min" },
    "Base":                  { depositAddress: "0xGCRM-USDT-BASE-DEPOSIT",  minDeposit: 1,    confirmations: 10, estimatedTime: "~1 min" },
    "Tron (TRC20)":          { depositAddress: "TGCRM-USDT-TRC20-DEPOSIT",  minDeposit: 1,    confirmations: 20, estimatedTime: "~3 min" },
    "Solana (SPL)":          { depositAddress: "GCRM-USDT-SOL-DEPOSIT",     minDeposit: 1,    confirmations: 1,  estimatedTime: "~30 sec" },
  },
  GCRM: {
    "Ethereum (ERC20)":     { depositAddress: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b3", minDeposit: 1, confirmations: 12, estimatedTime: "~5 min" },
    "BSC (BEP20)":           { depositAddress: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b4", minDeposit: 1, confirmations: 15, estimatedTime: "~3 min" },
    "Polygon":               { depositAddress: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b5", minDeposit: 1, confirmations: 24, estimatedTime: "~2 min" },
    "Arbitrum One":          { depositAddress: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b6", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
    "Base":                  { depositAddress: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b7", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
  },
  QFS: {
    "Ethereum (ERC20)":     { depositAddress: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce305e", minDeposit: 1, confirmations: 12, estimatedTime: "~5 min" },
    "BSC (BEP20)":           { depositAddress: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce305f", minDeposit: 1, confirmations: 15, estimatedTime: "~3 min" },
    "Polygon":               { depositAddress: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce3060", minDeposit: 1, confirmations: 24, estimatedTime: "~2 min" },
    "Arbitrum One":          { depositAddress: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce3061", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
    "Base":                  { depositAddress: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce3062", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
  },
  ALARAB: {
    "Polygon":               { depositAddress: "0xf5c068f28ebf91b22e52c2ecd230621879e914b8", minDeposit: 1, confirmations: 24, estimatedTime: "~2 min" },
    "BSC (BEP20)":           { depositAddress: "0xf5c068f28ebf91b22e52c2ecd230621879e914b9", minDeposit: 1, confirmations: 15, estimatedTime: "~3 min" },
    "Ethereum (ERC20)":     { depositAddress: "0xf5c068f28ebf91b22e52c2ecd230621879e914ba", minDeposit: 1, confirmations: 12, estimatedTime: "~5 min" },
    "Arbitrum One":          { depositAddress: "0xf5c068f28ebf91b22e52c2ecd230621879e914bb", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
  },
  NESG: {
    "Ethereum (ERC20)":     { depositAddress: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477cd", minDeposit: 1, confirmations: 12, estimatedTime: "~5 min" },
    "BSC (BEP20)":           { depositAddress: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477ce", minDeposit: 1, confirmations: 15, estimatedTime: "~3 min" },
    "Polygon":               { depositAddress: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477cf", minDeposit: 1, confirmations: 24, estimatedTime: "~2 min" },
    "Arbitrum One":          { depositAddress: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477d0", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
    "Base":                  { depositAddress: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477d1", minDeposit: 1, confirmations: 10, estimatedTime: "~1 min" },
  },
};

// GET /api/wallet/deposit?wallet=0x...&symbol=USDT → get deposit info for a token
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const symbol = req.nextUrl.searchParams.get("symbol");

  if (!wallet || !symbol) {
    return NextResponse.json({ error: "wallet and symbol required" }, { status: 400 });
  }

  const tokenNetworks = TOKEN_NETWORKS[symbol.toUpperCase()];
  if (!tokenNetworks) {
    return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
  }

  const walletSuffix = wallet.slice(2, 8).toUpperCase();

  const networks = Object.entries(tokenNetworks).map(([network, cfg]) => ({
    network,
    address: cfg.depositAddress.slice(0, -6) + walletSuffix,
    minDeposit: cfg.minDeposit,
    confirmations: cfg.confirmations,
    estimatedTime: cfg.estimatedTime,
  }));

  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    networks,
  });
}

// POST /api/wallet/deposit → create a deposit request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, symbol, amount, network, txHash } = body;

    if (!walletAddress || !symbol || !amount || !network) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sym = symbol.toUpperCase();
    const tokenNetworks = TOKEN_NETWORKS[sym];
    if (!tokenNetworks) {
      return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
    }

    const networkCfg = tokenNetworks[network];
    if (!networkCfg) {
      return NextResponse.json({ error: `Network '${network}' not supported for ${sym}` }, { status: 400 });
    }

    if (amount < networkCfg.minDeposit) {
      return NextResponse.json({ error: `Minimum deposit is ${networkCfg.minDeposit} ${sym} on ${network}` }, { status: 400 });
    }

    const w = walletAddress.toLowerCase();

    const tx = await prisma.walletTransaction.create({
      data: {
        walletAddress: w,
        type: "deposit",
        symbol: sym,
        amount: parseFloat(amount),
        fee: 0,
        status: "completed",
        txHash: txHash || null,
        toAddress: networkCfg.depositAddress,
        fromAddress: w,
        network: network,
        note: `Virtual deposit via ${network}`,
      },
    });

    await creditBalance(w, sym, parseFloat(amount));

    return NextResponse.json({
      success: true,
      transaction: tx,
      message: `Deposit of ${amount} ${sym} via ${network} processed successfully`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Deposit] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
