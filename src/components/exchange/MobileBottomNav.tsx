"use client";

import { BarChart3, Gift, UsersRound, MessageSquare, Menu, X, Zap, Bot, Monitor, Rocket, Gamepad2, Shield, Layers, ArrowLeftRight, TrendingUp, Link2, PiggyBank, Receipt, Landmark } from "lucide-react";
import { useState } from "react";

interface MobileBottomNavProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

const MAIN_NAV = [
  { id: "spot", label: "Trade", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "airdrop", label: "Airdrop", icon: <Gift className="w-5 h-5" /> },
  { id: "copy-trading", label: "Copy", icon: <UsersRound className="w-5 h-5" /> },
  { id: "tradegpt", label: "TradeGPT", icon: <MessageSquare className="w-5 h-5" /> },
  { id: "more", label: "Mas", icon: <Menu className="w-5 h-5" /> },
] as const;

const ALL_NAV_SECTIONS = [
  { label: "Trading", items: [
    { id: "spot", icon: <BarChart3 className="w-4 h-4" />, title: "Spot" },
    { id: "margin", icon: <TrendingUp className="w-4 h-4" />, title: "Margin" },
    { id: "futures", icon: <TrendingUp className="w-4 h-4" />, title: "Futuros" },
    { id: "onchain", icon: <Link2 className="w-4 h-4" />, title: "Onchain" },
  ]},
  { label: "Herramientas", items: [
    { id: "copy-trading", icon: <UsersRound className="w-4 h-4" />, title: "Copy Trading" },
    { id: "trading-bot", icon: <Bot className="w-4 h-4" />, title: "Trading Bot" },
    { id: "tradegpt", icon: <MessageSquare className="w-4 h-4" />, title: "TradeGPT" },
    { id: "tradingview", icon: <Monitor className="w-4 h-4" />, title: "TradingView" },
  ]},
  { label: "Explorar", items: [
    { id: "airdrop", icon: <Gift className="w-4 h-4" />, title: "Airdrop GCRM" },
    { id: "launchhub", icon: <Rocket className="w-4 h-4" />, title: "Launchhub" },
    { id: "testnet", icon: <Gamepad2 className="w-4 h-4" />, title: "Trading de Prueba" },
    { id: "earn", icon: <PiggyBank className="w-4 h-4" />, title: "Earn" },
  ]},
  { label: "Finanzas", items: [
    { id: "convert", icon: <ArrowLeftRight className="w-4 h-4" />, title: "Convert" },
    { id: "history", icon: <Receipt className="w-4 h-4" />, title: "Historial" },
    { id: "loans", icon: <Landmark className="w-4 h-4" />, title: "Prestamos" },
    { id: "position-builder", icon: <Layers className="w-4 h-4" />, title: "Constructor" },
  ]},
  { label: "Admin", items: [
    { id: "admin-panel", icon: <Shield className="w-4 h-4" />, title: "Admin Panel" },
  ]},
];

export function MobileBottomNav({ activeMode, onModeChange }: MobileBottomNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (mode: string) => {
    onModeChange(mode);
    setDrawerOpen(false);
  };

  return (
    <>
      <div className="bg-[#1E2329] border-t border-[#2B3139] flex items-center shrink-0 pb-[env(safe-area-inset-bottom)]">
        {MAIN_NAV.map((item) => {
          const active = item.id === "more" ? false : activeMode === item.id;
          if (item.id === "more") {
            return (
              <button key="more" onClick={() => setDrawerOpen(true)} className="flex-1 flex flex-col items-center py-2 text-[#5E6673] active:text-[#848E9C] transition">
                {item.icon}
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          }
          return (
            <button key={item.id} onClick={() => handleNav(item.id)} className={`flex-1 flex flex-col items-center py-2 transition relative ${active ? "text-[#F0B90B]" : "text-[#5E6673] active:text-[#848E9C]"}`}>
              {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#F0B90B] rounded-b" />}
              {item.icon}
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDrawerOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#1E2329] rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#363C45]" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2B3139]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black" />
                </div>
                <span className="text-sm font-bold text-white">GCRM Exchange</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-[#5E6673] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              {ALL_NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <div className="px-1 mb-2">
                    <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest">{section.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {section.items.map((item) => {
                      const active = activeMode === item.id;
                      return (
                        <button key={item.id} onClick={() => handleNav(item.id)} className={`flex flex-col items-center py-3 rounded-xl transition ${active ? "bg-[#F0B90B]/15 text-[#F0B90B]" : "bg-[#2B3139] text-[#848E9C] active:bg-[#363C45]"}`}>
                          <span className="mb-1.5">{item.icon}</span>
                          <span className="text-[11px] font-medium leading-tight text-center">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}