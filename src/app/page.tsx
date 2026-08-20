"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { Wallet, LogIn, Menu, X, Zap, Search } from "lucide-react";
import { Web3Provider } from "@/components/exchange/Web3Provider";
import { Header } from "@/components/exchange/Header";
import { PairList } from "@/components/exchange/PairList";
import { ChartArea } from "@/components/exchange/ChartArea";
import { OrderBook } from "@/components/exchange/OrderBook";
import { TradeForm } from "@/components/exchange/TradeForm";
import { FuturesTradeForm } from "@/components/exchange/FuturesTradeForm";
import { TradeSidebar } from "@/components/exchange/TradeSidebar";
import { TickerBar } from "@/components/exchange/TickerBar";
import { BottomPanel } from "@/components/exchange/BottomPanel";
import { DashboardContent } from "@/components/exchange/DashboardContent";
import { AirdropContent } from "@/components/exchange/AirdropContent";
import { AdminPanel } from "@/components/exchange/AdminPanel";
import { StakingContent } from "@/components/exchange/StakingContent";
import SupportContent from "@/components/exchange/SupportContent";
import WalletContent from "@/components/exchange/WalletContent";
import ConvertContent from "@/components/exchange/ConvertContent";
import LoansContent from "@/components/exchange/LoansContent";
import ProfileContent from "@/components/exchange/ProfileContent";
import SecurityContent from "@/components/exchange/SecurityContent";
import VerificationContent from "@/components/exchange/VerificationContent";
import TermsContent from "@/components/exchange/TermsContent";
import { ProgramsContent } from "@/components/exchange/ProgramsContent";
import { TradingBotContent } from "@/components/exchange/TradingBotContent";
import { MobileTradingView } from "@/components/exchange/MobileTradingView";
import { MobileBottomNav } from "@/components/exchange/MobileBottomNav";
import { useExchangeStore } from "@/lib/store";

const TRADE_MODES = new Set(["spot", "futures", "margin", "onchain"]);
const WALLET_MODES = new Set(["wallet-overview", "wallet-deposit", "wallet-withdraw", "wallet-transfer", "wallet-history"]);

type WalletMode = "wallet-overview" | "wallet-deposit" | "wallet-withdraw" | "wallet-transfer" | "wallet-history";

const MOBILE_MENU = [
  { section: "Trade", items: [
    { id: "spot", label: "Spot" },
    { id: "margin", label: "Margin" },
    { id: "futures", label: "Futuros" },
    { id: "onchain", label: "Onchain" },
  ]},
  { section: "Herramientas", items: [
    { id: "copy-trading", label: "Copy Trading" },
    { id: "trading-bot", label: "Trading Bot" },
    { id: "tradegpt", label: "TradeGPT" },
  ]},
  { section: "Explorar", items: [
    { id: "staking", label: "Earn" },
    { id: "airdrop", label: "Airdrop GCRM" },
    { id: "launchhub", label: "Launchhub" },
    { id: "testnet", label: "Trading de Prueba" },
    { id: "convert", label: "Convert" },
    { id: "history", label: "Historial" },
    { id: "wallet-overview", label: "Wallet" },
  ]},
  { section: "Admin", items: [
    { id: "admin-panel", label: "Admin Panel" },
  ]},
];

export default function Page() {
  return (
    <Web3Provider>
      <ExchangeContent />
    </Web3Provider>
  );
}

