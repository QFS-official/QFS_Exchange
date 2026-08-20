"use client";

import { useState, useCallback } from "react";
import { ChartArea } from "./ChartArea";
import { OrderBook } from "./OrderBook";
import { TradeForm } from "./TradeForm";
import { BottomPanel } from "./BottomPanel";
import { PairList } from "./PairList";
import { BarChart3, BookOpen, ArrowUpDown, ClipboardList, List } from "lucide-react";
import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";

const TABS = [
  { id: "chart" as const, label: "Grafico", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "orderbook" as const, label: "Libro", icon: <BookOpen className="w-4 h-4" /> },
  { id: "pairs" as const, label: "Pares", icon: <List className="w-4 h-4" /> },
  { id: "trade" as const, label: "Trade", icon: <ArrowUpDown className="w-4 h-4" /> },
  { id: "orders" as const, label: "Ordenes", icon: <ClipboardList className="w-4 h-4" /> },
];

type MobileTab = "chart" | "orderbook" | "pairs" | "trade" | "orders";

export function MobileTradingView({ activeMode }: { activeMode: string }) {
  const [activeTab, setActiveTab] = useState<MobileTab>("chart");
  const { selectedPairIndex, setPairIndex, prices } = useExchangeStore();
  const [showPicker, setShowPicker] = useState(false);

  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const priceData = prices[pair.base.cgId ?? ""];
  const price = priceData?.usd ?? 0;
  const change = priceData?.usd_24h_change ?? 0;
  const isUp = change >= 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0E11] relative">
      <div className="bg-[#1E2329] border-b border-[#2B3139] px-3 py-2 flex items-center justify-between shrink-0 relative z-30">
        <button onClick={() => setShowPicker(!showPicker)} className="flex items-center space-x-2">
          <span className="text-sm font-bold text-white">{pair.base.symbol}</span>
          <span className="text-xs text-[#5E6673]">/ {pair.quote.symbol}</span>
          <svg className="w-3 h-3 text-[#5E6673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="text-right">
          <div className={`text-sm font-bold font-mono ${isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
            {price > 0 ? (price < 1 ? price.toFixed(4) : price.toFixed(2)) : "---"}
          </div>
          <div className={`text-[10px] font-mono ${isUp ? "text-[#02C076]" : "text-[#F6465D]"}`}>
            {isUp ? "+" : ""}{change.toFixed(2)}%
          </div>
        </div>
      </div>

      {showPicker && (
        <div className="absolute inset-x-0 top-0 bottom-0 z-40 bg-black/50" onClick={() => setShowPicker(false)}>
          <div className="absolute top-0 left-0 right-0 bg-[#1E2329] max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2B3139]">
              <span className="text-sm font-bold text-white">Seleccionar Par</span>
              <button onClick={() => setShowPicker(false)} className="text-[#5E6673]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {TRADING_PAIRS.map((p, i) => {
              const pd = prices[p.base.cgId ?? ""];
              const pr = pd?.usd ?? 0;
              const ch = pd?.usd_24h_change ?? 0;
              const up = ch >= 0;
              return (
                <button key={i} onClick={() => { setPairIndex(i); setShowPicker(false); }} className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#2B3139]/50 transition ${i === selectedPairIndex ? "bg-[#F0B90B]/10" : "active:bg-[#2B3139]"}`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F0B90B]/30 to-[#F0B90B]/10 flex items-center justify-center text-xs font-bold text-[#F0B90B]">{p.base.symbol[0]}</div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{p.base.symbol}<span className="text-[#5E6673]">/{p.quote.symbol}</span></div>
                      <div className="text-[10px] text-[#5E6673]">{p.base.chainName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white">{pr > 0 ? (pr < 1 ? pr.toFixed(4) : pr.toFixed(2)) : "---"}</div>
                    <div className={`text-[10px] font-mono ${up ? "text-[#02C076]" : "text-[#F6465D]"}`}>{up ? "+" : ""}{ch.toFixed(2)}%</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeTab === "chart" && <ChartArea />}
        {activeTab === "orderbook" && <OrderBook />}
        {activeTab === "pairs" && <div className="h-full overflow-hidden"><PairList /></div>}
        {activeTab === "trade" && activeMode !== "futures" && <TradeForm />}
        {activeTab === "orders" && <BottomPanel />}
      </div>

      <div className="bg-[#1E2329] border-t border-[#2B3139] flex items-center shrink-0">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2 transition relative ${activeTab === tab.id ? "text-[#F0B90B]" : "text-[#5E6673] active:text-[#848E9C]"}`}>
            {activeTab === tab.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#F0B90B] rounded-b" />}
            {tab.icon}
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
