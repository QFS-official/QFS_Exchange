"use client";

import { useState } from "react";
import {
  Bot, Play, Pause, Square, Plus, Settings, TrendingUp, TrendingDown,
  ChevronRight, ChevronDown, X, Zap, Clock, ArrowUpRight, ArrowDownRight,
  AlertTriangle, CheckCircle2, BarChart3, Activity, Sliders, Target,
  LineChart, Shield, RefreshCw, Copy, Trash2, Eye, Info, Wallet,
} from "lucide-react";

/* ============================================================
   STRATEGY DEFINITIONS
   ============================================================ */
const STRATEGIES = [
  {
    id: "grid",
    name: "Grid Trading",
    desc: "Coloca ordenes en una cuadricula de precios para capturar ganancias en mercados laterales",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "from-[#8B5CF6] to-[#A78BFA]",
    colorBg: "bg-[#8B5CF6]/10",
    colorText: "text-[#8B5CF6]",
    colorBorder: "border-[#8B5CF6]/20",
    risk: "Medio",
    minInvestment: "100 USDT",
    bestFor: "Mercados laterales",
    popular: true,
  },
  {
    id: "dca",
    name: "DCA (Promedio Dollar)",
    desc: "Invierte una cantidad fija a intervalos regulares para reducir el impacto de la volatilidad",
    icon: <LineChart className="w-5 h-5" />,
    color: "from-[#3B82F6] to-[#60A5FA]",
    colorBg: "bg-[#3B82F6]/10",
    colorText: "text-[#3B82F6]",
    colorBorder: "border-[#3B82F6]/20",
    risk: "Bajo",
    minInvestment: "10 USDT",
    bestFor: "Inversiones a largo plazo",
    popular: true,
  },
  {
    id: "rsi",
    name: "RSI Reversal",
    desc: "Compra en sobreventa y vende en sobrecompra basado en el indicador RSI",
    icon: <Activity className="w-5 h-5" />,
    color: "from-[#F59E0B] to-[#FBBF24]",
    colorBg: "bg-[#F59E0B]/10",
    colorText: "text-[#F59E0B]",
    colorBorder: "border-[#F59E0B]/20",
    risk: "Medio",
    minInvestment: "50 USDT",
    bestFor: "Reversiones de tendencia",
    popular: false,
  },
  {
    id: "macd",
    name: "MACD Crossover",
    desc: "Senales de compra/venta basadas en cruces de MACD y su linea de senal",
    icon: <Target className="w-5 h-5" />,
    color: "from-[#02C076] to-[#2ECC71]",
    colorBg: "bg-[#02C076]/10",
    colorText: "text-[#02C076]",
    colorBorder: "border-[#02C076]/20",
    risk: "Medio-Alto",
    minInvestment: "50 USDT",
    bestFor: "Seguimiento de tendencia",
    popular: false,
  },
  {
    id: "bollinger",
    name: "Bollinger Bands",
    desc: "Opera en los rebotes de las bandas de Bollinger superior e inferior",
    icon: <Sliders className="w-5 h-5" />,
    color: "from-[#EC4899] to-[#F472B6]",
    colorBg: "bg-[#EC4899]/10",
    colorText: "text-[#EC4899]",
    colorBorder: "border-[#EC4899]/20",
    risk: "Medio",
    minInvestment: "100 USDT",
    bestFor: "Mercados con volatilidad",
    popular: false,
  },
  {
    id: "scalping",
    name: "Scalping Bot",
    desc: "Operaciones de alta frecuencia con pequenos movimientos de precio y ganancias rapidas",
    icon: <Zap className="w-5 h-5" />,
    color: "from-[#EF4444] to-[#F87171]",
    colorBg: "bg-[#EF4444]/10",
    colorText: "text-[#EF4444]",
    colorBorder: "border-[#EF4444]/20",
    risk: "Alto",
    minInvestment: "200 USDT",
    bestFor: "Traders experimentados",
    popular: false,
  },
];

const PAIRS = ["GCRM/USDT", "QFS/USDT", "ALARAB/USDT", "NESG/USDT"];

interface BotConfig {
  id: string;
  name: string;
  strategyId: string;
  pair: string;
  investment: string;
  status: "running" | "paused" | "stopped";
  pnl: string;
  pnlPercent: string;
  trades: number;
  winRate: string;
  createdAt: string;
}

/* ============================================================
   SIMULATED ACTIVE BOTS
   ============================================================ */
