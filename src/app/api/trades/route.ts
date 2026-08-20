import { NextRequest, NextResponse } from "next/server";
import { getUserTradeHistory, getRecentTrades } from "@/lib/order-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const pair = searchParams.get("pair");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    if (wallet) {
      // User trade history
      const trades = await getUserTradeHistory(wallet, pair ?? undefined, limit);
      return NextResponse.json({ trades });
    } else if (pair) {
      // Market recent trades
      const trades = await getRecentTrades(pair, limit);
      return NextResponse.json({ trades });
    } else {
      return NextResponse.json({ error: "wallet or pair parameter required" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Trades GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
