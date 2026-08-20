import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// GET /api/wallet/transactions?wallet=0x...&type=deposit|withdraw&symbol=USDT&page=1&limit=20
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const type = req.nextUrl.searchParams.get("type");
  const symbol = req.nextUrl.searchParams.get("symbol");
  const status = req.nextUrl.searchParams.get("status");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { walletAddress: wallet.toLowerCase() };
  if (type) where.type = type;
  if (symbol) where.symbol = symbol.toUpperCase();
  if (status) where.status = status;

  const [total, transactions] = await Promise.all([
    prisma.walletTransaction.count({ where }),
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
