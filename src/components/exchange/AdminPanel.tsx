"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, RefreshCw, Download, Check, X, ChevronDown,
  Users, Clock, AlertTriangle, CheckCircle, Loader2, Eye, ExternalLink,
  UserPlus, Wifi, WifiOff, Globe, Monitor, Wallet,
} from "lucide-react";
import { useAccount } from "wagmi";

const ADMIN_PW = "GCRM2026Admin";

type Tab = "visitors" | "airdrop";

// ============ VISITOR TYPES ============
interface Visitor {
  id: string;
  sessionId: string;
  walletAddress: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  page: string;
  lastSeenAt: string;
  createdAt: string;
}

interface VisitorStats {
  onlineNow: number;
  todayVisitors: number;
  totalUnique: number;
  uniqueWallets: number;
}

// ============ AIRDROP TYPES ============
interface Registration {
  id: string;
  username: string;
  email: string;
  wallet: string;
  completedTasks: string[];
  taskCount: number;
  referralCode: string;
  referredBy: string | null;
  gcrmEarned: number;
  status: string;
  ipAddress: string;
  createdAt: string;
  validatedAt: string | null;
}

interface AirdropStats {
  total: number;
  pending: number;
  validated3h: number;
  validated72h: number;
  completed: number;
  totalGcrm: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendiente", color: "text-[#F0B90B]", bg: "bg-[#F0B90B]/10" },
  "validated-3h": { label: "Validado 3h", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
  "validated-72h": { label: "Validado 72h", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
  completed: { label: "Completado", color: "text-[#02C076]", bg: "bg-[#02C076]/10" },
};

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("visitors");

  // Visitor state
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [vStats, setVStats] = useState<VisitorStats>({ onlineNow: 0, todayVisitors: 0, totalUnique: 0, uniqueWallets: 0 });
  const [vLoading, setVLoading] = useState(false);
  const [vSearch, setVSearch] = useState("");
  const [vTotal, setVTotal] = useState(0);

  // Airdrop state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [aStats, setAStats] = useState<AirdropStats>({ total: 0, pending: 0, validated3h: 0, validated72h: 0, completed: 0, totalGcrm: 0 });
  const [aLoading, setALoading] = useState(false);
  const [aSearch, setASearch] = useState("");
  const [aStatusFilter, setAStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    setVLoading(true);
    try {
      const params = new URLSearchParams({ pw: ADMIN_PW, limit: "100" });
      if (vSearch) params.set("search", vSearch);
      const res = await fetch(`/api/visitors?${params}`);
      const data = await res.json();
      if (data.error) return;
      setVisitors(data.visitors || []);
      setVStats(data.stats || { onlineNow: 0, todayVisitors: 0, totalUnique: 0, uniqueWallets: 0 });
      setVTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setVLoading(false);
  }, [vSearch]);

  const fetchAirdrop = useCallback(async () => {
    setALoading(true);
    try {
      const params = new URLSearchParams({ pw: ADMIN_PW, limit: "50" });
      if (aStatusFilter !== "all") params.set("status", aStatusFilter);
      if (aSearch) params.set("search", aSearch);
      const res = await fetch(`/api/airdrop/admin?${params}`);
      const data = await res.json();
      if (data.error) return;
      setRegistrations(data.registrations || []);
      setAStats(data.stats || { total: 0, pending: 0, validated3h: 0, validated72h: 0, completed: 0, totalGcrm: 0 });
    } catch (e) { console.error(e); }
    setALoading(false);
  }, [aStatusFilter, aSearch]);

  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === "visitors") fetchVisitors();
    else fetchAirdrop();
  }, [authenticated, activeTab, fetchVisitors, fetchAirdrop]);

  // Auto-refresh visitors every 15s
  useEffect(() => {
    if (!authenticated || activeTab !== "visitors") return;
    const iv = setInterval(fetchVisitors, 15000);
    return () => clearInterval(iv);
  }, [authenticated, activeTab, fetchVisitors]);

  function handleLogin() {
    if (pwInput === ADMIN_PW) { setAuthenticated(true); setPwError(""); }
    else { setPwError("Contrasena incorrecta"); }
  }

  async function handleValidate(id: string, newStatus: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/airdrop/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_PW}` },
        body: JSON.stringify({ action: "validate", registrationId: id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) fetchAirdrop();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  }

  function exportVisitorsCSV() {
    const header = "Session,Wallet,IP,Page,First Seen,Last Seen,User Agent";
    const rows = visitors.map((v) =>
      `${v.sessionId},${v.walletAddress || "No wallet"},${v.ipAddress || "N/A"},${v.page},${v.createdAt},${v.lastSeenAt},${(v.userAgent || "").replace(/,/g, ";")}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gcrm_visitors_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function exportAirdropCSV() {
    const header = "Wallet,Username,Email,Tasks,GCRM,Status,Date,Referral,IP";
    const rows = registrations.map((r) =>
      `${r.wallet},${r.username},${r.email},${r.taskCount},${r.gcrmEarned},${r.status},${r.createdAt},${r.referredBy || "None"},${r.ipAddress}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `gcrm_airdrop_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function shortWallet(w: string) {
    return w.length > 12 ? `${w.slice(0, 6)}...${w.slice(-4)}` : w;
  }

  function shortSession(s: string) {
    return s.length > 12 ? `${s.slice(0, 8)}...` : s;
  }

  function isOnline(lastSeen: string) {
    return Date.now() - new Date(lastSeen).getTime() < 30 * 60 * 1000;
  }

  function detectBrowser(ua: string | null) {
    if (!ua) return "Desconocido";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Otro";
  }

  // ============ LOGIN GATE ============
  if (!authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B0E11]">
        <div className="bg-[#1E2329] rounded-2xl p-8 w-full max-w-sm border border-[#2B3139]">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <Shield className="w-7 h-7 text-black" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white text-center mb-1">Admin Panel</h2>
          <p className="text-xs text-[#5E6673] text-center mb-6">Acceso restringido — Solo administradores</p>
          <div className="relative mb-4">
            <input
              type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Contrasena de administrador"
              className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition"
            />
          </div>
          {pwError && <p className="text-xs text-[#F6465D] mb-3">{pwError}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-[#F0B90B] hover:bg-[#F8D12F] text-black font-bold text-sm py-3 rounded-lg transition flex items-center justify-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>ACCEDER</span>
          </button>
        </div>
      </div>
    );
  }

  // ============ ADMIN DASHBOARD ============
  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E11]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Panel de Administracion</h1>
              <p className="text-[11px] text-[#5E6673]">GCRM Exchange — Control total</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#02C076]/10 border border-[#02C076]/30">
              <span className="w-2 h-2 rounded-full bg-[#02C076] animate-pulse" />
              <span className="text-[11px] text-[#02C076] font-medium">En linea</span>
            </div>
            <button onClick={() => { setAuthenticated(false); setPwInput(""); }} className="px-3 py-1.5 rounded-lg bg-[#2B3139] hover:bg-[#363C45] text-xs text-[#848E9C] hover:text-white transition">Salir</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-[#1E2329] rounded-xl p-1 border border-[#2B3139]">
          <button onClick={() => setActiveTab("visitors")} className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "visitors" ? "bg-[#2B3139] text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"}`}>
            <Users className="w-4 h-4" />
            <span>Visitantes</span>
          </button>
          <button onClick={() => setActiveTab("airdrop")} className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === "airdrop" ? "bg-[#2B3139] text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"}`}>
            <Gift className="w-4 h-4" />
            <span>Airdrop</span>
          </button>
        </div>

        {/* ============ VISITORS TAB ============ */}
        {activeTab === "visitors" && (
          <>
            {/* Visitor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#5E6673]">En linea ahora</span>
                  <Wifi className="w-4 h-4 text-[#02C076]" />
                </div>
                <p className="text-2xl font-bold text-[#02C076]">{vStats.onlineNow}</p>
              </div>
              <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#5E6673]">Visitantes hoy</span>
                  <UserPlus className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <p className="text-2xl font-bold text-[#3B82F6]">{vStats.todayVisitors}</p>
              </div>
              <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#5E6673]">Total unicos</span>
                  <Globe className="w-4 h-4 text-[#F0B90B]" />
                </div>
                <p className="text-2xl font-bold text-[#F0B90B]">{vStats.totalUnique}</p>
              </div>
              <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-[#5E6673]">Wallets conectadas</span>
                  <Wallet className="w-4 h-4 text-[#848E9C]" />
                </div>
                <p className="text-2xl font-bold text-white">{vStats.uniqueWallets}</p>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                <input type="text" value={vSearch} onChange={(e) => setVSearch(e.target.value)} placeholder="Buscar por wallet, sesion o IP..."
                  className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition" />
              </div>
              <button onClick={fetchVisitors} disabled={vLoading} className="px-4 py-2.5 bg-[#2B3139] hover:bg-[#363C45] rounded-lg text-sm text-[#848E9C] hover:text-white transition flex items-center space-x-1.5">
                {vLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Actualizar</span>
              </button>
              <button onClick={exportVisitorsCSV} className="px-4 py-2.5 bg-[#F0B90B]/10 hover:bg-[#F0B90B]/20 border border-[#F0B90B]/30 rounded-lg text-sm text-[#F0B90B] font-semibold transition flex items-center space-x-1.5">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>

            {/* Visitors Table */}
            <div className="bg-[#1E2329] rounded-xl border border-[#2B3139] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#2B3139]">
                      {"Estado,Wallet,Sesion,IP,Pagina,Navegador,Primera visita,Ultima actividad".split(",").map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-[#5E6673] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B3139]">
                    {vLoading && visitors.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#5E6673] animate-spin mx-auto" /></td></tr>
                    ) : visitors.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-[#5E6673]">No hay visitantes registrados</td></tr>
                    ) : (
                      visitors.map((v) => {
                        const online = isOnline(v.lastSeenAt);
                        return (
                          <tr key={v.id} className="hover:bg-[#2B3139]/30 transition">
                            <td className="px-4 py-3">
                              <div className={`flex items-center space-x-1.5`}>{online ? <Wifi className="w-3.5 h-3.5 text-[#02C076]" /> : <WifiOff className="w-3.5 h-3.5 text-[#5E6673]" />}
                                <span className={`text-[10px] font-bold ${online ? "text-[#02C076]" : "text-[#5E6673]"}`}>{online ? "Online" : "Offline"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {v.walletAddress ? (
                                <span className="text-xs text-white font-mono">{shortWallet(v.walletAddress)}</span>
                              ) : (
                                <span className="text-xs text-[#5E6673] italic">Sin wallet</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[11px] text-[#848E9C] font-mono">{shortSession(v.sessionId)}</td>
                            <td className="px-4 py-3 text-[11px] text-[#848E9C] font-mono">{v.ipAddress || "—"}</td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] px-2 py-1 rounded bg-[#2B3139] text-[#848E9C] font-medium">{v.page}</span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-[#848E9C]">{detectBrowser(v.userAgent)}</td>
                            <td className="px-4 py-3 text-[11px] text-[#5E6673] whitespace-nowrap">
                              {new Date(v.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="px-4 py-3 text-[11px] whitespace-nowrap">
                              <span className={online ? "text-[#02C076]" : "text-[#5E6673]"}>
                                {new Date(v.lastSeenAt).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-[#5E6673]">Mostrando {visitors.length} de {vTotal} registros · Se actualiza cada 15 segundos</p>
          </>
        )}

        {/* ============ AIRDROP TAB ============ */}
        {activeTab === "airdrop" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total Registros", value: aStats.total, color: "text-white", icon: <Users className="w-4 h-4" /> },
                { label: "Pendientes", value: aStats.pending, color: "text-[#F0B90B]", icon: <Clock className="w-4 h-4" /> },
                { label: "Validados 3h", value: aStats.validated3h, color: "text-[#3B82F6]", icon: <Check className="w-4 h-4" /> },
                { label: "Validados 72h", value: aStats.validated72h, color: "text-[#8B5CF6]", icon: <Check className="w-4 h-4" /> },
                { label: "Completados", value: aStats.completed, color: "text-[#02C076]", icon: <CheckCircle className="w-4 h-4" /> },
              ].map((s) => (
                <div key={s.label} className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5E6673]">{s.label}</span>
                    <span className="text-[#5E6673]">{s.icon}</span>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#F0B90B]/10 to-transparent rounded-xl p-4 border border-[#F0B90B]/20 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5E6673]">Total GCRM Distribuido</p>
                <p className="text-2xl font-extrabold text-[#F0B90B]">{aStats.totalGcrm} GCRM</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#5E6673]">Pool Restante</p>
                <p className="text-lg font-bold text-[#02C076]">{Math.max(0, 99999 - aStats.totalGcrm)} GCRM</p>
              </div>
            </div>

            <div className="bg-[#1E2329] rounded-xl p-4 border border-[#2B3139] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                <input type="text" value={aSearch} onChange={(e) => setASearch(e.target.value)} placeholder="Buscar por wallet, email o username..."
                  className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition" />
              </div>
              <div className="relative">
                <select value={aStatusFilter} onChange={(e) => setAStatusFilter(e.target.value)} className="appearance-none bg-[#2B3139] border border-[#363C45] rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-[#F0B90B] transition cursor-pointer">
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="validated-3h">Validado 3h</option>
                  <option value="validated-72h">Validado 72h</option>
                  <option value="completed">Completado</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673] pointer-events-none" />
              </div>
              <button onClick={fetchAirdrop} disabled={aLoading} className="px-4 py-2.5 bg-[#2B3139] hover:bg-[#363C45] rounded-lg text-sm text-[#848E9C] hover:text-white transition flex items-center space-x-1.5">
                {aLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Actualizar</span>
              </button>
              <button onClick={exportAirdropCSV} className="px-4 py-2.5 bg-[#F0B90B]/10 hover:bg-[#F0B90B]/20 border border-[#F0B90B]/30 rounded-lg text-sm text-[#F0B90B] font-semibold transition flex items-center space-x-1.5">
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>

            <div className="bg-[#1E2329] rounded-xl border border-[#2B3139] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#2B3139]">
                      {"Wallet,Username,Email,Tareas,GCRM,Referido,Estado,Fecha,Acciones".split(",").map((h) => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-[#5E6673] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2B3139]">
                    {aLoading && registrations.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 text-[#5E6673] animate-spin mx-auto" /></td></tr>
                    ) : registrations.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[#5E6673]">No hay registros</td></tr>
                    ) : (
                      registrations.map((reg) => {
                        const sc = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending;
                        return (
                          <tr key={reg.id} className="hover:bg-[#2B3139]/30 transition">
                            <td className="px-4 py-3 text-xs text-[#848E9C] hover:text-[#F0B90B] font-mono">{shortWallet(reg.wallet)}</td>
                            <td className="px-4 py-3 text-xs text-white font-semibold whitespace-nowrap">{reg.username}</td>
                            <td className="px-4 py-3 text-xs text-[#848E9C] whitespace-nowrap">{reg.email}</td>
                            <td className="px-4 py-3 text-xs text-white">{reg.taskCount}/11</td>
                            <td className="px-4 py-3 text-xs font-bold text-[#02C076]">{reg.gcrmEarned}</td>
                            <td className="px-4 py-3 text-xs text-[#5E6673] whitespace-nowrap">{reg.referredBy || "—"}</td>
                            <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${sc.bg} ${sc.color}`}>{sc.label}</span></td>
                            <td className="px-4 py-3 text-[11px] text-[#5E6673] whitespace-nowrap">{new Date(reg.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                {reg.status === "pending" && (
                                  <>
                                    <button onClick={() => handleValidate(reg.id, "validated-3h")} disabled={actionLoading === reg.id} className="px-2 py-1 text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] rounded hover:bg-[#3B82F6]/20 transition disabled:opacity-50">{actionLoading === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "3h"}</button>
                                    <button onClick={() => handleValidate(reg.id, "completed")} disabled={actionLoading === reg.id} className="px-2 py-1 text-[10px] font-bold bg-[#02C076]/10 text-[#02C076] rounded hover:bg-[#02C076]/20 transition disabled:opacity-50">OK</button>
                                  </>
                                )}
                                <a href={`https://etherscan.io/address/${reg.wallet}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-[#2B3139] transition"><ExternalLink className="w-3 h-3 text-[#5E6673]" /></a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-[#5E6673]">Mostrando {registrations.length} de {aStats.total} registros</p>
          </>
        )}
      </div>
    </div>
  );
}
