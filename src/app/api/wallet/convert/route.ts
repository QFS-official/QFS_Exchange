import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { debitBalance, creditBalance, getOrCreateBalance } from "@/app/api/balance/route";

// CoinGecko ID mapping for price lookup
const CG_IDS: Record<string, string> = {
  USDT: "tether",
  GCRM: "gcrm-token",
  QFS: "qfs-token",
  ALARAB: "alarab-token",
  NESG: "nesg-token",
};

const SUPPORTED_TOKENS = ["USDT", "GCRM", "QFS", "ALARAB", "NESG"];
const MIN_CONVERT: Record<string, number> = {
  USDT: 1, GCRM: 0.1, QFS: 1, ALARAB: 1, NESG: 1,
};

async function getTokenPriceUsd(symbol: string): Promise<number> {
  if (symbol === "USDT") return 1;
  try {
    const res = await fetch("http://localhost:3000/api/prices", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const cgId = CG_IDS[symbol];
      if (cgId && data[cgId]) return data[cgId].usd;
    }
  } catch {}
  // Fallback prices
  const fallbacks: Record<string, number> = { GCRM: 1.245, QFS: 0.00342, ALARAB: 0.0856, NESG: 0.0521 };
  return fallbacks[symbol] || 1;
}

// GET /api/wallet/convert?from=GCRM&to=USDT&amount=100 → get conversion quote
export async function GET(req: NextRequest) {
  const fromSym = (req.nextUrl.searchParams.get("from") || "").toUpperCase();
  const toSym = (req.nextUrl.searchParams.get("to") || "").toUpperCase();
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") || "0");

  if (!fromSym || !toSym || !SUPPORTED_TOKENS.includes(fromSym) || !SUPPORTED_TOKENS.includes(toSym)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  if (fromSym === toSym) {
    return NextResponse.json({ error: "Cannot convert to same token" }, { status: 400 });
  }

  const fromPrice = await getTokenPriceUsd(fromSym);
  const toPrice = await getTokenPriceUsd(toSym);
  const rate = fromPrice / toPrice;
  const receiveAmount = amount * rate;

  return NextResponse.json({
    from: fromSym,
    to: toSym,
    fromAmount: amount,
    toAmount: receiveAmount,
    rate,
    fromPriceUsd: fromPrice,
    toPriceUsd: toPrice,
    fee: 0,
  });
}

// POST /api/wallet/convert → execute conversion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, from, to, amount } = body;

    const fromSym = (from || "").toUpperCase();
    const toSym = (to || "").toUpperCase();

    if (!walletAddress || !fromSym || !toSym || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!SUPPORTED_TOKENS.includes(fromSym) || !SUPPORTED_TOKENS.includes(toSym)) {
      return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
    }
    if (fromSym === toSym) {
      return NextResponse.json({ error: "Cannot convert to same token" }, { status: 400 });
    }

    const amt = parseFloat(amount);
    if (amt <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    if (amt < (MIN_CONVERT[fromSym] || 0.01)) {
      return NextResponse.json({ error: `Minimum conversion is ${MIN_CONVERT[fromSym]} ${fromSym}` }, { status: 400 });
    }

    const w = walletAddress.toLowerCase();

    // Check balance
    const balance = await getOrCreateBalance(w, fromSym);
    if (balance < amt - 0.000001) {
      return NextResponse.json({ error: `Insufficient ${fromSym} balance. Available: ${balance.toFixed(6)}` }, { status: 400 });
    }

    // Calculate conversion
    const fromPrice = await getTokenPriceUsd(fromSym);
    const toPrice = await getTokenPriceUsd(toSym);
    const rate = fromPrice / toPrice;
    const receiveAmount = amt * rate;

    // Debit source
    const debited = await debitBalance(w, fromSym, amt);
    if (!debited) {
      return NextResponse.json({ error: "Failed to debit source balance" }, { status: 500 });
    }

    // Credit destination
    await creditBalance(w, toSym, receiveAmount);

    // Record both sides as wallet transactions
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletAddress: w,
          type: "withdraw",
          symbol: fromSym,
          amount: amt,
          fee: 0,
          status: "completed",
          network: "Convert",
          note: `Converted to ${toSym}`,
        },
        {
          walletAddress: w,
          type: "deposit",
          symbol: toSym,
          amount: receiveAmount,
          fee: 0,
          status: "completed",
          network: "Convert",
          note: `Converted from ${fromSym}`,
        },
      ],
    });

    return NextResponse.json({
      success: true,
 from: fromSym,
      to: toSym,
      fromAmount: amt,
      toAmount: receiveAmount,
      rate,
      fee: 0,
      message: `Successfully converted ${amt.toFixed(6)} ${fromSym} to ${receiveAmount.toFixed(6)} ${toSym}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Convert] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