function MobileHeader({ activeMode, onModeChange }: { activeMode: string; onModeChange: (m: string) => void }) {
  const { isConnected, address, disconnect } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  return (
    <>
      <header className="bg-[#1E2329] border-b border-[#2B3139] px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={() => setMenuOpen(true)} className="text-[#848E9C] hover:text-white transition p-0.5">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="text-sm font-bold text-white">GCRM</span>
          </div>
        </div>
        <div className="flex-1 max-w-[200px] mx-3">
          <div className="bg-[#2B3139] rounded-full px-3 py-1.5 flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-[#5E6673]" />
            <span className="text-[11px] text-[#5E6673]">Buscar...</span>
          </div>
        </div>
        {isConnected && address ? (
          <div className="flex items-center space-x-2">
            <div className="bg-[#2B3139] rounded-full px-2.5 py-1.5">
              <span className="text-[11px] text-white font-mono">{shortAddr}</span>
            </div>
            <button onClick={() => disconnect()} className="text-[#5E6673] p-0.5">
              <LogIn className="w-4 h-4 rotate-180" />
            </button>
          </div>
        ) : (
          <button className="flex items-center space-x-1.5 bg-[#F0B90B] text-black font-bold text-[11px] px-3 py-1.5 rounded-full">
            <Wallet className="w-3.5 h-3.5" />
            <span>Wallet</span>
          </button>
        )}
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-[#1E2329] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2B3139]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black" />
                </div>
                <span className="text-base font-bold text-white">GCRM Exchange</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="text-[#5E6673]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 space-y-4">
              {MOBILE_MENU.map((section) => (
                <div key={section.section}>
                  <div className="px-2 mb-1.5">
                    <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest">{section.section}</span>
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = activeMode === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { onModeChange(item.id); setMenuOpen(false); }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                            active ? "bg-[#F0B90B]/15 text-[#F0B90B] font-semibold" : "text-[#848E9C] active:bg-[#2B3139]"
                          }`}
                        >{item.label}</button>
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

function ExchangeContent() {
  const setPrices = useExchangeStore((s) => s.setPrices);
  const { address } = useAccount();
  const [activeMode, setActiveMode] = useState("spot");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const isTradingView = TRADE_MODES.has(activeMode);

  function handleTradeModeChange(mode: string) { setActiveMode(mode); }

  // Listen for cross-component navigation events
  useEffect(() => {
    function onNavigate(e: Event) {
      const mode = (e as CustomEvent).detail;
      if (typeof mode === 'string') setActiveMode(mode);
    }
    window.addEventListener('gcrm-navigate', onNavigate);
    return () => window.removeEventListener('gcrm-navigate', onNavigate);
  }, []);

  // Generate session ID once
  useEffect(() => {
    if (!sessionStorage.getItem("gcrm_session")) {
      sessionStorage.setItem("gcrm_session", crypto.randomUUID());
    }
  }, []);

  // Track visitor on mount + page/wallet change
  useEffect(() => {
    const sessionId = sessionStorage.getItem("gcrm_session");
    if (!sessionId) return;
    const track = () => {
      fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, walletAddress: address || null, page: activeMode }),
      }).catch(() => {});
    };
    track();
    const iv = setInterval(track, 30000); // ping every 30s
    return () => clearInterval(iv);
  }, [address, activeMode]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function initEngine() {
      try {
        const res = await fetch("/api/init-engine");
        if (res.ok) console.log("[Exchange] Order engine initialized");
      } catch (e) { console.warn("[Exchange] Engine init failed:", e); }
    }
    initEngine();
  }, []);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch("/api/prices");
        if (res.ok) setPrices(await res.json());
      } catch (e) { console.warn("Price fetch failed:", e); }
    }
    fetchPrices();
    const iv = setInterval(fetchPrices, 60_000);
    return () => clearInterval(iv);
  }, [setPrices]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-dvh flex flex-col bg-[#0B0E11] overflow-hidden">
        <MobileHeader activeMode={activeMode} onModeChange={handleTradeModeChange} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {isTradingView ? (
            <MobileTradingView activeMode={activeMode} />
          ) : activeMode === "convert" ? (
            <ConvertContent />
          ) : activeMode === "loans" ? (
            <LoansContent />
          ) : activeMode === "profile" ? (
            <ProfileContent />
          ) : activeMode === "security" ? (
            <SecurityContent />
          ) : activeMode === "verification" ? (
            <VerificationContent />
          ) : activeMode === "terms" ? (
            <TermsContent />
          ) : activeMode === "programs" || activeMode === "rewards" || activeMode === "vip" || activeMode === "livestream" || activeMode === "referrals" || activeMode === "affiliates" || activeMode === "soporte-vip" ? (
            <ProgramsContent onNavigate={handleTradeModeChange} initialProgram={activeMode !== "programs" ? activeMode : undefined} />
          ) : WALLET_MODES.has(activeMode) ? (
            <WalletContent mode={activeMode as WalletMode} />
          ) : activeMode === "airdrop" ? (
            <AirdropContent />
          ) : activeMode === "admin-panel" ? (
            <AdminPanel />
          ) : activeMode === "staking" || activeMode === "earn" ? (
            <StakingContent />
          ) : activeMode === "soporte" || activeMode === "help" ? (
            <SupportContent onTradeModeChange={handleTradeModeChange} />
          ) : activeMode === "trading-bot" ? (
            <TradingBotContent />
          ) : (
            <DashboardContent activeMode={activeMode} />
          )}
        </div>
        <MobileBottomNav activeMode={activeMode} onModeChange={handleTradeModeChange} />
      </div>
    );
  }

  // Desktop layout — sidebar ALWAYS visible
  return (
    <div className="h-screen flex flex-col bg-[#0B0E11] overflow-hidden">
      <Header onTradeModeChange={handleTradeModeChange} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      {isTradingView && <TickerBar />}
      <div id="trade" className="flex-1 flex overflow-hidden">
        {/* Sidebar — always visible on desktop */}
        <div className={`${sidebarOpen ? "w-[200px]" : "w-0"} shrink-0 overflow-hidden transition-all duration-200 hidden lg:flex flex-col border-r border-[#2B3139]`}>
          <TradeSidebar activeMode={activeMode} onModeChange={handleTradeModeChange} />
        </div>
        {/* Main content area */}
        {isTradingView ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              <div className="w-[260px] shrink-0 border-r border-[#2B3139] hidden lg:flex flex-col">
                <PairList />
              </div>
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChartArea />
              </div>
              <div className="w-[240px] shrink-0 border-l border-[#2B3139] hidden lg:flex flex-col">
                <OrderBook />
              </div>
              <div className="w-[260px] shrink-0 border-l border-[#2B3139] hidden lg:flex flex-col">
                {activeMode === "futures" ? <FuturesTradeForm /> : <TradeForm />}
              </div>
            </div>
            <BottomPanel />
          </div>
        ) : activeMode === "convert" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><ConvertContent /></div>
        ) : activeMode === "loans" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><LoansContent /></div>
        ) : activeMode === "profile" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><ProfileContent /></div>
        ) : activeMode === "security" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><SecurityContent /></div>
        ) : activeMode === "verification" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><VerificationContent /></div>
        ) : activeMode === "terms" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><TermsContent /></div>
        ) : activeMode === "programs" || activeMode === "rewards" || activeMode === "vip" || activeMode === "livestream" || activeMode === "referrals" || activeMode === "affiliates" || activeMode === "soporte-vip" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><ProgramsContent onNavigate={handleTradeModeChange} initialProgram={activeMode !== "programs" ? activeMode : undefined} /></div>
        ) : WALLET_MODES.has(activeMode) ? (
          <div className="flex-1 overflow-hidden bg-[#0B0E11]"><WalletContent mode={activeMode as WalletMode} /></div>
        ) : activeMode === "airdrop" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><AirdropContent /></div>
        ) : activeMode === "admin-panel" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><AdminPanel /></div>
        ) : activeMode === "staking" || activeMode === "earn" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><StakingContent /></div>
        ) : activeMode === "soporte" || activeMode === "help" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><SupportContent onTradeModeChange={handleTradeModeChange} /></div>
        ) : activeMode === "trading-bot" ? (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><TradingBotContent /></div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-[#0B0E11]"><DashboardContent activeMode={activeMode} /></div>
        )}
      </div>
    </div>
  );
}
