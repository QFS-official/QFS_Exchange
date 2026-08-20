import { NextRequest, NextResponse } from "next/server";

const TOKEN_CONFIG: Record<string, { price: number; decimals: number; minmov: number; pricescale: number; description: string }> = {
  GCRMUSDT: { price: 1.245, decimals: 3, minmov: 0.001, pricescale: 1000, description: "GCRM Token" },
  QFSUSDT: { price: 0.00342, decimals: 5, minmov: 0.00001, pricescale: 100000, description: "QFS Token" },
  ALARABUSDT: { price: 0.0856, decimals: 4, minmov: 0.0001, pricescale: 10000, description: "ALARAB Token" },
  NESGUSDT: { price: 0.0521, decimals: 4, minmov: 0.0001, pricescale: 10000, description: "NESG Token" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").replace(/[^A-Z]/g, "");

  const cfg = TOKEN_CONFIG[symbol];
  if (!cfg) {
    return NextResponse.json({ s: "no_symbol" });
  }

  // Add small random variation to price for live feel
  const variance = cfg.price * 0.002;
  const currentPrice = cfg.price + (Math.random() - 0.5) * variance;

  return NextResponse.json({
    name: symbol.replace("USDT", "/USDT"),
    exchange: "GCRM",
    ticker: symbol,
    description: cfg.description,
    type: "crypto",
    session: "24x7",
    timezone: "Etc/UTC",
    supported_resolutions: ["1", "5", "15", "60", "240", "D", "W", "M"],
    has_intraday: true,
    has_daily: true,
    has_weekly: true,
    has_monthly: true,
    pricescale: cfg.pricescale,
    minmov: cfg.minmov,
    minmove2: 0,
    fractional: false,
    format: "price",
    price_precision: cfg.decimals,
    volume_precision: 2,
  });
}