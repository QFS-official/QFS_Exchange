import { NextResponse } from "next/server";

let priceCache: Record<string, PriceData> = {};
let lastFetch = 0;
const CACHE_TTL = 60_000;

interface PriceData {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
  usd_24h_high?: number;
  usd_24h_low?: number;
}

async function fetchCoinGecko(): Promise<Record<string, PriceData>> {
  const ids = [
    "gcrm-token","qfs-token","alarab-token","nesg-token",
    "tether",
    "bitcoin","ethereum","binancecoin","solana","ripple",
    "cardano","dogecoin","polkadot","avalanche-2","chainlink"
  ].join(",");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error(`CG ${res.status}`);
    const data = await res.json();
    const out: Record<string, PriceData> = {};
    for (const coin of data as Array<Record<string, unknown>>) {
      const id = coin.id as string;
      out[id] = {
        usd: coin.current_price as number,
        usd_24h_change: coin.price_change_percentage_24h as number,
        usd_24h_vol: coin.total_volume as number,
        usd_market_cap: coin.market_cap as number,
        usd_24h_high: coin.high_24h as number,
        usd_24h_low: coin.low_24h as number,
      };
    }
    return out;
  } catch (e) {
    console.warn("CoinGecko fetch failed:", e);
    return {};
  }
}

export async function GET() {
  const now = Date.now();
  if (now - lastFetch < CACHE_TTL && Object.keys(priceCache).length > 0) {
    return NextResponse.json(priceCache);
  }

  const cg = await fetchCoinGecko();
  priceCache = { ...cg };

  const fallbacks: Record<string, PriceData> = {
    "gcrm-token":  { usd: 1.245,   usd_24h_change: 4.32,  usd_24h_vol: 45_200_000,    usd_market_cap: 124_500_000,    usd_24h_high: 1.28,   usd_24h_low: 1.18 },
    "qfs-token":   { usd: 0.00342, usd_24h_change: -1.2,  usd_24h_vol: 1_200_000,     usd_market_cap: 3_400_000 },
    "alarab-token": { usd: 0.0856,  usd_24h_change: 2.15,  usd_24h_vol: 890_000,       usd_market_cap: 8_560_000 },
    "nesg-token":  { usd: 0.0521,  usd_24h_change: -0.8,  usd_24h_vol: 320_000,       usd_market_cap: 5_210_000 },
    tether:         { usd: 1.0,     usd_24h_change: 0.01,  usd_24h_vol: 52_000_000_000, usd_market_cap: 139_000_000_000 },
    bitcoin:        { usd: 61200,   usd_24h_change: 1.05,  usd_24h_vol: 28_000_000_000, usd_market_cap: 1_200_000_000_000, usd_24h_high: 61500, usd_24h_low: 60200 },
    ethereum:       { usd: 3120,    usd_24h_change: -0.85, usd_24h_vol: 15_000_000_000, usd_market_cap: 375_000_000_000,  usd_24h_high: 3180,  usd_24h_low: 3080 },
    binancecoin:    { usd: 705,     usd_24h_change: 0.62,  usd_24h_vol: 1_800_000_000,  usd_market_cap: 103_000_000_000,  usd_24h_high: 712,   usd_24h_low: 698 },
    solana:         { usd: 178.5,   usd_24h_change: 3.21,  usd_24h_vol: 4_200_000_000,  usd_market_cap: 82_000_000_000,   usd_24h_high: 182,   usd_24h_low: 172 },
    ripple:         { usd: 0.624,   usd_24h_change: -0.42, usd_24h_vol: 2_100_000_000,  usd_market_cap: 34_000_000_000,   usd_24h_high: 0.635, usd_24h_low: 0.618 },
    cardano:        { usd: 0.458,   usd_24h_change: 1.87,  usd_24h_vol: 620_000_000,    usd_market_cap: 16_000_000_000,   usd_24h_high: 0.468, usd_24h_low: 0.449 },
    dogecoin:       { usd: 0.1582,  usd_24h_change: 5.12,  usd_24h_vol: 2_800_000_000,  usd_market_cap: 23_000_000_000,   usd_24h_high: 0.163, usd_24h_low: 0.15 },
    polkadot:       { usd: 7.42,    usd_24h_change: -1.55, usd_24h_vol: 420_000_000,    usd_market_cap: 10_000_000_000,   usd_24h_high: 7.58,  usd_24h_low: 7.32 },
    "avalanche-2": { usd: 38.6,    usd_24h_change: 2.34,  usd_24h_vol: 780_000_000,    usd_market_cap: 15_000_000_000,   usd_24h_high: 39.2,  usd_24h_low: 37.5 },
    chainlink:      { usd: 18.45,   usd_24h_change: 1.12,  usd_24h_vol: 920_000_000,    usd_market_cap: 11_000_000_000,   usd_24h_high: 18.8,  usd_24h_low: 18.1 },
  };

  for (const [k, v] of Object.entries(fallbacks)) {
    if (!priceCache[k]) priceCache[k] = v;
  }

  lastFetch = now;
  return NextResponse.json(priceCache);
}
