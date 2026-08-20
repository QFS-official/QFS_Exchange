"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, Star, TrendingUp, Users, Zap, Crown, Briefcase,
  Rocket, Gamepad2, Gift, Clock, ExternalLink, Check, Copy, Shield,
  User, Mail, Lock, Wallet, ArrowRight, Trophy, Share2, Timer,
} from "lucide-react";

/* ============================================================
   COPY TRADING DATA
   ============================================================ */
const TOP_TRADERS = [
  { name: "GROWTRADE", badge: "30", roi: "+282.32%", period: "7d ROI", pnl: "$12,450", winRate: "78%", followers: "2.4K", avatar: "bg-gradient-to-br from-[#F0B90B] to-[#F8D12F]" },
  { name: "CRYPTOHUB", badge: "69", roi: "+28.34%", period: "7d ROI", pnl: "$8,320", winRate: "65%", followers: "1.8K", avatar: "bg-gradient-to-br from-[#02C076] to-[#2ECC71]" },
  { name: "LandTrader", badge: "69", roi: "+16.86%", period: "7d ROI", pnl: "$5,670", winRate: "72%", followers: "956", avatar: "bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]" },
  { name: "EliteCrypto", badge: "42", roi: "+45.12%", period: "7d ROI", pnl: "$15,890", winRate: "81%", followers: "3.1K", avatar: "bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA]" },
];
const PRO_TRADERS = [
  { name: "AlphaVault", badge: "PRO", roi: "+120.50%", period: "30d ROI", pnl: "$45,200", winRate: "85%", followers: "5.2K", avatar: "bg-gradient-to-br from-[#F6465D] to-[#FB7185]" },
  { name: "QuantSage", badge: "PRO", roi: "+67.89%", period: "30d ROI", pnl: "$28,340", winRate: "76%", followers: "2.9K", avatar: "bg-gradient-to-br from-[#F59E0B] to-[#FBBF24]" },
];
const TRADFI_TRADERS = [
  { name: "DividendKing", badge: "TF", roi: "+12.45%", period: "30d ROI", pnl: "$3,450", winRate: "90%", followers: "678", avatar: "bg-gradient-to-br from-[#06B6D4] to-[#22D3EE]" },
];

function TraderCard({ trader }: { trader: typeof TOP_TRADERS[0] }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-[#2B3139]/50 transition cursor-pointer group">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className={`w-10 h-10 rounded-full ${trader.avatar} flex items-center justify-center text-white text-sm font-bold`}>
            {trader.name[0]}
          </div>
          <span className="absolute -top-1 -right-1 bg-[#1E2329] border border-[#363C45] text-[8px] font-bold text-[#F0B90B] px-1 rounded">
            {trader.badge}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white group-hover:text-[#F0B90B] transition">{trader.name}</p>
          <p className="text-[11px] text-[#5E6673]">{trader.followers} seguidores</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] text-[#5E6673]">{trader.period}</p>
        <p className="text-sm font-bold text-[#02C076]">{trader.roi}</p>
      </div>
    </div>
  );
}

/* ============================================================
   AIRDROP DATA & COMPONENT
   ============================================================ */
const AIRDROP_TASKS = [
  { id: "x", name: "X (Twitter)", handle: "@GCRM_official", reward: 3, color: "#1DA1F2", link: "https://x.com/GCRM_official" },
  { id: "telegram", name: "Telegram", handle: "@GCRM_official", reward: 2, color: "#26A5E4", link: "https://t.me/GCRM_official" },
  { id: "facebook", name: "Facebook", handle: "GCRM.Org", reward: 1, color: "#1877F2", link: "https://facebook.com/GCRM.Official" },
  { id: "instagram", name: "Instagram", handle: "@gcrm_official", reward: 1, color: "#E4405F", link: "https://instagram.com/gcrm_official" },
  { id: "tiktok", name: "TikTok", handle: "@gcr.nesara.gesara", reward: 1, color: "#00F2EA", link: "https://tiktok.com/@gcr.nesara.gesara" },
  { id: "whatsapp", name: "WhatsApp", handle: "Grupo Comunidad", reward: 1, color: "#25D366", link: "https://chat.whatsapp.com/" },
  { id: "youtube", name: "YouTube", handle: "@GCRM_Official", reward: 1, color: "#FF0000", link: "https://youtube.com/@GCRM_Official" },
  { id: "medium", name: "Medium", handle: "GCRM Articles", reward: 1, color: "#FFFFFF", link: "https://medium.com/@GCRM_Official" },
  { id: "discord", name: "Discord", handle: "GCRM Server", reward: 1, color: "#5865F2", link: "https://discord.gg/gcrm" },
  { id: "reddit", name: "Reddit", handle: "u/GCRM_Official", reward: 1, color: "#FF4500", link: "https://reddit.com/r/GCRM_Official" },
  { id: "github", name: "GitHub", handle: "GCRMaster", reward: 1, color: "#848E9C", link: "https://github.com/GCRMaster" },
];

const EXCHANGES = [
  { name: "LBank", color: "#1FC7D4" },
  { name: "BingX", color: "#3B82F6" },
  { name: "KuCoin", color: "#23AF91" },
  { name: "Bitget", color: "#00F0FF" },
  { name: "Coinbase", color: "#0052FF" },
  { name: "Binance", color: "#F0B90B" },
];

function useCountdown(targetDate: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [targetDate]);
  const [time, setTime] = useState(calc);
  useEffect(() => { const id = setInterval(() => setTime(calc), 1000); return () => clearInterval(id); }, [calc]);
  return time;
}

