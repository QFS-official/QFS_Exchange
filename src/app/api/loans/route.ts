import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { debitBalance, creditBalance, getOrCreateBalance } from "@/app/api/balance/route";

// Default loan products — seeded on first fetch
const DEFAULT_PRODUCTS = [
  { symbol: "GCRM",   borrowSymbol: "USDT", name: "GCRM",   ltv: 0.65, interestRate: 0.088,  maxLoanDuration: 30, minCollateral: 10,  maxBorrow: 50000 },
  { symbol: "QFS",    borrowSymbol: "USDT", name: "QFS",    ltv: 0.55, interestRate: 0.105,  maxLoanDuration: 30, minCollateral: 1000, maxBorrow: 20000 },
  { symbol: "ALARAB", borrowSymbol: "USDT", name: "ALARAB", ltv: 0.60, interestRate: 0.095,  maxLoanDuration: 30, minCollateral: 100,  maxBorrow: 30000 },
  { symbol: "NESG",   borrowSymbol: "USDT", name: "NESG",   ltv: 0.55, interestRate: 0.110,  maxLoanDuration: 30, minCollateral: 100,  maxBorrow: 20000 },
  { symbol: "BTC",    borrowSymbol: "USDT", name: "Bitcoin", ltv: 0.70, interestRate: 0.035,  maxLoanDuration: 90, minCollateral: 0.001, maxBorrow: 1000000 },
  { symbol: "ETH",    borrowSymbol: "USDT", name: "Ethereum", ltv: 0.70, interestRate: 0.045,  maxLoanDuration: 90, minCollateral: 0.01, maxBorrow: 500000 },
  { symbol: "BNB",    borrowSymbol: "USDT", name: "BNB",    ltv: 0.65, interestRate: 0.055,  maxLoanDuration: 60, minCollateral: 0.5, maxBorrow: 100000 },
  { symbol: "SOL",    borrowSymbol: "USDT", name: "Solana", ltv: 0.65, interestRate: 0.060,  maxLoanDuration: 60, minCollateral: 1, maxBorrow: 100000 },
  { symbol: "XRP",    borrowSymbol: "USDT", name: "XRP",    ltv: 0.60, interestRate: 0.065,  maxLoanDuration: 60, minCollateral: 100, maxBorrow: 50000 },
  { symbol: "ADA",    borrowSymbol: "USDT", name: "Cardano", ltv: 0.60, interestRate: 0.070,  maxLoanDuration: 60, minCollateral: 100, maxBorrow: 50000 },
  { symbol: "DOGE",   borrowSymbol: "USDT", name: "Dogecoin", ltv: 0.55, interestRate: 0.080,  maxLoanDuration: 30, minCollateral: 1000, maxBorrow: 30000 },
  { symbol: "DOT",    borrowSymbol: "USDT", name: "Polkadot", ltv: 0.60, interestRate: 0.070,  maxLoanDuration: 60, minCollateral: 10, maxBorrow: 50000 },
  { symbol: "AVAX",  borrowSymbol: "USDT", name: "Avalanche", ltv: 0.65, interestRate: 0.060,  maxLoanDuration: 60, minCollateral: 1, maxBorrow: 100000 },
  { symbol: "LINK",   borrowSymbol: "USDT", name: "Chainlink", ltv: 0.65, interestRate: 0.060,  maxLoanDuration: 60, minCollateral: 5, maxBorrow: 50000 },
];

// Token price fallbacks (same as prices API)
const PRICE_FALLBACKS: Record<string, number> = {
  GCRM: 1.245, QFS: 0.00342, ALARAB: 0.0856, NESG: 0.0521,
  BTC: 61200, ETH: 3120, BNB: 705, SOL: 178.5, XRP: 0.624,
  ADA: 0.458, DOGE: 0.1582, DOT: 7.42, AVAX: 38.6, LINK: 18.45, USDT: 1,
};

