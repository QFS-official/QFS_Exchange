"use client";

import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";
import { useState, useEffect } from "react";

export function TickerBar() {
  const { selectedPairIndex, prices } = useExchangeStore();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const priceData = prices[pair.base.cgId ?? ""];
  const currentPrice = priceData?.usd ?? 1.245;
  const change24h = priceData?.usd_24h_change ?? 4.32;
  const vol24h = priceData?.usd_24h_vol ?? 0;
  const high24h = priceData?.usd_24h_high ?? currentPrice * 1.03;
  const low24h = priceData?.usd_24h_low ?? currentPrice * 0.97;
  const isUp = change24h >= 0;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => setBlink((b) => !b), 1500);
    return () => clearInterval(iv);
  }, []);

  const priceStr = currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice < 100 ? currentPrice.toFixed(2) : currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const markPrice = (currentPrice * (1 + (Math.random() - 0.5) * 0.001)).toFixed(currentPrice < 1 ? 4 : 2);
  const indexPrice = (currentPrice * (1 + (Math.random() - 0.5) * 0.0008)).toFixed(currentPrice < 1 ? 4 : 2);
  const fundingRate = ((Math.random() - 0.4) * 0.01).toFixed(4);
  const countdown = `${Math.floor(Math.random() * 8) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;

  return (
    <div className="bg-[#1E2329] border-b border-[#2B3139] px-4 py-1.5 flex items-center space-x-6 text-xs shrink-0 select-none">
      {/* Pair + Price */}
      <div className="flex items-center space-x-2.5">
        <span className="text-sm font-bold text-white">
          {pair.base.symbol}
          <span className="text-[#5E6673] font-normal">/{pair.quote.symbol}</span>
        </span>
        <span className={`text-lg font-bold tabular-nums ${blink ? (isUp ? "text-[#02C076]" : "text-[#F6465D]") : (isUp ? "text-[#02C076]" : "text-[#F6465D]")}`}>
          {priceStr}
        </span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isUp ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#F6465D]/10 text-[#F6465D]"}`}>
          {isUp ? "+" : ""}{change24h.toFixed(2)}%
        </span>
      </div>

      {/* 24h Stats */}
      <div className="flex items-center space-x-5 text-[#848E9C]">
        <div className="flex items-center space-x-1.5">
          <span>24h High</span>
          <span className="text-white font-mono">{high24h < 1 ? high24h.toFixed(4) : high24h.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>24h Low</span>
          <span className="text-white font-mono">{low24h < 1 ? low24h.toFixed(4) : low24h.toFixed(2)}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>24h Vol({pair.quote.symbol})</span>
          <span className="text-white font-mono">{vol24h > 0 ? (vol24h > 1e9 ? (vol24h / 1e9).toFixed(2) + "B" : vol24h > 1e6 ? (vol24h / 1e6).toFixed(2) + "M" : vol24h.toFixed(0)) : "12.45M"}</span>
        </div>
      </div>

      {/* Futures info */}
      <div className="flex items-center space-x-5 text-[#848E9C]">
        <div className="flex items-center space-x-1.5">
          <span>Mark</span>
          <span className="text-white font-mono">{markPrice}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>Index</span>
          <span className="text-white font-mono">{indexPrice}</span>
        </div>
        <div className={`flex items-center space-x-1.5 ${parseFloat(fundingRate) >= 0 ? "text-[#02C076]" : "text-[#F6465D]"}`}>
          <span>Funding</span>
          <span className="font-mono font-semibold">{fundingRate}%</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>Countdown</span>
          <span className="text-[#F0B90B] font-mono font-semibold">{countdown}</span>
        </div>
      </div>
    </div>
  );
}
