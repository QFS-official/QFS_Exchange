import { NextResponse } from "next/server";
import { initOrderBook, seedMarketMakerLiquidity, getOrderBookSnapshot } from "@/lib/order-engine";
import { TRADING_PAIRS } from "@/lib/tokens/config";

// Prices for seeding initial liquidity (fallback from CoinGecko)
// These MUST match the CoinGecko fallback prices in /api/prices/route.ts
const SEED_PRICES: Record<string, number> = {
  GCRM_USDT: 1.245,
  QFS_USDT: 0.00342,
  ALARAB_USDT: 0.0856,
  NESG_USDT: 0.0521,
};

let initialized = false;

export async function GET() {
  if (initialized) {
    return NextResponse.json({ ok: true, message: "Already initialized" });
  }

  try {
    // Initialize order books from DB
    await initOrderBook();

    // Seed liquidity for each trading pair
    for (const pair of TRADING_PAIRS) {
      const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;
      const basePrice = SEED_PRICES[pairKey] ?? 1.0;
      await seedMarketMakerLiquidity(
        pairKey,
        basePrice,
        pair.base.symbol,
        pair.quote.symbol,
        pair.base.chainId
      );
    }

    initialized = true;
    return NextResponse.json({ ok: true, message: "Engine initialized and liquidity seeded" });
  } catch (error) {
    console.error("[InitEngine] Error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
