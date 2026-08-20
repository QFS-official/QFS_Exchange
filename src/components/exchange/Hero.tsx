"use client";

import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";

export function Hero() {
  const prices = useExchangeStore((s) => s.prices);
  const primary = TRADING_PAIRS[0]; // GCRM/USDT
  const priceData = prices[primary.base.cgId ?? ""];

  const price = priceData?.usd ?? 1.245;
  const change = priceData?.usd_24h_change ?? 4.32;
  const vol = priceData?.usd_24h_vol ?? 45_200_000;
  const mcap = priceData?.usd_market_cap ?? 124_500_000;
  const high = priceData?.usd_24h_high ?? 1.28;
  const low = priceData?.usd_24h_low ?? 1.18;

  const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(n < 1 ? 4 : 2)}`;
  };

  const isUp = change >= 0;

  return (
    <section className="border-b border-[#1e2128] bg-[#080a0e] relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute right-0 top-0 opacity-[0.06] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <img
          src="https://z-cdn-media.chatglm.cn/files/3c28d43c-ee48-494e-bc56-b9bd23f089e3.png?auth_key=1886312091-4c408bb552b8424e983f1f1b23e85a5c-0-81f3969ec84b3f1e46fceb0342d8e2a8"
          alt=""
          className="h-96 w-96 object-contain"
        />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded uppercase font-semibold">
                Primary Token
              </span>
              <span className="text-gray-500 text-sm">gcrmaster.org</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
              GCRM <span className="bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">Exchange</span>
            </h1>
            <p className="text-gray-400 max-w-xl mb-6 text-sm leading-relaxed">
              The premier institutional-grade trading platform. Secure, fast, and
              scalable architecture built for the future of digital assets. Trade
              GCRM, QFS, and ALARAB with real on-chain contracts.
            </p>
            <div className="flex space-x-4">
              <a
                href="#trade"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold px-6 py-3 rounded-md hover:from-yellow-400 hover:to-yellow-500 transition shadow-lg shadow-yellow-500/20"
              >
                TRADE GCRM
              </a>
              <button className="border border-yellow-500 text-yellow-500 font-bold px-6 py-3 rounded-md hover:bg-yellow-500 hover:text-black transition">
                JOIN AIRDROP
              </button>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <StatCard label="GCRM Price" value={`$${price.toFixed(price < 1 ? 4 : 3)}`} sub={`${isUp ? "+" : ""}${change.toFixed(2)}%`} up={isUp} />
            <StatCard label="24h Volume" value={fmt(vol)} />
            <StatCard label="Market Cap" value={fmt(mcap)} />
            <StatCard label="24h High / Low" value={`${fmt(high)} / ${fmt(low)}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="bg-[#0d0f14] border border-[#1e2128] p-4 rounded-lg min-w-[155px]">
      <p className="text-gray-500 text-xs uppercase mb-1 tracking-wide">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-white">
        {value}{' '}
        {sub !== undefined && (
          <span className={up ? 'text-green-500' : 'text-red-500'} style={{ fontSize: '0.75em' }}>{sub}</span>
        )}
      </p>
    </div>
  );
}