function AirdropView() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [registered, setRegistered] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", wallet: "" });

  // Campaign: Aug 10 → Aug 21 (11 days)
  const targetDate = new Date("2026-08-21T00:00:00Z");
  const countdown = useCountdown(targetDate);
  const campaignEnded = countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0;

  const totalEarned = AIRDROP_TASKS.filter((t) => completedTasks.has(t.id)).reduce((s, t) => s + t.reward, 0);
  const maxReward = 16;
  const tasksCompleted = completedTasks.size;
  const totalTasks = AIRDROP_TASKS.length;
  const progress = (tasksCompleted / totalTasks) * 100;

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCopyReferral = () => {
    const link = `https://gcrmaster.org/airdrop-gcrm/?ref=${form.username || "GCRM"}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = () => {
    if (form.username && form.email && form.wallet) {
      setRegistered(true);
      setShowRegister(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ====== HERO / CAMPAIGN BANNER ====== */}
      <div className="relative bg-gradient-to-br from-[#0B0E11] via-[#1E2329] to-[#2B3139] border-b border-[#2B3139]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #F0B90B 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-[#02C076]/10 text-[#02C076] text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#02C076] animate-pulse" />
              <span>Campaña Activa</span>
            </span>
            {campaignEnded && (
              <span className="px-2.5 py-1 rounded-full bg-[#F6465D]/10 text-[#F6465D] text-[11px] font-bold">Finalizada</span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">
            GCRM <span className="text-[#F0B90B]">Humanitarian Aid</span> Airdrop
          </h1>
          <p className="text-sm text-[#848E9C] mb-6 max-w-xl leading-relaxed">
            Regístrate, completa las tareas sociales y gana hasta <span className="text-[#F0B90B] font-bold">16 GCRM</span> en recompensas.
            Únete al ecosistema GCRMaster hoy. Cada referido te da <span className="text-[#02C076] font-bold">10 Eur en GCRM</span> adicional.
          </p>

          {/* Countdown */}
          {!campaignEnded && (
            <div className="flex items-center space-x-2 mb-6">
              <Timer className="w-4 h-4 text-[#F0B90B]" />
              <span className="text-xs text-[#848E9C]">Finaliza en:</span>
              <div className="flex space-x-2">
                {([countdown.days, countdown.hours, countdown.minutes, countdown.seconds] as const).map((v, i) => (
                  <div key={i} className="bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-1.5 text-center min-w-[52px]">
                    <p className="text-lg font-bold text-white leading-none">{String(v).padStart(2, "0")}</p>
                    <p className="text-[9px] text-[#5E6673] mt-0.5">{["Días", "Horas", "Min", "Seg"][i]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pool Total", value: "16 GCRM", accent: "text-[#F0B90B]" },
              { label: "Costo", value: "GRATIS", accent: "text-[#02C076]" },
              { label: "Por Referido", value: "10 Eur GCRM", accent: "text-[#3B82F6]" },
              { label: "Red", value: "ERC-20", accent: "text-[#848E9C]" },
            ].map((s) => (
              <div key={s.label} className="bg-[#1E2329]/80 border border-[#2B3139] rounded-xl p-3 text-center">
                <p className={`text-sm font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-[10px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* ====== EXCHANGES ROW ====== */}
        <div className="bg-[#1E2329] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Disponible en Exchanges</h3>
            <span className="text-[11px] text-[#5E6673]">Tradea GCRM en tu plataforma favorita</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {EXCHANGES.map((ex) => (
              <div key={ex.name} className="bg-[#2B3139] hover:bg-[#363C45] border border-[#363C45] rounded-lg px-4 py-2.5 flex items-center space-x-2 transition cursor-pointer">
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: ex.color }} />
                <span className="text-xs font-semibold text-white">{ex.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ====== MAIN CONTENT GRID ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Tasks + Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Social Tasks */}
            <div className="bg-[#1E2329] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-[#F0B90B]" />
                    <span>Sigue y Gana Recompensas</span>
                  </h3>
                  <p className="text-[11px] text-[#5E6673] mt-0.5">Completa cada tarea social para ganar GCRM</p>
                </div>
                <span className="text-xs text-[#F0B90B] font-bold">{tasksCompleted}/{totalTasks}</span>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-[#2B3139]">
                <div className="h-full bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <div className="divide-y divide-[#2B3139]">
                {AIRDROP_TASKS.map((task) => {
                  const done = completedTasks.has(task.id);
                  return (
                    <div key={task.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#2B3139]/30 transition group">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                            done ? "bg-[#02C076] border-[#02C076]" : "border-[#363C45] group-hover:border-[#848E9C]"
                          }`}
                        >
                          {done && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold transition ${done ? "text-[#848E9C] line-through" : "text-white"}`}>{task.name}</p>
                          <p className="text-[11px] text-[#5E6673]">{task.handle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-bold ${done ? "text-[#5E6673]" : "text-[#02C076]"}`}>+{task.reward} GCRM</span>
                        <a
                          href={task.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded-lg bg-[#2B3139] hover:bg-[#363C45] flex items-center justify-center transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#848E9C]" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Registration Form / Logged-in Dashboard */}
            {!registered ? (
              <div className="bg-[#1E2329] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2B3139]">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#F0B90B]" />
                    <span>Crea tu Cuenta de Airdrop</span>
                  </h3>
                  <p className="text-[11px] text-[#5E6673] mt-0.5">Completa todos los pasos para ganar tus recompensas GCRM</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Nombre de usuario</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                      <input
                        type="text" value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="Tu nombre de usuario"
                        className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                      <input
                        type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="tu@email.com"
                        className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                      <input
                        type="password" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Dirección Wallet GCRM (ERC-20)</label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                      <input
                        type="text" value={form.wallet}
                        onChange={(e) => setForm({ ...form, wallet: e.target.value })}
                        placeholder="0x..."
                        className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={!form.username || !form.email || !form.wallet}
                    className="w-full bg-[#F0B90B] hover:bg-[#F8D12F] disabled:bg-[#363C45] disabled:text-[#5E6673] text-black font-bold text-sm py-3 rounded-lg transition flex items-center justify-center space-x-2"
                  >
                    <span>Enviar Registro</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-center text-[11px] text-[#5E6673]">
                    ¿Ya tienes una cuenta?{" "}
                    <button onClick={() => setShowLogin(true)} className="text-[#F0B90B] hover:text-[#F8D12F] font-semibold">Inicia sesión aquí</button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#1E2329] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#2B3139]">
                  <h3 className="text-sm font-bold text-white">Bienvenido, <span className="text-[#F0B90B]">{form.username}</span></h3>
                  <p className="text-[11px] text-[#5E6673] mt-0.5">Rastrea tu estado de airdrop y recompensas</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#2B3139] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-[#F0B90B]">{totalEarned} GCRM</p>
                      <p className="text-[10px] text-[#5E6673] mt-0.5">Total Ganado</p>
                    </div>
                    <div className="bg-[#2B3139] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-white">{tasksCompleted}/{totalTasks}</p>
                      <p className="text-[10px] text-[#5E6673] mt-0.5">Tareas</p>
                    </div>
                    <div className="bg-[#2B3139] rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-[#02C076]">Pendiente</p>
                      <p className="text-[10px] text-[#5E6673] mt-0.5">Distribución</p>
                    </div>
                  </div>
                  <div className="bg-[#2B3139] rounded-lg p-3">
                    <p className="text-[11px] text-[#848E9C] mb-2 font-semibold">Tu Enlace de Referido</p>
                    <div className="flex items-center space-x-2">
                      <input
                        readOnly
                        value={`https://gcrmaster.org/airdrop-gcrm/?ref=${form.username}`}
                        className="flex-1 bg-[#1E2329] border border-[#363C45] rounded-lg px-3 py-2 text-xs text-[#848E9C] truncate"
                      />
                      <button onClick={handleCopyReferral} className="bg-[#F0B90B] hover:bg-[#F8D12F] text-black px-3 py-2 rounded-lg transition flex items-center space-x-1.5">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-xs font-bold">{copied ? "Copiado" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#2B3139] rounded-lg p-3">
                    <p className="text-[11px] text-[#848E9C] mb-1 font-semibold">Tu Wallet</p>
                    <p className="text-xs text-white font-mono">{form.wallet}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Stats Sidebar */}
          <div className="space-y-6">
            {/* Reward Summary */}
            <div className="bg-[#1E2329] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <Gift className="w-4 h-4 text-[#F0B90B]" />
                <span>Resumen de Recompensas</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#848E9C]">Ganado por tareas</span>
                  <span className="text-sm font-bold text-[#02C076]">{totalEarned} GCRM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#848E9C]">Bonus referidos</span>
                  <span className="text-sm font-bold text-[#3B82F6]">0 GCRM</span>
                </div>
                <div className="border-t border-[#2B3139] pt-3 flex items-center justify-between">
                  <span className="text-xs text-white font-semibold">Total</span>
                  <span className="text-base font-extrabold text-[#F0B90B]">{totalEarned} / {maxReward} GCRM</span>
                </div>
                {/* Circular progress */}
                <div className="flex justify-center pt-2">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#2B3139" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#F0B90B" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`} className="transition-all duration-700" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
                      <span className="text-[9px] text-[#5E6673]">Completado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Card */}
            <div className="bg-gradient-to-br from-[#F0B90B]/10 to-[#1E2329] border border-[#F0B90B]/20 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-[#F0B90B]" />
                <span>Programa de Referidos</span>
              </h3>
              <p className="text-[11px] text-[#848E9C] mb-3 leading-relaxed">
                Invita amigos a unirse con tu enlace. Ganarás <span className="text-[#F0B90B] font-bold">10 Eur en GCRM</span> por cada amigo que se registre.
              </p>
              <div className="bg-[#2B3139] rounded-lg p-3 text-center">
                <p className="text-2xl font-extrabold text-[#F0B90B]">10 Eur en GCRM</p>
                <p className="text-[10px] text-[#5E6673]">Por cada referido</p>
              </div>
            </div>

            {/* Secured badge */}
            <div className="bg-[#1E2329] rounded-xl p-5 text-center">
              <Shield className="w-8 h-8 text-[#02C076] mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Plataforma Web3 Segura</p>
              <p className="text-[10px] text-[#5E6673] mt-1">Construido sobre la red Ethereum (ERC-20)</p>
            </div>

            {/* Quick links */}
            <div className="bg-[#1E2329] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Enlaces Rápidos</h3>
              <div className="space-y-2">
                {[
                  { label: "Sitio Oficial GCRM", url: "https://gcrmaster.org" },
                  { label: "Contrato Smart Contract", url: "#" },
                  { label: "Comunidad GCRM", url: "#" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2B3139] transition group"
                  >
                    <span className="text-xs text-[#848E9C] group-hover:text-white transition">{link.label}</span>
                    <ExternalLink className="w-3 h-3 text-[#5E6673] group-hover:text-[#F0B90B] transition" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ====== LOGIN MODAL ====== */}
        {showLogin && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Iniciar Sesión</h3>
                <button onClick={() => setShowLogin(false)} className="text-[#5E6673] hover:text-white transition">✕</button>
              </div>
              <div>
                <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Usuario o Email</label>
                <input placeholder="usuario@email.com" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]" />
              </div>
              <div>
                <label className="text-[11px] text-[#848E9C] font-semibold uppercase tracking-wider mb-1.5 block">Contraseña</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]" />
              </div>
              <button onClick={() => { setRegistered(true); setShowLogin(false); }} className="w-full bg-[#F0B90B] hover:bg-[#F8D12F] text-black font-bold text-sm py-3 rounded-lg transition">INICIAR SESIÓN</button>
              <p className="text-center text-[11px] text-[#5E6673]">
                ¿No tienes cuenta?{" "}
                <button onClick={() => { setShowLogin(false); setShowRegister(true); }} className="text-[#F0B90B] font-semibold">Crea una</button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD CONTENT ROUTER
   ============================================================ */
interface DashboardContentProps {
  activeMode: string;
}

export function DashboardContent({ activeMode }: DashboardContentProps) {
  /* ---- AIRDROP ---- */
  if (activeMode === "airdrop") {
    return <AirdropView />;
  }

  /* ---- COPY TRADING ---- */
  if (activeMode === "copy-trading") {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-[#1E2329] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Copy Trading Classic</h2>
              </div>
              <p className="text-xs text-[#5E6673] mt-0.5">Deja que los mejores traders trabajen por ti</p>
            </div>
            <button className="flex items-center space-x-1 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition font-semibold">
              <span>Ver todo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#2B3139]">
            {TOP_TRADERS.map((t) => (
              <TraderCard key={t.name} trader={t} />
            ))}
          </div>
        </div>
        <div className="bg-[#1E2329] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
            <div>
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-[#F0B90B]" />
                <h2 className="text-base font-bold text-white">Copy Trading Pro</h2>
              </div>
              <p className="text-xs text-[#5E6673] mt-0.5">Más allá de simplemente copiar</p>
            </div>
            <button className="flex items-center space-x-1 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition font-semibold">
              <span>Ver todo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#2B3139]">
            {PRO_TRADERS.map((t) => (
              <TraderCard key={t.name} trader={t} />
            ))}
          </div>
        </div>
        <div className="bg-[#1E2329] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B3139]">
            <div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-[#F0B90B]" />
                <h2 className="text-base font-bold text-white">Copy Trading TradFi</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#F0B90B] text-black">NEW</span>
              </div>
              <p className="text-xs text-[#5E6673] mt-0.5">Copia estrategias de TradFi fácilmente</p>
            </div>
            <button className="flex items-center space-x-1 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition font-semibold">
              <span>Ver todo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-[#2B3139]">
            {TRADFI_TRADERS.map((t) => (
              <TraderCard key={t.name} trader={t} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- TRADEGPT ---- */
  if (activeMode === "tradegpt") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">TradeGPT</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Se sirve del trading impulsado por IA. Obtén análisis de mercado, señales y predicciones en tiempo real alimentadas por inteligencia artificial avanzada.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Análisis", val: "24/7" }, { label: "Precisión", val: "89%" }, { label: "Señales/día", val: "50+" }].map((s) => (
              <div key={s.label} className="bg-[#2B3139] rounded-lg p-3">
                <p className="text-lg font-bold text-[#F0B90B]">{s.val}</p>
                <p className="text-[11px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button className="bg-[#F0B90B] text-black font-bold text-sm px-6 py-2.5 rounded hover:bg-[#F8D12F] transition">
            Comenzar ahora
          </button>
        </div>
      </div>
    );
  }

  /* ---- TRADINGVIEW ---- */
  if (activeMode === "tradingview") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02C076] to-[#2ECC71] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">TradingView</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Mejora tu experiencia en trading cripto con las mejores herramientas y gráficos de su clase. Accede a indicadores avanzados, dibujo profesional y datos en tiempo real.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Indicadores", val: "100+" }, { label: "Gráficos", val: "Pro" }, { label: "Timeframes", val: "15+" }].map((s) => (
              <div key={s.label} className="bg-[#2B3139] rounded-lg p-3">
                <p className="text-lg font-bold text-[#02C076]">{s.val}</p>
                <p className="text-[11px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button className="bg-[#02C076] text-white font-bold text-sm px-6 py-2.5 rounded hover:bg-[#2ECC71] transition">
            Abrir TradingView
          </button>
        </div>
      </div>
    );
  }

  /* ---- TRADING BOT ---- */
  if (activeMode === "trading-bot") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Trading Bot</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Trades Inteligentes Simplificados. Configura estrategias automatizadas de trading sin necesidad de vigilancia constante.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Estrategias", val: "20+" }, { label: "Pares", val: "500+" }, { label: "Uptime", val: "99.9%" }].map((s) => (
              <div key={s.label} className="bg-[#2B3139] rounded-lg p-3">
                <p className="text-lg font-bold text-[#8B5CF6]">{s.val}</p>
                <p className="text-[11px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button className="bg-[#8B5CF6] text-white font-bold text-sm px-6 py-2.5 rounded hover:bg-[#A78BFA] transition">
            Crear Bot
          </button>
        </div>
      </div>
    );
  }

  /* ---- POSITION BUILDER ---- */
  if (activeMode === "position-builder") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F6465D] to-[#FB7185] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Constructor de posición</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Simula PyG para combinaciones de Perpetuos/Futuros/Opciones antes de realizar órdenes.
          </p>
          <button className="bg-[#F6465D] text-white font-bold text-sm px-6 py-2.5 rounded hover:bg-[#FB7185] transition">
            Abrir Constructor
          </button>
        </div>
      </div>
    );
  }

  /* ---- RFQ ---- */
  if (activeMode === "rfq") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Solicitud de cotización</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Ejecuta bloques de varios tamaños como una sola trade, sin descuento de precio.
          </p>
          <button className="bg-[#06B6D4] text-white font-bold text-sm px-6 py-2.5 rounded hover:bg-[#22D3EE] transition">
            Crear Solicitud
          </button>
        </div>
      </div>
    );
  }

  /* ---- LAUNCHHUB ---- */
  if (activeMode === "launchhub") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#02C076] to-[#2ECC71] flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Launchhub</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Descubre los próximos tokens antes de que se listen. Participa en launchpads exclusivos.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Proyectos", val: "45+" }, { label: "Total recaudado", val: "$120M" }, { label: "Participantes", val: "800K+" }].map((s) => (
              <div key={s.label} className="bg-[#2B3139] rounded-lg p-3">
                <p className="text-lg font-bold text-[#02C076]">{s.val}</p>
                <p className="text-[11px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button className="bg-[#02C076] text-white font-bold text-sm px-6 py-2.5 rounded hover:bg-[#2ECC71] transition">
            Explorar Proyectos
          </button>
        </div>
      </div>
    );
  }

  /* ---- TESTNET ---- */
  if (activeMode === "testnet") {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center mx-auto mb-4">
            <Gamepad2 className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Trading de Prueba</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
            Practica tus estrategias de trading sin riesgo usando fondos virtuales.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: "Fondos virtuales", val: "$10,000" }, { label: "Pares", val: "200+" }, { label: "Sin riesgo", val: "100%" }].map((s) => (
              <div key={s.label} className="bg-[#2B3139] rounded-lg p-3">
                <p className="text-lg font-bold text-[#F59E0B]">{s.val}</p>
                <p className="text-[11px] text-[#5E6673] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <button className="bg-[#F59E0B] text-black font-bold text-sm px-6 py-2.5 rounded hover:bg-[#FBBF24] transition">
            Comenzar Prueba
          </button>
        </div>
      </div>
    );
  }

  /* ---- GENERIC: earn / loans / convert / history ---- */
  if (activeMode === "earn" || activeMode === "history") {
    const titles: Record<string, { title: string; desc: string; color: string; icon: React.ReactNode }> = {
      earn: { title: "Earn", desc: "Gana recompensas con tus cripto. Depósitos flexibles y a plazo fijo con tasas competitivas.", color: "from-[#F0B90B] to-[#F8D12F]", icon: <Zap className="w-8 h-8 text-black" /> },
      loans: { title: "Préstamos", desc: "Préstamos crypto sin liquidación. Obtén liquidez sin vender tus activos digitales.", color: "from-[#3B82F6] to-[#60A5FA]", icon: <TrendingUp className="w-8 h-8 text-white" /> },
      convert: { title: "Convert", desc: "Conversión instantánea sin comisión. Cambia entre criptomonedas al precio de mercado en segundos.", color: "from-[#8B5CF6] to-[#A78BFA]", icon: <Zap className="w-8 h-8 text-white" /> },
      history: { title: "Historial", desc: "Revisa tu historial de transacciones, órdenes, depósitos y retiros de forma detallada.", color: "from-[#5E6673] to-[#848E9C]", icon: <TrendingUp className="w-8 h-8 text-white" /> },
    };
    const info = titles[activeMode] || titles.convert;
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center mx-auto mb-4`}>{info.icon}</div>
          <h2 className="text-xl font-bold text-white mb-2">{info.title}</h2>
          <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">{info.desc}</p>
          <button className="bg-[#F0B90B] text-black font-bold text-sm px-6 py-2.5 rounded hover:bg-[#F8D12F] transition">Comenzar</button>
        </div>
      </div>
    );
  }

  /* ---- DEFAULT ---- */
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-[#1E2329] rounded-xl p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">GCRM Exchange</h2>
        <p className="text-sm text-[#848E9C] mb-6 leading-relaxed">
          Selecciona una sección del menú lateral para comenzar a operar o explorar herramientas de trading avanzadas.
        </p>
      </div>
    </div>
  );
}