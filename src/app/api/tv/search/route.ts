import { NextRequest, NextResponse } from "next/server";

const TOKENS = [
  { symbol: "GCRMUSDT", full_name: "GCRM Exchange:GCRMUSDT", description: "GCRM / USDT" },
  { symbol: "QFSUSDT", full_name: "GCRM Exchange:QFSUSDT", description: "QFS / USDT" },
  { symbol: "ALARABUSDT", full_name: "GCRM Exchange:ALARABUSDT", description: "ALARAB / USDT" },
  { symbol: "NESGUSDT", full_name: "GCRM Exchange:NESGUSDT", description: "NESG / USDT" },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || "").toUpperCase();

  const filtered = TOKENS.filter(
    (t) =>
      t.symbol.includes(query) ||
      t.description.toUpperCase().includes(query) ||
      t.full_name.toUpperCase().includes(query)
  );

  return NextResponse.json(filtered);
}
