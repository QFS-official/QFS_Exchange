import { NextRequest, NextResponse } from "next/server";

const TOKEN_PRICES: Record<string, number> = {
  GCRMUSDT: 1.245,
  QFSUSDT: 0.00342,
  ALARABUSDT: 0.0856,
  NESGUSDT: 0.0521,
};

// Deterministic seed from symbol for consistent candles
function seedRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function () {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 0x7fffffff;
  };
}

// Resolution to seconds
function resolutionToSeconds(res: string): number {
  const map: Record<string, number> = { "1": 60, "5": 300, "15": 900, "60": 3600, "240": 14400, "D": 86400, "W": 604800, "M": 2592000 };
  return map[res] || 3600;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawSymbol = searchParams.get("symbol") || "";
  const symbol = rawSymbol.replace(/[^A-Z]/g, "");
  const from = parseInt(searchParams.get("from") || "0");
  const to = parseInt(searchParams.get("to") || "0");
  const resolution = searchParams.get("resolution") || "60";
  const countback = parseInt(searchParams.get("countback") || "300");

  const basePrice = TOKEN_PRICES[symbol];
  if (!basePrice) {
    return NextResponse.json({ s: "no_data" });
  }

  const intervalSec = resolutionToSeconds(resolution);
  const rng = seedRandom(symbol + resolution);

  // Generate candles going back from 'to'
  const candles: number[][] = [];
  let price = basePrice * 0.94;
  let time = to;
  const maxCandles = Math.min(countback, 500);

  for (let i = 0; i < maxCandles; i++) {
    const open = price;
    // Random walk with slight upward bias
    const change = (rng() - 0.47) * basePrice * 0.012;
    const close = open + change;
    const wickUp = rng() * basePrice * 0.004;
    const wickDown = rng() * basePrice * 0.004;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const vol = Math.floor((rng() * 5000 + 500) * (basePrice > 0.1 ? 1 : 1000));

    candles.unshift([time, Math.max(0, low), Math.max(0, high), close > 0 ? close : open, open > 0 ? open : close, vol]);

    time -= intervalSec;
    price = close > 0 ? close : open;
  }

  // Latest candle should end near current price
  const lastCandle = candles[candles.length - 1];
  if (lastCandle) {
    const drift = (basePrice - lastCandle[4]) * 0.3;
    lastCandle[2] = Math.max(lastCandle[2], lastCandle[4] + drift);
    lastCandle[3] = lastCandle[4] + drift;
    lastCandle[4] = lastCandle[4] + drift;
  }

  return NextResponse.json({
    s: "ok",
    t: candles.map(c => c[0]),
    o: candles.map(c => c[4]),
    h: candles.map(c => c[2]),
    l: candles.map(c => c[1]),
    c: candles.map(c => c[3]),
    v: candles.map(c => c[5]),
  });
}