const SAMPLE_BOTS: BotConfig[] = [
  { id: "b1", name: "Grid Bot GCRM", strategyId: "grid", pair: "GCRM/USDT", investment: "500 USDT", status: "running", pnl: "+45.23", pnlPercent: "+9.05%", trades: 24, winRate: "75%", createdAt: "2024-01-15" },
  { id: "b2", name: "DCA QFS Weekly", strategyId: "dca", pair: "QFS/USDT", investment: "200 USDT", status: "running", pnl: "+12.80", pnlPercent: "+6.40%", trades: 8, winRate: "100%", createdAt: "2024-01-20" },
  { id: "b3", name: "RSI ALARAB", strategyId: "rsi", pair: "ALARAB/USDT", investment: "300 USDT", status: "paused", pnl: "-8.50", pnlPercent: "-2.83%", trades: 12, winRate: "58%", createdAt: "2024-01-10" },
];

export function TradingBotContent() {
  const [view, setView] = useState<"landing" | "strategies" | "my-bots" | "create">("landing");
  const [bots, setBots] = useState<BotConfig[]>(SAMPLE_BOTS);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotPair, setNewBotPair] = useState(PAIRS[0]);
  const [newBotInvestment, setNewBotInvestment] = useState("");
  const [expandedBot, setExpandedBot] = useState<string | null>(null);

  const runningBots = bots.filter((b) => b.status === "running").length;
  const totalPnl = bots.reduce((sum, b) => sum + parseFloat(b.pnl), 0);
  const isPositivePnl = totalPnl >= 0;

  function handleCreateBot() {
    if (!newBotName || !newBotInvestment || !selectedStrategy) return;
    const strat = STRATEGIES.find((s) => s.id === selectedStrategy);
    const newBot: BotConfig = {
      id: `b${Date.now()}`,
      name: newBotName,
      strategyId: selectedStrategy,
      pair: newBotPair,
      investment: `${newBotInvestment} USDT`,
      status: "stopped",
      pnl: "0.00",
      pnlPercent: "0.00%",
      trades: 0,
      winRate: "0%",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setBots([newBot, ...bots]);
    setNewBotName("");
    setNewBotInvestment("");
    setSelectedStrategy(null);
    setShowCreateModal(false);
    setView("my-bots");
  }

  function toggleBotStatus(id: string) {
    setBots(bots.map((b) => {
      if (b.id !== id) return b;
      const newStatus = b.status === "running" ? "paused" : "running";
      return { ...b, status: newStatus as BotConfig["status"] };
    }));
  }

  function deleteBot(id: string) {
    setBots(bots.filter((b) => b.id !== id));
  }

  /* ========== LANDING VIEW ========== */
  if (view === "landing") {
    return (
      <div className="flex flex-col items-center justify-start min-h-full bg-[#0B0E11] px-4 py-12 overflow-y-auto">
        {/* Hero section */}
        <div className="text-center max-w-[560px] mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#8B5CF6]/20">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Trading Bot</h1>
          <p className="text-sm text-[#848E9C] leading-relaxed max-w-[420px] mx-auto">
            Trades Inteligentes Simplificados. Configura estrategias automatizadas de trading sin necesidad de vigilancia constante.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-6 mb-10 w-full max-w-[480px]">
          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#8B5CF6]">20+</p>
            <p className="text-[11px] text-[#5E6673] mt-1">Estrategias</p>
          </div>
          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#8B5CF6]">500+</p>
            <p className="text-[11px] text-[#5E6673] mt-1">Coins</p>
          </div>
          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#8B5CF6]">99.9%</p>
            <p className="text-[11px] text-[#5E6673] mt-1">Uptime</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center space-x-4 mb-16">
          <button
            onClick={() => setView("strategies")}
            className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-bold text-sm hover:opacity-90 transition flex items-center space-x-2 shadow-lg shadow-[#8B5CF6]/20"
          >
            <Plus className="w-4 h-4" /><span>Crear Bot</span>
          </button>
          {bots.length > 0 && (
            <button
              onClick={() => setView("my-bots")}
              className="px-8 py-3.5 rounded-lg border border-[#2B3139] text-white font-bold text-sm hover:bg-[#2B3139] transition flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" /><span>Mis Bots ({bots.length})</span>
            </button>
          )}
        </div>

        {/* Features grid */}
        <div className="w-full max-w-[800px] grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Shield className="w-5 h-5 text-[#8B5CF6]" />, title: "Seguro", desc: "Tus fondos permanecen en tu wallet. El bot solo ejecuta ordenes con tu permiso." },
            { icon: <Zap className="w-5 h-5 text-[#8B5CF6]" />, title: "Rapido", desc: "Ejecucion instantanea de ordenes con latencia de microsegundos." },
            { icon: <BarChart3 className="w-5 h-5 text-[#8B5CF6]" />, title: "Analisis Avanzado", desc: "Indicadores tecnicos potentes para decisiones informadas de trading." },
          ].map((feat, i) => (
            <div key={i} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center mb-3">{feat.icon}</div>
              <p className="text-sm font-semibold text-white mb-1">{feat.title}</p>
              <p className="text-[11px] text-[#5E6673] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========== STRATEGIES VIEW ========== */
  if (view === "strategies") {
    return (
      <div className="min-h-full bg-[#0B0E11] overflow-y-auto">
        <div className="max-w-[900px] mx-auto p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <button onClick={() => setView("landing")} className="text-[#848E9C] hover:text-white transition">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Seleccionar Estrategia</h1>
              <p className="text-xs text-[#5E6673] mt-0.5">Elige una estrategia de trading automatizado para tu bot</p>
            </div>
          </div>

          {/* Strategy cards grid */}
          <div className="space-y-3">
            {STRATEGIES.map((strat) => (
              <button
                key={strat.id}
                onClick={() => { setSelectedStrategy(strat.id); setShowCreateModal(true); }}
                className={"w-full text-left rounded-xl border p-5 transition hover:bg-[#181A20] group " + strat.colorBorder + " bg-[#181A20]/50"}
              >
                <div className="flex items-start space-x-4">
                  <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + strat.color + " flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-transform"}>
                    {strat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-bold text-white">{strat.name}</h3>
                      {strat.popular && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6]">POPULAR</span>}
                    </div>
                    <p className="text-xs text-[#848E9C] leading-relaxed line-clamp-2">{strat.desc}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={"text-[10px] font-medium px-2 py-0.5 rounded " + (strat.risk === "Bajo" ? "bg-[#02C076]/10 text-[#02C076]" : strat.risk === "Alto" ? "bg-[#EF4444]/10 text-[#EF4444]" : "bg-[#F59E0B]/10 text-[#F59E0B]")}>{strat.risk}</span>
                      <span className="text-[10px] text-[#5E6673]">Min: {strat.minInvestment}</span>
                      <span className="text-[10px] text-[#5E6673]">Ideal: {strat.bestFor}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#2B3139] group-hover:text-[#8B5CF6] transition shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Bot Modal */}
        {showCreateModal && selectedStrategy && (
          <CreateBotModal
            strategy={STRATEGIES.find((s) => s.id === selectedStrategy)!}
            name={newBotName} onNameChange={setNewBotName}
            pair={newBotPair} onPairChange={setNewBotPair}
            investment={newBotInvestment} onInvestmentChange={setNewBotInvestment}
            onConfirm={handleCreateBot}
            onClose={() => { setShowCreateModal(false); setSelectedStrategy(null); }}
          />
        )}
      </div>
    );
  }

  /* ========== MY BOTS VIEW ========== */
  if (view === "my-bots") {
    return (
      <div className="min-h-full bg-[#0B0E11] overflow-y-auto">
        <div className="max-w-[900px] mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <button onClick={() => setView("landing")} className="text-[#848E9C] hover:text-white transition">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Mis Bots</h1>
                <p className="text-xs text-[#5E6673] mt-0.5">Gestiona y monitorea tus bots de trading</p>
              </div>
            </div>
            <button
              onClick={() => { setView("strategies"); }}
              className="px-4 py-2 rounded-lg bg-[#8B5CF6] text-white font-bold text-xs hover:opacity-90 transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" /><span>Crear Bot</span>
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
              <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Total Bots</p>
              <p className="text-xl font-bold text-white">{bots.length}</p>
            </div>
            <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
              <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">En ejecucion</p>
              <p className="text-xl font-bold text-[#02C076]">{runningBots}</p>
            </div>
            <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
              <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">PnL Total</p>
              <p className={"text-xl font-bold " + (isPositivePnl ? "text-[#02C076]" : "text-[#F6465D]")}>{isPositivePnl ? "+" : ""}{totalPnl.toFixed(2)} USDT</p>
            </div>
            <div className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
              <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Total Trades</p>
              <p className="text-xl font-bold text-white">{bots.reduce((s, b) => s + b.trades, 0)}</p>
            </div>
          </div>

          {/* Bot list */}
          {bots.length === 0 ? (
            <div className="text-center py-16">
              <Bot className="w-16 h-16 text-[#2B3139] mx-auto mb-4" />
              <p className="text-sm text-[#848E9C] mb-4">No tienes bots creados</p>
              <button onClick={() => setView("strategies")}
                className="px-6 py-2.5 rounded-lg bg-[#8B5CF6] text-white font-bold text-xs hover:opacity-90 transition inline-flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5" /><span>Crear tu primer Bot</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {bots.map((bot) => {
                const strat = STRATEGIES.find((s) => s.id === bot.strategyId);
                const isExpanded = expandedBot === bot.id;
                const pnlVal = parseFloat(bot.pnl);
                return (
                  <div key={bot.id} className={"rounded-xl border overflow-hidden transition " + (isExpanded ? "border-[#2B3139] bg-[#181A20]" : "border-[#2B3139]/50 bg-[#181A20]/50 hover:border-[#2B3139]")}>
                    {/* Bot row header */}
                    <div className="flex items-center px-5 py-4">
                      <div className={"w-10 h-10 rounded-lg bg-gradient-to-br " + (strat?.color || "from-[#8B5CF6] to-[#A78BFA]") + " flex items-center justify-center shrink-0 text-white mr-4"}>
                        {strat?.icon || <Bot className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-0.5">
                          <p className="text-sm font-bold text-white truncate">{bot.name}</p>
                          <div className={"flex items-center space-x-1 text-[10px] font-medium px-1.5 py-0.5 rounded " + (bot.status === "running" ? "bg-[#02C076]/10 text-[#02C076]" : bot.status === "paused" ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#2B3139] text-[#5E6673]")}>
                            {bot.status === "running" ? <><div className="w-1.5 h-1.5 rounded-full bg-[#02C076] animate-pulse" /><span>Activo</span></> : bot.status === "paused" ? <><Clock className="w-3 h-3" /><span>Pausado</span></> : <><Square className="w-2.5 h-2.5" /><span>Detenido</span></>}
                          </div>
                        </div>
                        <p className="text-[11px] text-[#5E6673]">{bot.pair} · {bot.investment} · {strat?.name || "Strategy"}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className={"text-sm font-bold " + (pnlVal >= 0 ? "text-[#02C076]" : "text-[#F6465D]")}>{pnlVal >= 0 ? "+" : ""}{bot.pnl} USDT</p>
                        <p className={"text-[10px] " + (pnlVal >= 0 ? "text-[#02C076]/70" : "text-[#F6465D]/70")}>{bot.pnlPercent}</p>
                      </div>
                      <button onClick={() => setExpandedBot(isExpanded ? null : bot.id)} className="text-[#5E6673] hover:text-white transition p-1">
                        <ChevronDown className={"w-4 h-4 transition-transform " + (isExpanded ? "rotate-180" : "")} />
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-[#2B3139] px-5 py-4 bg-[#0B0E11]/50">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div><p className="text-[10px] text-[#5E6673]">Estrategia</p><p className="text-xs font-semibold text-white mt-0.5">{strat?.name}</p></div>
                          <div><p className="text-[10px] text-[#5E6673]">Par</p><p className="text-xs font-semibold text-white mt-0.5">{bot.pair}</p></div>
                          <div><p className="text-[10px] text-[#5E6673]">Inversion</p><p className="text-xs font-semibold text-white mt-0.5">{bot.investment}</p></div>
                          <div><p className="text-[10px] text-[#5E6673]">Creado</p><p className="text-xs font-semibold text-white mt-0.5">{bot.createdAt}</p></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-5">
                          <div className="bg-[#181A20] rounded-lg p-3 text-center"><p className="text-lg font-bold text-white">{bot.trades}</p><p className="text-[10px] text-[#5E6673]">Trades</p></div>
                          <div className="bg-[#181A20] rounded-lg p-3 text-center"><p className="text-lg font-bold text-white">{bot.winRate}</p><p className="text-[10px] text-[#5E6673]">Win Rate</p></div>
                          <div className="bg-[#181A20] rounded-lg p-3 text-center"><p className={"text-lg font-bold " + (pnlVal >= 0 ? "text-[#02C076]" : "text-[#F6465D]")}>{pnlVal >= 0 ? "+" : ""}{bot.pnlPercent}</p><p className="text-[10px] text-[#5E6673]">PnL</p></div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => toggleBotStatus(bot.id)} className={"flex-1 py-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center space-x-1.5 " + (bot.status === "running" ? "bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20" : "bg-[#02C076]/10 text-[#02C076] hover:bg-[#02C076]/20 border border-[#02C076]/20")}>
                            {bot.status === "running" ? <><Pause className="w-3.5 h-3.5" /><span>Pausar</span></> : <><Play className="w-3.5 h-3.5" /><span>{bot.status === "stopped" ? "Iniciar" : "Reanudar"}</span></>}
                          </button>
                          <button className="py-2.5 px-4 rounded-lg bg-[#2B3139] text-[#848E9C] hover:text-white hover:bg-[#363C45] transition text-xs flex items-center space-x-1.5">
                            <Settings className="w-3.5 h-3.5" /><span>Config</span>
                          </button>
                          <button onClick={() => deleteBot(bot.id)} className="py-2.5 px-4 rounded-lg bg-[#F6465D]/5 text-[#F6465D] hover:bg-[#F6465D]/10 transition text-xs flex items-center space-x-1.5">
                            <Trash2 className="w-3.5 h-3.5" /><span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/* ============================================================
   CREATE BOT MODAL
   ============================================================ */
function CreateBotModal({ strategy, name, onNameChange, pair, onPairChange, investment, onInvestmentChange, onConfirm, onClose }: {
  strategy: typeof STRATEGIES[0];
  name: string; onNameChange: (v: string) => void;
  pair: string; onPairChange: (v: string) => void;
  investment: string; onInvestmentChange: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const inputCls = "w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 transition placeholder:text-[#5E6673]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#181A20] border border-[#2B3139] rounded-2xl w-full max-w-[460px] mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + strategy.color + " flex items-center justify-center text-white"}>
              {strategy.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Crear Bot</h2>
              <p className="text-[11px] text-[#5E6673]">{strategy.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5E6673] hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Nombre del Bot</label>
            <input type="text" placeholder={strategy.name + " Bot"} value={name} onChange={(e) => onNameChange(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Par de Trading</label>
            <select value={pair} onChange={(e) => onPairChange(e.target.value)} className={inputCls}>
              {PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#848E9C] mb-1.5 block font-medium">Monto de Inversion (USDT)</label>
            <input type="number" placeholder="Ej: 100" min={10} value={investment} onChange={(e) => onInvestmentChange(e.target.value)} className={inputCls} />
            <p className="text-[10px] text-[#5E6673] mt-1">Minimo: {strategy.minInvestment}</p>
          </div>

          {/* Risk warning */}
          <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-lg px-4 py-3 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-[#F59E0B]">Riesgo: {strategy.risk}</p>
              <p className="text-[10px] text-[#848E9C] mt-0.5">El trading automatizado conlleva riesgos. Los resultados pasados no garantizan resultados futuros. Invierte solo lo que puedas permitirte perder.</p>
            </div>
          </div>

          {/* Strategy info */}
          <div className="bg-[#0B0E11] rounded-lg p-4">
            <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-2">Resumen de estrategia</p>
            <p className="text-xs text-[#B7BDC6] leading-relaxed">{strategy.desc}</p>
            <div className="flex items-center space-x-4 mt-3">
              <span className={"text-[10px] font-medium px-2 py-0.5 rounded " + (strategy.risk === "Bajo" ? "bg-[#02C076]/10 text-[#02C076]" : strategy.risk === "Alto" ? "bg-[#EF4444]/10 text-[#EF4444]" : "bg-[#F59E0B]/10 text-[#F59E0B]")}>{strategy.risk}</span>
              <span className="text-[10px] text-[#5E6673]">Min: {strategy.minInvestment}</span>
              <span className="text-[10px] text-[#5E6673]">Ideal: {strategy.bestFor}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 px-6 py-4 border-t border-[#2B3139]">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-[#2B3139] text-white font-bold text-sm hover:bg-[#2B3139] transition">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={!name || !investment || parseFloat(investment) < 10}
            className={"flex-1 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 " + (!name || !investment ? "bg-[#8B5CF6]/30 text-white/50 cursor-not-allowed" : "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white hover:opacity-90")}
          >
            <Bot className="w-4 h-4" /><span>Crear Bot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
