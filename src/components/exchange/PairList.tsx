"use client";

import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS, POPULAR_PAIRS } from "@/lib/tokens/config";
import { Search, Star, StarOff, Filter } from "lucide-react";
import { useState, useMemo, Fragment } from "react";

const PAIR_TABS = ["Favoritos", "Spot", "Futuros", "Options"] as const;
type PairTab = (typeof PAIR_TABS)[number];

const TOKEN_LOGOS: Record<string, { bg: string; letter: string }> = {
  GCRM:  { bg: "bg-gradient-to-br from-yellow-500 to-orange-500", letter: "G" },
  QFS:   { bg: "bg-gradient-to-br from-blue-500 to-cyan-500", letter: "Q" },
  ALARAB:{ bg: "bg-gradient-to-br from-green-500 to-emerald-500", letter: "A" },
  NESG:  { bg: "bg-gradient-to-br from-purple-500 to-pink-500", letter: "N" },
  BTC:   { bg: "bg-[#F7931A]", letter: "B" },
  ETH:   { bg: "bg-[#627EEA]", letter: "E" },
  BNB:   { bg: "bg-[#F0B90B]", letter: "B" },
  SOL:   { bg: "bg-gradient-to-br from-purple-400 to-purple-600", letter: "S" },
  XRP:   { bg: "bg-gray-700", letter: "X" },
  ADA:   { bg: "bg-gradient-to-br from-blue-600 to-blue-800", letter: "A" },
  DOGE:  { bg: "bg-gradient-to-br from-yellow-400 to-yellow-600", letter: "D" },
  DOT:   { bg: "bg-gradient-to-br from-pink-500 to-pink-700", letter: "D" },
  AVAX:  { bg: "bg-gradient-to-br from-red-500 to-red-700", letter: "A" },
  LINK:  { bg: "bg-gradient-to-br from-blue-500 to-indigo-600", letter: "L" },
};

export function PairList() {
  const { selectedPairIndex, setPairIndex, prices } = useExchangeStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<PairTab>("Spot");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BTC", "ETH"]));

  const q = search.toLowerCase();

  const filteredGcrm = useMemo(() =>
    TRADING_PAIRS.filter((p) =>
      p.base.symbol.toLowerCase().includes(q) || p.base.name.toLowerCase().includes(q)
    ),
    [q]
  );

  const filteredPopular = useMemo(() =>
    POPULAR_PAIRS.filter((p) =>
      p.symbol.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    ),
    [q]
  );

  const toggleFav = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const displayList = activeTab === "Favoritos"
    ? [...filteredGcrm.filter((p) => favorites.has(p.base.symbol)), ...filteredPopular.filter((p) => favorites.has(p.symbol))]
    : [...filteredGcrm, ...filteredPopular];

  const gcrmCount = activeTab === "Favoritos"
    ? filteredGcrm.filter((p) => favorites.has(p.base.symbol)).length
    : filteredGcrm.length;

  return (
    <div className="bg-[#1E2329] h-full flex flex-col">
      {/* Search + Filter row */}
      <div className="px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5E6673]" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#2B3139] rounded pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-3 pt-1 pb-0 border-b border-[#2B3139]">
        {PAIR_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2.5 py-2 text-[11px] font-semibold transition relative whitespace-nowrap ${
              activeTab === tab
                ? "text-[#F0B90B]"
                : "text-[#5E6673] hover:text-[#848E9C]"
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0B90B]" />}
          </button>
        ))}
        <div className="flex-1" />
        <button className="p-1.5 text-[#5E6673] hover:text-[#848E9C] transition">
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-[#5E6673] uppercase tracking-wider border-b border-[#2B3139] shrink-0">
        <span>Symbol</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h Change</span>
      </div>

      {/* Pair rows */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {displayList.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-[#5E6673] text-xs">
            {activeTab === "Favoritos" ? "No favorites yet" : "No pairs found"}
          </div>
        ) : (
          displayList.map((pair, i) => {
            const isGcrm = i < gcrmCount;
            const showSectionDivider = i === gcrmCount && gcrmCount > 0 && gcrmCount < displayList.length;
            const symbol = isGcrm ? pair.base.symbol : pair.symbol;
            const name = isGcrm ? pair.base.name : pair.name;
            const cgId = isGcrm ? (pair as typeof TRADING_PAIRS[0]).base.cgId ?? "" : pair.cgId;
            const priceData = prices[cgId];
            const price = priceData?.usd ?? 0;
            const change = priceData?.usd_24h_change ?? 0;
            const isUp = change >= 0;
            const isActive = isGcrm ? TRADING_PAIRS.indexOf(pair as typeof TRADING_PAIRS[0]) === selectedPairIndex : false;
            const isFav = favorites.has(symbol);
            const logo = TOKEN_LOGOS[symbol] || { bg: "bg-[#2B3139]", letter: symbol[0] };

            return (
              <Fragment key={symbol}>
                {showSectionDivider && (
                  <div className="flex items-center px-3 pt-2.5 pb-1">
                    <span className="text-[9px] font-bold text-[#5E6673] uppercase tracking-widest">Otros Activos</span>
                    <span className="ml-2 text-[9px] text-[#5E6673]/50">Solo informativo</span>
                    <div className="flex-1 border-t border-[#2B3139] ml-2" />
                  </div>
                )}
                <button
                onClick={() => isGcrm && setPairIndex(TRADING_PAIRS.indexOf(pair as typeof TRADING_PAIRS[0]))}
                className={`w-full grid grid-cols-3 items-center px-3 py-1.5 text-left transition group ${
                  isActive ? "bg-[#F0B90B]/5" : isGcrm ? "hover:bg-[#2B3139]/40" : "opacity-60"
                }`}
              >
                {/* Symbol + name */}
                <div className="flex items-center space-x-2 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFav(symbol); }}
                    className="shrink-0 transition"
                  >
                    {isFav ? (
                      <Star className="w-3 h-3 text-[#F0B90B] fill-[#F0B90B]" />
                    ) : (
                      <StarOff className="w-3 h-3 text-[#5E6673] opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs font-semibold ${isActive ? "text-[#F0B90B]" : isGcrm ? "text-white" : "text-[#848E9C]"}`}>{symbol}</span>
                      <span className="text-[10px] text-[#5E6673]">/USDT</span>
                      {!isGcrm && (
                        <span className="text-[8px] bg-[#2B3139] text-[#5E6673] px-1 rounded leading-tight">INFO</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5E6673] truncate">{name}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <span className={`text-xs font-mono ${isActive ? "text-[#F0B90B]" : isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
                    {price ? (price < 1 ? price.toFixed(4) : price < 100 ? price.toFixed(2) : price.toLocaleString(undefined, { maximumFractionDigits: 1 })) : "—"}
                  </span>
                </div>

                {/* Change % with mini bar */}
                <div className="text-right flex items-center justify-end space-x-1.5">
                  <div className="w-12 h-1 bg-[#2B3139] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isUp ? "bg-[#02C076]" : "bg-[#F6465D]"}`}
                      style={{ width: `${Math.min(Math.abs(change) * 2, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-mono font-semibold w-14 text-right ${isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
                    {isUp ? "+" : ""}{change.toFixed(2)}%
                  </span>
                </div>
              </button>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}