async function getTokenPrice(symbol: string): Promise<number> {
  if (symbol === "USDT") return 1;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/prices`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const cgMap: Record<string, string> = {
        GCRM: "gcrm-token", QFS: "qfs-token", ALARAB: "alarab-token", NESG: "nesg-token",
        BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin", SOL: "solana",
        XRP: "ripple", ADA: "cardano", DOGE: "dogecoin", DOT: "polkadot",
        AVAX: "avalanche-2", LINK: "chainlink",
      };
      const cgId = cgMap[symbol];
      if (cgId && data[cgId]) return data[cgId].usd;
    }
  } catch {}
  return PRICE_FALLBACKS[symbol] || 1;
}

// Seed products if none exist
async function ensureProducts() {
  const count = await prisma.loanProduct.count();
  if (count === 0) {
    await prisma.loanProduct.createMany({ data: DEFAULT_PRODUCTS });
  }
}

// GET /api/loans?wallet=0x... → products + positions
export async function GET(req: NextRequest) {
  await ensureProducts();

  const wallet = req.nextUrl.searchParams.get("wallet");
  const products = await prisma.loanProduct.findMany({ where: { isActive: true } });

  // Enrich with current prices
  const enriched = await Promise.all(products.map(async (p) => {
    const [collateralPrice, borrowPrice] = await Promise.all([getTokenPrice(p.symbol), getTokenPrice(p.borrowSymbol)]);
    return { ...p, collateralPriceUsd: collateralPrice, borrowPriceUsd: borrowPrice };
  }));

  let positions: unknown[] = [];
  if (wallet) {
    const w = wallet.toLowerCase();
    positions = await prisma.loanPosition.findMany({
      where: { walletAddress: w },
      orderBy: { createdAt: "desc" },
    });
    // Enrich positions with prices
    positions = await Promise.all((positions as Array<{ collateralSymbol: string; borrowSymbol: string; collateralAmount: number; borrowAmount: number }>).map(async (pos) => {
    const [cPrice, bPrice] = await Promise.all([getTokenPrice(pos.collateralSymbol), getTokenPrice(pos.borrowSymbol)]);
      return { ...pos, collateralPriceUsd: cPrice, borrowPriceUsd: bPrice };
    }));
  }

  return NextResponse.json({ products: enriched, positions });
}

// POST /api/loans → borrow (collateralize token, receive USDT)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, productId, collateralAmount, borrowAmount, durationDays } = body;

    if (!walletAddress || !productId || !collateralAmount || !borrowAmount || !durationDays) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ensureProducts();

    const product = await prisma.loanProduct.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
      return NextResponse.json({ error: "Invalid loan product" }, { status: 400 });
    }

    const colAmt = parseFloat(collateralAmount);
    const borAmt = parseFloat(borrowAmount);
    const days = parseInt(durationDays);

    if (colAmt < product.minCollateral) {
      return NextResponse.json({ error: `Minimum collateral is ${product.minCollateral} ${product.symbol}` }, { status: 400 });
    }
    if (borAmt > product.maxBorrow) {
      return NextResponse.json({ error: `Maximum borrow is ${product.maxBorrow} USDT` }, { status: 400 });
    }
    if (days > product.maxLoanDuration) {
      return NextResponse.json({ error: `Maximum duration is ${product.maxLoanDuration} days` }, { status: 400 });
    }

    // Validate LTV
    const colPrice = await getTokenPrice(product.symbol);
    const collateralValueUsd = colAmt * colPrice;
    const ltv = borAmt / collateralValueUsd;
    if (ltv > product.ltv) {
      const maxBor = collateralValueUsd * product.ltv;
      return NextResponse.json({
        error: `LTV exceeds maximum. Maximum borrow: ${maxBor.toFixed(2)} USDT for ${colAmt} ${product.symbol} collateral`,
      }, { status: 400 });
    }

    const w = walletAddress.toLowerCase();

    // Check collateral balance
    const colBal = await getOrCreateBalance(w, product.symbol);
    if (colBal < colAmt - 0.000001) {
      return NextResponse.json({ error: `Insufficient ${product.symbol} balance. Available: ${colBal.toFixed(6)}` }, { status: 400 });
    }

    // Debit collateral
    const debited = await debitBalance(w, product.symbol, colAmt);
    if (!debited) {
      return NextResponse.json({ error: "Failed to lock collateral" }, { status: 500 });
    }

    // Credit borrowed USDT
    await creditBalance(w, product.borrowSymbol, borAmt);

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    // Create loan position
    const position = await prisma.loanPosition.create({
      data: {
        walletAddress: w,
        productId: product.id,
        collateralSymbol: product.symbol,
        collateralAmount: colAmt,
        borrowSymbol: product.borrowSymbol,
        borrowAmount: borAmt,
        interestRate: product.interestRate,
        startDate: new Date(),
        dueDate,
      },
    });

    // Update total borrowed
    await prisma.loanProduct.update({
      where: { id: product.id },
      data: { totalBorrowed: { increment: borAmt } },
    });

    // Record transactions
    await prisma.walletTransaction.createMany({
      data: [
        { walletAddress: w, type: "withdraw", symbol: product.symbol, amount: colAmt, fee: 0, status: "completed", network: "Loan Collateral", note: `Collateral for loan #${position.id.slice(-6)}` },
        { walletAddress: w, type: "deposit", symbol: product.borrowSymbol, amount: borAmt, fee: 0, status: "completed", network: "Loan Borrow", note: `Borrowed against ${product.symbol}` },
      ],
    });

    return NextResponse.json({
      success: true,
      position,
      message: `Borrowed ${borAmt.toFixed(2)} USDT against ${colAmt.toFixed(6)} ${product.symbol} collateral. Due: ${dueDate.toISOString().split("T")[0]}`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Loans] Borrow error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/loans → repay
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, positionId } = body;

    if (!walletAddress || !positionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const w = walletAddress.toLowerCase();
    const position = await prisma.loanPosition.findUnique({ where: { id: positionId } });

    if (!position || position.walletAddress !== w) {
      return NextResponse.json({ error: "Loan position not found" }, { status: 404 });
    }
    if (position.status !== "active") {
      return NextResponse.json({ error: `Loan is already ${position.status}` }, { status: 400 });
    }

    // Calculate interest
    const daysBorrowed = Math.max(1, (Date.now() - position.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interest = position.borrowAmount * position.interestRate * (daysBorrowed / 365);
    const totalRepay = position.borrowAmount + interest;

    // Check USDT balance
    const usdtBal = await getOrCreateBalance(w, "USDT");
    if (usdtBal < totalRepay - 0.01) {
      return NextResponse.json({ error: `Insufficient USDT. Need ${totalRepay.toFixed(2)} USDT (principal + interest). Available: ${usdtBal.toFixed(2)}` }, { status: 400 });
    }

    // Debit USDT (principal + interest)
    await debitBalance(w, "USDT", totalRepay);

    // Return collateral
    await creditBalance(w, position.collateralSymbol, position.collateralAmount);

    // Update position
    await prisma.loanPosition.update({
      where: { id: positionId },
      data: { status: "repaid", interestAccrued: interest, repaidAt: new Date() },
    });

    // Record transactions
    await prisma.walletTransaction.createMany({
      data: [
        { walletAddress: w, type: "withdraw", symbol: "USDT", amount: totalRepay, fee: 0, status: "completed", network: "Loan Repay", note: `Repayment + ${interest.toFixed(4)} interest` },
        { walletAddress: w, type: "deposit", symbol: position.collateralSymbol, amount: position.collateralAmount, fee: 0, status: "completed", network: "Loan Return", note: `Collateral returned from loan #${position.id.slice(-6)}` },
      ],
    });

    return NextResponse.json({
      success: true,
      interest: interest.toFixed(4),
      totalRepay: totalRepay.toFixed(2),
      collateralReturned: position.collateralAmount,
      message: `Loan repaid. ${position.borrowAmount} USDT + ${interest.toFixed(4)} USDT interest. ${position.collateralAmount} ${position.collateralSymbol} collateral returned.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Loans] Repay error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
