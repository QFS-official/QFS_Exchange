import { NextRequest, NextResponse } from "next/server";
import { getOrderBookSnapshot, getRecentTrades, getMarketStats, initOrderBook, seedMarketMakerLiquidity } from "@/lib/order-engine";
import { TRADING_PAIRS } from "@/lib/tokens/config";

const SEED_PRICES: Record<string, number> = {
  GCRM_USDT: 1.245,
  QFS_USDT: 0.00342,
  ALARAB_USDT: 0.0856,
  NESG_USDT: 0.0521,
};

let initPromise: Promise<void> | null = null;

function ensureEngineReady() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      console.log("[OrderBook API] Auto-initializing engine...");
      await initOrderBook();
      for (const pair of TRADING_PAIRS) {
        const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;
        const basePrice = SEED_PRICES[pairKey] ?? 1.0;
        await seedMarketMakerLiquidity(pairKey, basePrice, pair.base.symbol, pair.quote.symbol, pair.base.chainId);
      }
      console.log("[OrderBook API] Engine auto-initialized successfully");
    } catch (error) {
      console.error("[OrderBook API] Auto-init failed:", error);
      initPromise = null; // allow retry on failure
    }
  })();
  return initPromise;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pair = searchParams.get("pair");
    const depth = parseInt(searchParams.get("depth") ?? "20");
    const trades = searchParams.get("trades") === "true";
    const stats = searchParams.get("stats") === "true";

    if (!pair) {
      return NextResponse.json({ error: "pair parameter required" }, { status: 400 });
    }

    // Auto-initialize engine (handles server restarts). All concurrent callers await the same promise.
    await ensureEngineReady();

    // Fetch snapshot
    let snapshot = getOrderBookSnapshot(pair, depth);

    // If pair has no liquidity and it's a tradeable pair, try re-seeding
    if (snapshot.bids.length === 0 && snapshot.asks.length === 0) {
      const tradeablePair = TRADING_PAIRS.find(
        (p) => `${p.base.symbol}_${p.quote.symbol}` === pair
      );
      if (tradeablePair) {
        console.log(`[OrderBook API] Pair ${pair} has no liquidity, re-seeding...`);
        const basePrice = SEED_PRICES[pair] ?? 1.0;
        await seedMarketMakerLiquidity(pair, basePrice, tradeablePair.base.symbol, tradeablePair.quote.symbol, tradeablePair.base.chainId);
        snapshot = getOrderBookSnapshot(pair, depth);
      }
    }

    let recentTrades = null;
    if (trades) {
      recentTrades = await getRecentTrades(pair, 30);
    }

    let marketStats = null;
    if (stats) {
      marketStats = await getMarketStats(pair);
    }

    return NextResponse.json({
      ...snapshot,
      trades: recentTrades,
      stats: marketStats,
    });
  } catch (error) {
    console.error("[OrderBook GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
