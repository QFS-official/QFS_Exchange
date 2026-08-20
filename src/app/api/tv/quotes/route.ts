import { NextRequest, NextResponse } from "next/server";

const TOKEN_PRICES: Record<string, number> = {
  GCRMUSDT: 1.245,
  QFSUSDT: 0.00342,
  ALARABUSDT: 0.0856,
  NESGUSDT: 0.0521,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolsStr = searchParams.get("symbols") || "";
  const symbols = symbolsStr.split(",");

  const quotes: Record<string, Record<string, unknown>> = {};
  for (const raw of symbols) {
    const sym = raw.trim().replace(/[^A-Z]/g, "");
    const basePrice = TOKEN_PRICES[sym];
    if (!basePrice) continue;
    const variance = basePrice * 0.003;
    const price = basePrice + (Math.random() - 0.5) * variance;
    const change = (Math.random() - 0.45) * basePrice * 0.02;
    quotes[raw.trim()] = {
      n: sym.replace("USDT", "/USDT"),
      v: Math.floor(Math.random() * 50000 + 5000),
      lp: parseFloat(price.toFixed(6)),
      ch: parseFloat(change.toFixed(6)),
      chp: parseFloat(((change / basePrice) * 100).toFixed(2)),
    };
  }

  return NextResponse.json(quotes);
}
