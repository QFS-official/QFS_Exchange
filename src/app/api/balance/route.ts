import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "./../../../lib/db";

const INITIAL_BALANCES: Record<string, number> = {
  USDT: 10000,
  GCRM: 0,
  QFS: 0,
  ALARAB: 0,
  NESG: 0,
};

// GET /api/balance?wallet=0x... → returns all balances for a wallet
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const rows = await prisma.exchangeBalance.findMany({
    where: { walletAddress: wallet.toLowerCase() },
  });

  const balances: Record<string, { available: number; frozen: number }> = {};
  for (const r of rows) {
    balances[r.symbol] = { available: r.available, frozen: r.frozen };
  }

  // Ensure all symbols exist (auto-initialize on first fetch)
  for (const [sym, defaultAmt] of Object.entries(INITIAL_BALANCES)) {
    if (!balances[sym]) {
      await prisma.exchangeBalance.upsert({
        where: { walletAddress_symbol: { walletAddress: wallet.toLowerCase(), symbol: sym } },
        create: { walletAddress: wallet.toLowerCase(), symbol: sym, available: defaultAmt },
        update: {},
      });
      balances[sym] = { available: defaultAmt, frozen: 0 };
    }
  }

  return NextResponse.json(balances);
}

// Internal helper: get or create a single balance row
export async function getOrCreateBalance(walletAddress: string, symbol: string): Promise<number> {
  const w = walletAddress.toLowerCase();
  const row = await prisma.exchangeBalance.findUnique({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
  });
  if (row) return row.available;

  const defaultAmt = INITIAL_BALANCES[symbol] ?? 0;
  await prisma.exchangeBalance.create({
    data: { walletAddress: w, symbol, available: defaultAmt },
  });
  return defaultAmt;
}

// Internal helper: credit a balance
export async function creditBalance(walletAddress: string, symbol: string, amount: number) {
  const w = walletAddress.toLowerCase();
  await prisma.exchangeBalance.upsert({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
    create: { walletAddress: w, symbol, available: amount },
    update: { available: { increment: amount } },
  });
}

// Internal helper: debit a balance (checks sufficient funds)
export async function debitBalance(walletAddress: string, symbol: string, amount: number): Promise<boolean> {
  const w = walletAddress.toLowerCase();
  const row = await prisma.exchangeBalance.findUnique({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
  });
  const current = row?.available ?? (INITIAL_BALANCES[symbol] ?? 0);
  if (current < amount - 0.000001) return false;

  await prisma.exchangeBalance.upsert({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
    create: { walletAddress: w, symbol, available: Math.max(0, (INITIAL_BALANCES[symbol] ?? 0) - amount) },
    update: { available: { decrement: amount } },
  });
  return true;
}
