"use client";

import { Gift, Diamond, Play, UserPlus, Globe, Headphones, Users, Bot, MessageSquare, Monitor, Wallet, ChevronRight, Zap, ExternalLink, Sparkles, ArrowRight, Star, Crown, Shield, Clock, TrendingUp, Radio, Video, Bell, MessageCircle, Eye, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface ProgramsContentProps {
  onNavigate?: (mode: string) => void;
  initialProgram?: string;
}

const HERRAMIENTAS = [
  { id: "copy-trading", icon: <Users className="w-5 h-5" />, title: "Copy Trading", desc: "Copia las mejores estrategias por expertos", tag: null },
  { id: "trading-bot", icon: <Bot className="w-5 h-5" />, title: "Trading Bot", desc: "Automatiza tus operaciones significativas", tag: "AI" },
  { id: "tradegpt", icon: <MessageSquare className="w-5 h-5" />, title: "TradeGPT", desc: "Trading impulsado por IA", tag: "NEW" },
  { id: "tradingview", icon: <Monitor className="w-5 h-5" />, title: "TradingView", desc: "Herramientas y graficos profesionales", tag: null },
  { id: "wallet-dex", icon: <Wallet className="w-5 h-5" />, title: "Wallet GCRM DEX", desc: "Gestiona tus activos en la DEX de GCRM", tag: null },
];

const PROGRAMS = [
  {
    id: "rewards",
    icon: <Gift className="w-6 h-6" />,
    title: "Rewards Hub",
    desc: "Obten bonos y recompensas por completar",
    longDesc: "Completa tareas simples, misiones diarias y desafios especiales para ganar recompensas exclusivas en tokens GCRM, USDT y mas.",
    color: "from-[#F0B90B]/20 to-[#F0B90B]/5",
    border: "border-[#F0B90B]/20 hover:border-[#F0B90B]/50",
    badge: null,
    stats: [{ label: "Tareas activas", value: "12" }, { label: "Usuarios", value: "45.2K" }],
  },
  {
    id: "vip",
    icon: <Diamond className="w-6 h-6" />, 
    title: "Programa VIP",
    desc: "Obten acceso exclusivo y descuentos en tarifa y mas",
    longDesc: "Disfruta de tarifas reducidas, retiros prioritarios, acceso anticipado a nuevos tokens y beneficios exclusivos para miembros VIP.",
    color: "from-[#C9A84C]/20 to-[#C9A84C]/5",
    border: "border-[#C9A84C]/20 hover:border-[#C9A84C]/50",
    badge: { text: "NEW", bg: "bg-[#F0B90B]", textC: "text-black" },
    stats: [{ label: "Niveles VIP", value: "6" }, { label: "Fee discount", value: "Hasta 60%" }],
  },
  {
    id: "livestream",
    icon: <Play className="w-6 h-6" />,  
    title: "Livestream",
    desc: "Mira transmisiones en vivo para recibir contenido",
    longDesc: "Sintoniza transmisiones en vivo con expertos en criptomonedas, analisis de mercado en tiempo real y sesiones educativas interactivas.",
    color: "from-[#E74C3C]/20 to-[#E74C3C]/5",
    border: "border-[#E74C3C]/20 hover:border-[#E74C3C]/50",
    badge: null,
    stats: [{ label: "Proximos eventos", value: "3" }, { label: "Viewers prom.", value: "8.5K" }],
  },
  {
    id: "referrals",
    icon: <UserPlus className="w-6 h-6" />,  
    title: "Programa de Referidos",
    desc: "Invita 2 amigos y gana $10 En GCRM cada uno",
    longDesc: "Comparte tu enlace de invitacion con amigos. Por cada referred activo, ambos recibiran $10 en GCRM. Sin limite de referidos.",
    color: "from-[#02C076]/20 to-[#02C076]/5",
    border: "border-[#02C076]/20 hover:border-[#02C076]/50",
    badge: { text: "POPULAR", bg: "bg-[#02C076]", textC: "text-white" },
    stats: [{ label: "Recompensa", value: "$10 GCRM" }, { label: "Sin limite", value: "Referrals" }],
  },
  {
    id: "affiliates",
    icon: <Globe className="w-6 h-6" />,  
    title: "Programa de afiliados",
    desc: "Promociona GCRM y obten hasta 50% de comision sobre tarifas de GCRM",
    longDesc: "Conviertete en afiliado de GCRM y gana hasta un 50% de comision sobre las tarifas de trading de tus referidos directos.",
    color: "from-[#3B82F6]/20 to-[#3B82F6]/5",
    border: "border-[#3B82F6]/20 hover:border-[#3B82F6]/50",
    badge: null,
    stats: [{ label: "Comision max", value: "50%" }, { label: "Pagos", value: "Mensuales" }],
  },
  {
    id: "soporte-vip",
    icon: <Headphones className="w-6 h-6" />,  
    title: "Soporte VIP",
    desc: "Mejores prioridades y soporte dedicado 24/7",
    longDesc: "Accede a soporte prioritario las 24 horas, los 7 dias de la semana. Respuestas rapidas y un equipo dedicado para resolver tus consultas.",
    color: "from-[#A855F7]/20 to-[#A855F7]/5",
    border: "border-[#A855F7]/20 hover:border-[#A855F7]/50",
    badge: null,
    stats: [{ label: "Disponibilidad", value: "24/7" }, { label: "Tiempo resp.", value: "< 5 min" }],
  },
];

export function ProgramsContent({ onNavigate, initialProgram }: ProgramsContentProps) {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(initialProgram && PROGRAMS.some(p => p.id === initialProgram) ? initialProgram : null);

  useEffect(() => {
    if (initialProgram && PROGRAMS.some(p => p.id === initialProgram)) {
      setSelectedProgram(initialProgram);
    }
  }, [initialProgram]);

  const handleProgramClick = (id: string) => {
    setSelectedProgram(selectedProgram === id ? null : id);
  };

  const handleToolClick = (id: string) => {
    if (onNavigate) onNavigate(id);
  };

  const activeProgram = PROGRAMS.find((p) => p.id === selectedProgram);

  return (
    <div className="flex h-full bg-[#0B0E11]">
      {/* ===== LEFT SIDEBAR - HERRAMIENTAS ===== */}
      <div className="w-[280px] shrink-0 border-r border-[#2B3139] bg-[#181A20] overflow-y-auto hidden lg:flex flex-col">
        {/* Logo area */}
        <div className="p-5 border-b border-[#2B3139]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">GCRM Ex</p>
              <p className="text-[10px] text-[#5E6673]">Programas y Herramientas</p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-4">
          <div className="bg-[#2B3139] rounded-lg px-3 py-2.5 flex items-center space-x-2">
            <svg className="w-4 h-4 text-[#5E6673]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-xs text-[#5E6673]">Buscar...</span>
          </div>
        </div>

        {/* HERRAMIENTAS section */}
        <div className="px-4 pb-2">
          <p className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest mb-3 px-1">Herramientas</p>
          <div className="space-y-1">
            {HERRAMIENTAS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className="w-full flex items-start space-x-3 px-3 py-3 rounded-lg hover:bg-[#2B3139] transition group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#2B3139] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition text-[#F0B90B]">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-white group-hover:text-[#F0B90B] transition truncate">{tool.title}</p>
                    {tool.tag && (
                      <span className={"text-[9px] font-bold px-1.5 py-0.5 rounded " + (tool.tag === "AI" ? "bg-[#3B82F6]/20 text-[#3B82F6]" : "bg-[#F0B90B] text-black")}>
                        {tool.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5E6673] mt-0.5 line-clamp-1">{tool.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#2B3139] group-hover:text-[#5E6673] shrink-0 mt-1 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* PROGRAMAS section in sidebar */}
        <div className="px-4 pt-4 pb-4 border-t border-[#2B3139] mt-auto">
          <p className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest mb-3 px-1">Programas</p>
          <div className="space-y-1">
            {PROGRAMS.map((prog) => (
              <button
                key={prog.id}
                onClick={() => handleProgramClick(prog.id)}
                className={"w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition text-left " + (selectedProgram === prog.id ? "bg-[#F0B90B]/10" : "hover:bg-[#2B3139]")}
              >
                <div className={"w-7 h-7 rounded-lg bg-[#2B3139] flex items-center justify-center shrink-0 " + (selectedProgram === prog.id ? "text-[#F0B90B]" : "text-[#848E9C]")}>
                  {prog.icon}
                </div>
                <p className={"text-xs font-medium truncate " + (selectedProgram === prog.id ? "text-[#F0B90B]" : "text-[#B7BDC6]")}>{prog.title}</p>
                {prog.badge && (
                  <span className={"ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded " + prog.badge.bg + " " + prog.badge.textC}>
                    {prog.badge.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 overflow-y-auto">
        {!activeProgram ? (
          /* Programs grid view */
          <div className="max-w-[960px] mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="w-6 h-6 text-[#F0B90B]" />
                <h1 className="text-2xl font-bold text-white">Programas</h1>
              </div>
              <p className="text-sm text-[#848E9C]">Descubre todos los programas de GCRM Exchange para maximizar tus ganancias y beneficios</p>
            </div>

            {/* Programs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PROGRAMS.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => handleProgramClick(prog.id)}
                  className={"text-left rounded-xl border p-5 transition-all duration-200 group " + prog.border + " bg-gradient-to-br " + prog.color}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={"w-12 h-12 rounded-xl bg-[#0B0E11]/50 flex items-center justify-center group-hover:scale-110 transition-transform " + (prog.id === "vip" ? "text-[#C9A84C]" : prog.id === "livestream" ? "text-[#E74C3C]" : prog.id === "referrals" ? "text-[#02C076]" : prog.id === "affiliates" ? "text-[#3B82F6]" : prog.id === "soporte-vip" ? "text-[#A855F7]" : "text-[#F0B90B]")}>
                      {prog.icon}
                    </div>
                    {prog.badge && (
                      <span className={"text-[10px] font-bold px-2 py-1 rounded " + prog.badge.bg + " " + prog.badge.textC}>
                        {prog.badge.text}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-[#F0B90B] transition">{prog.title}</h3>
                  <p className="text-xs text-[#848E9C] leading-relaxed mb-4">{prog.desc}</p>
                  <div className="flex items-center space-x-4 pt-3 border-t border-white/5">
                    {prog.stats.map((stat, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-white">{stat.value}</p>
                        <p className="text-[10px] text-[#5E6673]">{stat.label}</p>
                      </div>
                    ))}
                    <ChevronRight className="w-4 h-4 text-[#5E6673] ml-auto group-hover:text-[#F0B90B] group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>

            {/* CTA Banner */}
            <div className="mt-8 rounded-xl border border-[#F0B90B]/20 bg-gradient-to-r from-[#F0B90B]/10 via-[#0B0E11] to-[#0B0E11] p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Comienza a ganar con GCRM</h3>
                <p className="text-sm text-[#848E9C]">Unete a mas de 150,000 traders que ya disfrutan de los beneficios de nuestros programas</p>
              </div>
              <button className="shrink-0 ml-4 px-6 py-3 rounded-lg bg-[#F0B90B] text-black font-bold text-sm hover:bg-[#F8D12F] transition flex items-center space-x-2">
                <span>Explorar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Program detail view */
          <div className="max-w-[800px] mx-auto p-8">
            {/* Back button */}
            <button
              onClick={() => setSelectedProgram(null)}
              className="flex items-center space-x-2 text-[#848E9C] hover:text-white transition mb-6 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-sm">Volver a Programas</span>
            </button>

            {/* Program header */}
            <div className={"rounded-2xl border p-8 mb-6 bg-gradient-to-br " + activeProgram.color + " " + activeProgram.border}>
              <div className="flex items-start space-x-5">
                <div className={"w-16 h-16 rounded-2xl bg-[#0B0E11]/50 flex items-center justify-center " + (activeProgram.id === "vip" ? "text-[#C9A84C]" : activeProgram.id === "livestream" ? "text-[#E74C3C]" : activeProgram.id === "referrals" ? "text-[#02C076]" : activeProgram.id === "affiliates" ? "text-[#3B82F6]" : activeProgram.id === "soporte-vip" ? "text-[#A855F7]" : "text-[#F0B90B]")}>
                  {activeProgram.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{activeProgram.title}</h2>
                    {activeProgram.badge && (
                      <span className={"text-xs font-bold px-2.5 py-1 rounded " + activeProgram.badge.bg + " " + activeProgram.badge.textC}>
                        {activeProgram.badge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#B7BDC6] leading-relaxed">{activeProgram.longDesc}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                {activeProgram.stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-[11px] text-[#5E6673] mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Program-specific content */}
            {activeProgram.id === "referrals" && <ReferralDetail />}
            {activeProgram.id === "vip" && <VipDetail />}
            {activeProgram.id === "rewards" && <RewardsDetail />}
            {activeProgram.id === "affiliates" && <AffiliatesDetail />}
            {activeProgram.id === "livestream" && <LivestreamDetail />}
            {activeProgram.id === "soporte-vip" && <SoporteVipDetail />}
          </div>
        )}
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="w-[300px] shrink-0 border-l border-[#2B3139] bg-[#181A20] overflow-y-auto hidden xl:flex flex-col">
        <div className="p-5 flex-1">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold text-white">GCRM Ex</span>
          </div>

          {!activeProgram ? (
            <>
              <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">Selecciona una seccion del menu lateral para comenzar</p>
              
              {/* Quick stats */}
              <div className="space-y-4 mb-8">
                <div className="bg-[#2B3139] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#02C076]" />
                    <span className="text-xs font-semibold text-[#B7BDC6]">Programas activos</span>
                  </div>
                  <p className="text-2xl font-bold text-white">6</p>
                </div>
                <div className="bg-[#2B3139] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-[#3B82F6]" />
                    <span className="text-xs font-semibold text-[#B7BDC6]">Participantes</span>
                  </div>
                  <p className="text-2xl font-bold text-white">45.2K</p>
                </div>
                <div className="bg-[#2B3139] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-[#F0B90B]" />
                    <span className="text-xs font-semibold text-[#B7BDC6]">Recompensas distribuidas</span>
                  </div>
                  <p className="text-2xl font-bold text-white">$2.4M</p>
                </div>
              </div>

              {/* Upcoming events */}
              <div>
                <p className="text-xs font-bold text-[#5E6673] uppercase tracking-widest mb-3">Proximos eventos</p>
                <div className="space-y-3">
                  <div className="bg-[#2B3139]/50 rounded-lg p-3 border-l-2 border-[#F0B90B]">
                    <p className="text-xs font-semibold text-white">VIP Launch Event</p>
                    <p className="text-[10px] text-[#5E6673] mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" /> <span>En 3 dias</span>
                    </p>
                  </div>
                  <div className="bg-[#2B3139]/50 rounded-lg p-3 border-l-2 border-[#02C076]">
                    <p className="text-xs font-semibold text-white">Airdrop Season 3</p>
                    <p className="text-[10px] text-[#5E6673] mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" /> <span>En 7 dias</span>
                    </p>
                  </div>
                  <div className="bg-[#2B3139]/50 rounded-lg p-3 border-l-2 border-[#3B82F6]">
                    <p className="text-xs font-semibold text-white">Trading Competition</p>
                    <p className="text-[10px] text-[#5E6673] mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" /> <span>En 14 dias</span>
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-bold text-[#5E6673] uppercase tracking-widest mb-3">Accion rapida</p>
              <a
                href={activeProgram?.id === "livestream" ? "https://www.youtube.com/@GCRMExchange" : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-lg bg-[#F0B90B] text-black font-bold text-sm hover:bg-[#F8D12F] transition flex items-center justify-center space-x-2 mb-4"
              >
                <span>{activeProgram?.id === "livestream" ? "Ver en YouTube" : "Participar ahora"}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <div className="bg-[#2B3139] rounded-xl p-4">
                <p className="text-xs text-[#5E6673] mb-1">Estado</p>
                <div className="flex items-center space-x-2">
                  <div className={"w-2 h-2 rounded-full animate-pulse " + (activeProgram?.id === "livestream" ? "bg-[#E74C3C]" : "bg-[#02C076]")} />
                  <span className={"text-sm font-semibold " + (activeProgram?.id === "livestream" ? "text-[#E74C3C]" : "text-[#02C076]")}>
                    {activeProgram?.id === "livestream" ? "En Vivo" : "Activo"}
                  </span>
                </div>
              </div>
              {activeProgram?.id === "livestream" && (
                <div className="mt-4 space-y-3">
                  <div className="bg-[#2B3139] rounded-xl p-4">
                    <p className="text-xs text-[#5E6673] mb-1">Viewers ahora</p>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-[#E74C3C]" />
                      <span className="text-sm font-semibold text-white">2,341</span>
                    </div>
                  </div>
                  <div className="bg-[#2B3139] rounded-xl p-4">
                    <p className="text-xs text-[#5E6673] mb-1">Proximo evento</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-[#F0B90B]" />
                      <span className="text-sm font-semibold text-white">Lun 20:00</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Program Detail Sub-components ===== */

function ReferralDetail() {
  return (
    <div className="space-y-6">
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Como funciona</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Comparte tu enlace", desc: "Obten tu enlace de referido unico y compartelo con amigos" },
            { step: "2", title: "Tu amigo se registra", desc: "Tu referred crea una cuenta y completa la verificacion" },
            { step: "3", title: "Ambos ganan", desc: "Ambos reciben $10 en GCRM directamente en su wallet" },
          ].map((item) => (
            <div key={item.step} className="bg-[#0B0E11] rounded-lg p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-[#02C076]/20 text-[#02C076] font-bold text-sm flex items-center justify-center mx-auto mb-3">{item.step}</div>
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-[11px] text-[#5E6673]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-2">Beneficios del programa</h3>
        <div className="space-y-3 mt-4">
          {[
            { icon: <Gift className="w-4 h-4 text-[#F0B90B]" />, text: "$10 en GCRM por cada referred activo" },
            { icon: <Zap className="w-4 h-4 text-[#F0B90B]" />, text: "Sin limite de referidos - gana ilimitadamente" },
            { icon: <Shield className="w-4 h-4 text-[#F0B90B]" />, text: "Recompensas instantaneas al completar registro" },
            { icon: <TrendingUp className="w-4 h-4 text-[#F0B90B]" />, text: "Dashboard de seguimiento en tiempo real" },
          ].map((item, i) => (
            <div key={i} className="flex items-center space-x-3 bg-[#0B0E11] rounded-lg px-4 py-3">
              {item.icon}
              <span className="text-sm text-[#B7BDC6]">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VipDetail() {
  const levels = [
    { name: "Regular", fee: "0.10%", color: "text-[#848E9C]" },
    { name: "Silver", fee: "0.08%", color: "text-[#B7BDC6]" },
    { name: "Gold", fee: "0.06%", color: "text-[#F0B90B]" },
    { name: "Platinum", fee: "0.04%", color: "text-[#3B82F6]" },
    { name: "Diamond", fee: "0.02%", color: "text-[#A855F7]" },
    { name: "Crown", fee: "0.00%", color: "text-[#C9A84C]" },
  ];
  return (
    <div className="space-y-6">
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Niveles VIP</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {levels.map((lv) => (
            <div key={lv.name} className="bg-[#0B0E11] rounded-lg p-4 border border-[#2B3139] hover:border-[#F0B90B]/30 transition">
              <div className="flex items-center space-x-2 mb-2">
                {lv.name === "Crown" ? <Crown className={"w-4 h-4 " + lv.color} /> : <Star className={"w-4 h-4 " + lv.color} />}
                <span className={"text-sm font-bold " + lv.color}>{lv.name}</span>
              </div>
              <p className="text-xs text-[#5E6673]">Fee de trading</p>
              <p className="text-lg font-bold text-white">{lv.fee}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-2">Beneficios exclusivos</h3>
        <div className="space-y-3 mt-4">
          {[
            "Descuentos en tarifas de trading hasta 60%",
            "Retiros prioritarios sin limites adicionales",
            "Acceso anticipado a nuevos tokens y launchpads",
            "Soporte dedicado 24/7 con respuesta en menos de 5 minutos",
            "Invitaciones a eventos exclusivos de GCRM",
          ].map((text, i) => (
            <div key={i} className="flex items-center space-x-3 bg-[#0B0E11] rounded-lg px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0"><Crown className="w-3 h-3 text-[#C9A84C]" /></div>
              <span className="text-sm text-[#B7BDC6]">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RewardsDetail() {
  return (
    <div className="space-y-6">
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Tareas disponibles</h3>
        <div className="space-y-3">
          {[
            { task: "Completar KYC Nivel 1", reward: "50 GCRM", status: "Disponible" },
            { task: "Primer trade de spot", reward: "20 USDT", status: "Disponible" },
            { task: "Invitar 3 amigos", reward: "100 GCRM", status: "En progreso" },
            { task: "Stake GCRM por 30 dias", reward: "200 GCRM", status: "Bloqueado" },
            { task: "Loguearse 7 dias seguidos", reward: "30 GCRM", status: "Disponible" },
            { task: "Volumen de trade $1,000", reward: "75 USDT", status: "En progreso" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0B0E11] rounded-lg px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className={"w-2 h-2 rounded-full " + (item.status === "Disponible" ? "bg-[#02C076]" : item.status === "En progreso" ? "bg-[#F0B90B]" : "bg-[#5E6673]")} />
                <span className="text-sm text-[#B7BDC6]">{item.task}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-[#F0B90B]">{item.reward}</span>
                <span className={"text-[10px] px-2 py-0.5 rounded " + (item.status === "Disponible" ? "bg-[#02C076]/10 text-[#02C076]" : item.status === "En progreso" ? "bg-[#F0B90B]/10 text-[#F0B90B]" : "bg-[#2B3139] text-[#5E6673]")}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AffiliatesDetail() {
  return (
    <div className="space-y-6">
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Estructura de comisiones</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { tier: "Basico", commission: "20%", requirement: "0 referidos" },
            { tier: "Avanzado", commission: "35%", requirement: "50+ referidos" },
            { tier: "Elite", commission: "50%", requirement: "500+ referidos" },
          ].map((t) => (
            <div key={t.tier} className="bg-[#0B0E11] rounded-lg p-4 text-center border border-[#2B3139]">
              <p className={"text-2xl font-bold " + (t.tier === "Elite" ? "text-[#F0B90B]" : "text-white")}>{t.commission}</p>
              <p className="text-xs font-semibold text-[#B7BDC6] mt-1">{t.tier}</p>
              <p className="text-[10px] text-[#5E6673] mt-0.5">{t.requirement}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-2">Ventajas del programa</h3>
        <div className="space-y-3 mt-4">
          {[
            "Comisiones de hasta 50% sobre tarifas de trading de tus referidos",
            "Pagos mensuales directos a tu wallet de GCRM Exchange",
            "Panel de estadisticas en tiempo real para rastrear tus ganancias",
            "Materiales de marketing exclusivos para promotores",
            "Sin inversion minima requerida para participar",
          ].map((text, i) => (
            <div key={i} className="flex items-center space-x-3 bg-[#0B0E11] rounded-lg px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center shrink-0"><Globe className="w-3 h-3 text-[#3B82F6]" /></div>
              <span className="text-sm text-[#B7BDC6]">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LivestreamDetail() {
  const [activeTab, setActiveTab] = useState<"proximas" | "en_vivo" | "grabados">("en_vivo");
  const [reminderSet, setReminderSet] = useState<Record<string, boolean>>({});

  const LIVE_STREAM_URL = "https://www.youtube.com/embed/live_stream?channel=UCCHANNEL&autoplay=1";
  const YOUTUBE_CHANNEL = "https://www.youtube.com/@GCRMExchange";

  const liveEvents = [
    {
      id: "live-1",
      title: "Analisis de Mercado en Vivo",
      status: "live" as const,
      viewers: 2341,
      startedAt: "Hace 45 min",
      speaker: "Carlos Mendez",
      topic: "Bitcoin y Ethereum: Tendencias de la semana",
    },
  ];

  const upcomingEvents = [
    {
      id: "up-1",
      title: "Analisis de Mercado Semanal",
      date: "Lunes 20:00 UTC",
      viewers: "Aprox. 3K",
      speaker: "Carlos Mendez",
      topic: "Revision semanal de los principales pares",
      type: "Analisis",
    },
    {
      id: "up-2",
      title: "Tutorial: Staking Avanzado",
      date: "Miercoles 18:00 UTC",
      viewers: "Aprox. 2K",
      speaker: "Ana Rodriguez",
      topic: "Estrategias de staking con GCRM y NESG",
      type: "Tutorial",
    },
    {
      id: "up-3",
      title: "AMA con el equipo GCRM",
      date: "Viernes 21:00 UTC",
      viewers: "Aprox. 4K",
      speaker: "Equipo GCRM",
      topic: "Roadmap Q4, nuevos listados y sorpresas",
      type: "AMA",
    },
  ];

  const pastStreams = [
    { id: "past-1", title: "Intro a DeFi: Conceptos basicos", date: "10 Ago 2025", duration: "1h 23min", views: "5.2K views", type: "Tutorial" },
    { id: "past-2", title: "Predicciones del Mercado Q3", date: "03 Ago 2025", duration: "58min", views: "8.1K views", type: "Analisis" },
    { id: "past-3", title: "Nuevos listados - ALARAB y NESG", date: "27 Jul 2025", duration: "1h 05min", views: "6.7K views", type: "Anuncio" },
    { id: "past-4", title: "Trading Bot: Configuracion paso a paso", date: "20 Jul 2025", duration: "1h 45min", views: "4.3K views", type: "Tutorial" },
  ];

  const toggleReminder = (eventId: string) => {
    setReminderSet(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  return (
    <div className="space-y-6">
      {/* ===== VIDEO PLAYER SECTION ===== */}
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] overflow-hidden">
        {/* Player Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2B3139]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] animate-pulse" />
              <span className="text-xs font-bold text-[#E74C3C] uppercase tracking-wider">En Vivo</span>
            </div>
            <span className="text-xs text-[#5E6673]">|</span>
            <div className="flex items-center space-x-1">
              <Eye className="w-3.5 h-3.5 text-[#5E6673]" />
              <span className="text-xs text-[#5E6673]">2,341 viendo</span>
            </div>
          </div>
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en YouTube</span>
          </a>
        </div>

        {/* Video Embed Area */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <div className="absolute inset-0 bg-[#0B0E11] flex flex-col items-center justify-center">
            {/* Live stream placeholder - shows when no live stream is embedded */}
            <div className="w-20 h-20 rounded-full bg-[#E74C3C]/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-[#E74C3C]/30 transition group">
              <Play className="w-10 h-10 text-[#E74C3C] ml-1 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-white font-semibold text-sm mb-1">Transmision en curso</p>
            <p className="text-[#5E6673] text-xs">Analisis de Mercado en Vivo - Carlos Mendez</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E74C3C]/10 border border-[#E74C3C]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#E74C3C]">LIVE</span>
              </div>
              <span className="text-[10px] text-[#5E6673]">Hace 45 min</span>
            </div>
          </div>
        </div>

        {/* Stream Info Bar */}
        <div className="px-5 py-3 border-t border-[#2B3139] flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Bitcoin y Ethereum: Tendencias de la semana</p>
            <p className="text-[11px] text-[#5E6673] mt-0.5">Presentado por Carlos Mendez - Analista principal GCRM</p>
          </div>
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2 rounded-lg bg-[#E74C3C] text-white text-xs font-bold hover:bg-[#C0392B] transition flex items-center space-x-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Ver en YouTube</span>
          </a>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex items-center space-x-1 bg-[#181A20] rounded-xl border border-[#2B3139] p-1">
        {[
          { key: "en_vivo" as const, label: "En Vivo", icon: <Radio className="w-3.5 h-3.5" />, count: liveEvents.length },
          { key: "proximas" as const, label: "Proximas", icon: <Calendar className="w-3.5 h-3.5" />, count: upcomingEvents.length },
          { key: "grabados" as const, label: "Grabadas", icon: <Video className="w-3.5 h-3.5" />, count: pastStreams.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={"flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-semibold transition " +
              (activeTab === tab.key
                ? "bg-[#0B0E11] text-white shadow-sm"
                : "text-[#5E6673] hover:text-[#B7BDC6]"
              )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={"text-[10px] px-1.5 py-0.5 rounded-full " +
              (activeTab === tab.key ? "bg-[#E74C3C]/20 text-[#E74C3C]" : "bg-[#2B3139]/50 text-[#5E6673]")
            }>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ===== TAB CONTENT ===== */}
      {activeTab === "en_vivo" && (
        <div className="space-y-3">
          {liveEvents.map(ev => (
            <div key={ev.id} className="bg-[#181A20] rounded-xl border border-[#E74C3C]/30 p-5 relative overflow-hidden">
              {/* Live gradient accent */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#E74C3C] to-[#E74C3C]/30" />
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 ml-2">
                  <div className="w-12 h-12 rounded-xl bg-[#E74C3C]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Radio className="w-5 h-5 text-[#E74C3C]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-bold text-white">{ev.title}</p>
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#E74C3C]/20 border border-[#E74C3C]/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E74C3C] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#E74C3C]">LIVE</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#B7BDC6] mb-2">{ev.topic}</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Users className="w-3 h-3" /><span>{ev.speaker}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Clock className="w-3 h-3" /><span>{ev.startedAt}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Eye className="w-3 h-3" /><span>{ev.viewers.toLocaleString()} viendo</span>
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={YOUTUBE_CHANNEL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-4 py-2 rounded-lg bg-[#E74C3C] text-white text-xs font-bold hover:bg-[#C0392B] transition flex items-center space-x-1.5"
                >
                  <Play className="w-3 h-3" />
                  <span>Ver ahora</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "proximas" && (
        <div className="space-y-3">
          {upcomingEvents.map(ev => (
            <div key={ev.id} className="bg-[#181A20] rounded-xl border border-[#2B3139] p-5 hover:border-[#F0B90B]/20 transition group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#F0B90B]/20 transition">
                    <Play className="w-5 h-5 text-[#F0B90B]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-bold text-white">{ev.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0B90B]/10 text-[#F0B90B] font-semibold">{ev.type}</span>
                    </div>
                    <p className="text-xs text-[#B7BDC6] mb-2">{ev.topic}</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Users className="w-3 h-3" /><span>{ev.speaker}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Calendar className="w-3 h-3" /><span>{ev.date}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Eye className="w-3 h-3" /><span>{ev.viewers} viewers</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => toggleReminder(ev.id)}
                    className={"flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition " +
                      (reminderSet[ev.id]
                        ? "bg-[#02C076]/10 text-[#02C076] border border-[#02C076]/20"
                        : "bg-[#2B3139] text-[#848E9C] hover:text-white hover:bg-[#363C45] border border-transparent"
                      )}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{reminderSet[ev.id] ? "Recordatorio activo" : "Recordar"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "grabados" && (
        <div className="space-y-3">
          {pastStreams.map(ev => (
            <a
              key={ev.id}
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#181A20] rounded-xl border border-[#2B3139] p-5 hover:border-[#3B82F6]/20 transition group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#3B82F6]/20 transition">
                    <Video className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-bold text-white group-hover:text-[#3B82F6] transition">{ev.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2B3139] text-[#5E6673] font-semibold">{ev.type}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Calendar className="w-3 h-3" /><span>{ev.date}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Clock className="w-3 h-3" /><span>{ev.duration}</span>
                      </span>
                      <span className="text-[10px] text-[#5E6673] flex items-center space-x-1">
                        <Eye className="w-3 h-3" /><span>{ev.views}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center space-x-1 text-[#3B82F6] opacity-0 group-hover:opacity-100 transition">
                  <span className="text-xs font-semibold">Ver</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ===== LIVE CHAT SECTION ===== */}
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-[#E74C3C]" />
            <h3 className="text-sm font-bold text-white">Chat en Vivo</h3>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#02C076] animate-pulse" />
            <span className="text-[10px] text-[#5E6673]">142 participantes</span>
          </div>
        </div>
        {/* Chat placeholder */}
        <div className="bg-[#0B0E11] rounded-lg p-4 min-h-[120px] flex items-center justify-center border border-[#2B3139]">
          <a
            href={YOUTUBE_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center group"
          >
            <div className="w-12 h-12 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#E74C3C]/20 transition">
              <MessageCircle className="w-5 h-5 text-[#E74C3C]" />
            </div>
            <p className="text-xs text-[#848E9C] group-hover:text-white transition">Unete al chat en vivo en YouTube</p>
            <p className="text-[10px] text-[#5E6673] mt-1">Haz clic para abrir la transmision</p>
          </a>
        </div>
      </div>

      {/* ===== INFO BANNER ===== */}
      <div className="bg-gradient-to-r from-[#E74C3C]/10 via-[#181A20] to-[#181A20] rounded-xl border border-[#E74C3C]/20 p-5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#E74C3C]/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-[#E74C3C]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Airdrops exclusivos en transmisiones</p>
            <p className="text-xs text-[#848E9C] leading-relaxed">Participa en las transmisiones en vivo para tener la oportunidad de recibir airdrops exclusivos de GCRM. Los participantes activos del chat seran elegidos aleatoriamente durante cada sesion.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoporteVipDetail() {
  return (
    <div className="space-y-6">
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-4">Canales de soporte VIP</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { ch: "Live Chat", desc: "Respuesta inmediata", icon: <MessageSquare className="w-5 h-5" /> },
            { ch: "Email", desc: "vip@gcrm.exchange", icon: <Globe className="w-5 h-5" /> },
            { ch: "Telegram", desc: "Grupo VIP dedicado", icon: <Users className="w-5 h-5" /> },
          ].map((c) => (
            <div key={c.ch} className="bg-[#0B0E11] rounded-lg p-4 text-center border border-[#2B3139]">
              <div className="w-10 h-10 rounded-lg bg-[#A855F7]/20 flex items-center justify-center mx-auto mb-3 text-[#A855F7]">{c.icon}</div>
              <p className="text-sm font-semibold text-white">{c.ch}</p>
              <p className="text-[10px] text-[#5E6673] mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#181A20] rounded-xl border border-[#2B3139] p-6">
        <h3 className="text-lg font-bold text-white mb-2">Beneficios del soporte VIP</h3>
        <div className="space-y-3 mt-4">
          {[
            "Tiempo de respuesta garantizado: menos de 5 minutos las 24/7",
            "Agente dedicado asignado a tu cuenta",
            "Resolucion prioritaria de incidencias y disputas",
            "Asistencia personalizada para operaciones de gran volumen",
            "Acceso a canal de comunicacion privado exclusivo",
          ].map((text, i) => (
            <div key={i} className="flex items-center space-x-3 bg-[#0B0E11] rounded-lg px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-[#A855F7]/20 flex items-center justify-center shrink-0"><Headphones className="w-3 h-3 text-[#A855F7]" /></div>
              <span className="text-sm text-[#B7BDC6]">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
