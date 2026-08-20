"use client";

import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";
import { useEffect, useState, useCallback } from "react";
import { BookOpen } from "lucide-react";

interface OBEntry {
  price: number;
  amount: number;
  total: number;
}

interface TradeEntry {
  id: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
  time: string;
}

interface OBData {
  bids: OBEntry[];
  asks: OBEntry[];
  spread: number;
  bestBid: number;
  bestAsk: number;
  trades?: TradeEntry[];
}

export function OrderBook() {
  const { selectedPairIndex, prices } = useExchangeStore();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const priceData = prices[pair.base.cgId ?? ""];
  const currentPrice = priceData?.usd ?? 0;
  const [viewMode, setViewMode] = useState<"both" | "bids" | "asks">("both");
  const [obData, setObData] = useState<OBData | null>(null);
  const [trades, setTrades] = useState<TradeEntry[]>([]);

  const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;

  const fetchOrderBook = useCallback(async () => {
    try {
      const res = await fetch(`/api/orderbook?pair=${pairKey}&depth=20&trades=true`);
      if (res.ok) {
        const data = await res.json();
        setObData({
          bids: data.bids || [],
          asks: data.asks || [],
          spread: data.spread || 0,
          bestBid: data.bestBid || 0,
          bestAsk: data.bestAsk || 0,
        });
        if (data.trades) {
          setTrades(data.trades.map((t: { price: number; amount: number; side: string; createdAt: string }) => ({
            id: t.id,
            price: t.price,
            amount: t.amount,
            side: t.side as "buy" | "sell",
            time: new Date(t.createdAt).toLocaleTimeString("en-US", { hour12: false }),
          })));
        }
      }
    } catch (e) {
      console.warn("[OrderBook] Fetch failed:", e);
    }
  }, [pairKey]);

  useEffect(() => {
    fetchOrderBook();
    const iv = setInterval(fetchOrderBook, 2000);
    return () => clearInterval(iv);
  }, [fetchOrderBook]);

  const isUp = (priceData?.usd_24h_change ?? 0) >= 0;
  const displayPrice = obData ? ((obData.bestBid + obData.bestAsk) / 2) : currentPrice;
  const spread = obData && displayPrice > 0
    ? ((obData.spread / displayPrice) * 100).toFixed(3)
    : "0.000";

  const asks = obData?.asks || [];
  const bids = obData?.bids || [];
  const displayAsks = viewMode === "bids" ? [] : asks;
  const displayBids = viewMode === "asks" ? [] : bids;
  const maxRows = viewMode === "both" ? 12 : 24;

  // Calculate percentage bars
  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1]?.total : 1;
  const maxAskTotal = asks.length > 0 ? asks[asks.length - 1]?.total : 1;

  return (
    <div className="bg-[#1E2329] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-[#848E9C]" />
          <span className="text-xs font-semibold text-[#848E9C]">Order Book</span>
        </div>
        <div className="flex items-center bg-[#2B3139] rounded p-0.5">
          {(["both", "bids", "asks"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                viewMode === m ? "bg-[#363C45] text-white" : "text-[#5E6673] hover:text-[#848E9C]"
              }`}
            >
              {m === "both" ? "Both" : m === "bids" ? "Bids" : "Asks"}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 pb-1 text-[10px] text-[#5E6673] uppercase tracking-wider shrink-0">
        <span>Price(USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sells) — reversed so lowest ask is at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end px-3">
        {displayAsks.length === 0 && displayBids.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-[#5E6673]">
            <BookOpen className="w-6 h-6 mb-2 opacity-40" />
            <span className="text-[11px]">Sin libro de ordenes</span>
            <span className="text-[10px] opacity-60 mt-0.5">Selecciona un par tradeable</span>
          </div>
        )}
        {displayAsks.slice(-maxRows).map((a, i) => {
          const pct = maxAskTotal > 0 ? (a.total / maxAskTotal) * 100 : 0;
          return (
            <div
              key={`a-${i}`}
              className="relative grid grid-cols-3 text-[11px] px-0.5 py-[1px] cursor-pointer hover:bg-[#F6465D]/5 transition"
              onClick={() => useExchangeStore.getState().setPrice(a.price < 1 ? a.price.toFixed(4) : a.price.toFixed(2))}
            >
              <div
                className="absolute right-0 top-0 h-full bg-[#F6465D]/8"
                style={{ width: `${pct}%` }}
              />
              <span className="relative z-10 text-[#F6465D] font-mono">
                {a.price < 1 ? a.price.toFixed(4) : a.price.toFixed(2)}
              </span>
              <span className="relative z-10 text-right text-[#848E9C] font-mono">
                {a.amount < 1 ? a.amount.toFixed(4) : a.amount.toFixed(0)}
              </span>
              <span className="relative z-10 text-right text-[#5E6673] font-mono">
                {a.total.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spread / Current Price */}
      <div className={`px-3 py-1.5 shrink-0 flex items-center justify-between border-y border-[#2B3139]/50 ${
        isUp ? "bg-[#02C076]/5" : "bg-[#F6465D]/5"
      }`}>
        <div className="flex items-center space-x-2">
          <span className={`text-base font-bold font-mono ${isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
            {displayPrice > 0
              ? (displayPrice < 1 ? displayPrice.toFixed(4) : displayPrice.toFixed(2))
              : (currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2))}
          </span>
          <span className={`text-[9px] ${isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
            {isUp ? "\u25B2" : "\u25BC"}
          </span>
        </div>
        <span className="text-[10px] text-[#5E6673]">Spread: {spread}%</span>
      </div>

      {/* Bids (buys) */}
      <div className="flex-1 overflow-hidden flex flex-col px-3">
        {displayBids.slice(0, maxRows).map((b, i) => {
          const pct = maxBidTotal > 0 ? (b.total / maxBidTotal) * 100 : 0;
          return (
            <div
              key={`b-${i}`}
              className="relative grid grid-cols-3 text-[11px] px-0.5 py-[1px] cursor-pointer hover:bg-[#02C076]/5 transition"
              onClick={() => useExchangeStore.getState().setPrice(b.price < 1 ? b.price.toFixed(4) : b.price.toFixed(2))}
            >
              <div
                className="absolute right-0 top-0 h-full bg-[#02C076]/8"
                style={{ width: `${pct}%` }}
              />
              <span className="relative z-10 text-[#02C076] font-mono">
                {b.price < 1 ? b.price.toFixed(4) : b.price.toFixed(2)}
              </span>
              <span className="relative z-10 text-right text-[#848E9C] font-mono">
                {b.amount < 1 ? b.amount.toFixed(4) : b.amount.toFixed(0)}
              </span>
              <span className="relative z-10 text-right text-[#5E6673] font-mono">
                {b.total.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent Trades */}
      <div className="border-t border-[#2B3139] px-3 py-1.5 shrink-0">
        <div className="grid grid-cols-3 text-[10px] text-[#5E6673] mb-1">
          <span>Time</span>
          <span className="text-right">Price(USDT)</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="max-h-[120px] overflow-y-auto">
          {trades.length > 0 ? trades.map((t, i) => (
            <div key={t.id || i} className="grid grid-cols-3 text-[11px] py-[0.5px]">
              <span className="text-[#5E6673] font-mono">{t.time}</span>
              <span className={`text-right font-mono font-semibold ${t.side === "buy" ? "text-[#02C076]" : "text-[#F6465D]"}`}>
                {t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2)}
              </span>
              <span className="text-right text-[#848E9C] font-mono">
                {t.amount < 1 ? t.amount.toFixed(4) : t.amount.toFixed(0)}
              </span>
            </div>
          )) : (
            <div className="text-center text-[10px] text-[#5E6673] py-3">No trades yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
