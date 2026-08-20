"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Flame,
  Clock,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Pool {
  id: string;
  symbol: string;
  name: string;
  apy: number;
  lockDays: number;
  minStake: number;
  totalStaked: number;
  tvl: number;
}

interface Position {
  id: string;
  poolId: string;
  amount: number;
  pendingReward: number;
  startTime: string;
  endTime: string | null;
  status: string;
  pool: Pool;
}

const TOKEN_COLORS: Record<string, string> = {
  GCRM: "#F0B90B",
  QFS: "#02C076",
  ALARAB: "#F6465D",
  NESG: "#8B5CF6",
};

const TOKEN_ICONS: Record<string, string> = {
  GCRM: "G",
  QFS: "Q",
  ALARAB: "A",
  NESG: "N",
};

// Flexible staking products — 30 / 90 / 180 / 365 days for each token
const FLEXIBLE_PRODUCTS: { symbol: string; name: string; days: number; apy: number; min: number; badge?: string }[] = [
  // GCRM
  { symbol: "GCRM",   name: "GCRM",   days: 30,  apy: 18.5,  min: 1 },
  { symbol: "GCRM",   name: "GCRM",   days: 90,  apy: 28.0,  min: 1,  badge: "Popular" },
  { symbol: "GCRM",   name: "GCRM",   days: 180, apy: 42.0,  min: 1,  badge: "Hot" },
  { symbol: "GCRM",   name: "GCRM",   days: 365, apy: 55.0,  min: 1,  badge: "Premium" },
  // QFS
  { symbol: "QFS",    name: "QFS",    days: 30,  apy: 12.0,  min: 10 },
  { symbol: "QFS",    name: "QFS",    days: 90,  apy: 18.5,  min: 10 },
  { symbol: "QFS",    name: "QFS",    days: 180, apy: 25.0,  min: 10 },
  { symbol: "QFS",    name: "QFS",    days: 365, apy: 35.0,  min: 10,  badge: "Premium" },
  // ALARAB
  { symbol: "ALARAB", name: "ALARAB", days: 30,  apy: 10.0,  min: 5 },
  { symbol: "ALARAB", name: "ALARAB", days: 90,  apy: 15.0,  min: 5 },
  { symbol: "ALARAB", name: "ALARAB", days: 180, apy: 22.0,  min: 5,  badge: "Hot" },
  { symbol: "ALARAB", name: "ALARAB", days: 365, apy: 30.0,  min: 5,  badge: "Premium" },
  // NESG
  { symbol: "NESG",   name: "NESG",   days: 30,  apy: 8.0,  min: 10 },
  { symbol: "NESG",   name: "NESG",   days: 90,  apy: 13.5,  min: 10 },
  { symbol: "NESG",   name: "NESG",   days: 180, apy: 20.0,  min: 10,  badge: "Hot" },
  { symbol: "NESG",   name: "NESG",   days: 365, apy: 28.0,  min: 10,  badge: "Premium" },
];

const FALLBACK_POOLS: Pool[] = FLEXIBLE_PRODUCTS.map((p, i) => ({
  id: `fallback-${p.symbol.toLowerCase()}-${p.days}`,
  symbol: p.symbol,
  name: p.days === 0 ? `${p.name} Flexible` : `${p.name} ${p.days} Dias`,
  apy: p.apy,
  lockDays: 0, // flexible — no lock
  minStake: p.min,
  totalStaked: 0,
  tvl: 0,
}));

const BADGES: Record<string, { text: string; color: string }> = {
  Popular: { text: "Popular", color: "bg-[#F0B90B] text-black" },
  Hot:     { text: "Hot",     color: "bg-[#F6465D] text-white" },
  Premium: { text: "Premium", color: "bg-gradient-to-r from-[#F0B90B] to-[#FF6B35] text-black" },
};

export function StakingContent() {
  const { address } = useAccount();
  const wallet = address ?? "0x0000000000000000000000000000000000000001";

  const [pools, setPools] = useState<Pool[]>(FALLBACK_POOLS);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pools" | "positions">("pools");
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [stakingRes, balRes] = await Promise.all([
        fetch(`/api/staking?wallet=${wallet}`),
        fetch(`/api/balance?wallet=${wallet}`),
      ]);
      const stakingData = await stakingRes.json();
      const balData = await balRes.json();
      // Always use FALLBACK_POOLS (16 products: 4 tokens × 4 durations)
      // DB pools are legacy — do not override
      // Merge API positions with pool data for fallback pools
      const apiPositions = stakingData.positions || [];
      if (apiPositions.length > 0) {
        setPositions(apiPositions);
      }
      const b: Record<string, number> = {};
      for (const [sym, data] of Object.entries(balData)) {
        b[sym] = (data as { available: number }).available;
      }
      setBalances(b);
    } catch (e) {
      console.error("Staking fetch error, using fallback pools:", e);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStake = async (pool: Pool) => {
    const amt = parseFloat(stakeAmount);
    if (!amt || amt <= 0) return showToast("error", "Ingresa una cantidad valida");
    if (amt < pool.minStake) return showToast("error", `Minimo: ${pool.minStake} ${pool.symbol}`);
    const avail = balances[pool.symbol] ?? 0;
    if (amt > avail) return showToast("error", `Saldo insuficiente. Disponible: ${avail.toFixed(2)} ${pool.symbol}`);

    setActionLoading(`stake-${pool.id}`);
    try {
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stake", walletAddress: wallet, poolId: pool.id, amount: amt }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `Stakeado ${amt} ${pool.symbol} exitosamente`);
        setStakeAmount("");
        fetchData();
      } else {
        showToast("error", data.error || "Error al stakar");
      }
    } catch {
      showToast("error", "Error de conexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnstake = async (position: Position) => {
    setActionLoading(`unstake-${position.id}`);
    try {
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unstake", walletAddress: wallet, poolId: position.poolId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `Unstakeado ${data.unstakedAmount.toFixed(4)} + Reward ${data.rewardClaimed.toFixed(6)} ${position.pool.symbol}`);
        fetchData();
      } else {
        showToast("error", data.error || "Error al unstakear");
      }
    } catch {
      showToast("error", "Error de conexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClaim = async (position: Position) => {
    setActionLoading(`claim-${position.id}`);
    try {
      const res = await fetch("/api/staking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", walletAddress: wallet, poolId: position.poolId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `Reward reclamado: ${data.rewardClaimed.toFixed(6)} ${position.pool.symbol}`);
        fetchData();
      } else {
        showToast("error", data.error || "Error al reclamar");
      }
    } catch {
      showToast("error", "Error de conexion");
    } finally {
      setActionLoading(null);
    }
  };

  const totalStakedValue = positions.reduce((s, p) => s + p.amount, 0);
  const totalPendingRewards = positions.reduce((s, p) => s + p.pendingReward, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0E11]">
        <Loader2 className="w-8 h-8 text-[#F0B90B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B0E11]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-auto z-50 flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg shadow-lg text-xs sm:text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-[#02C076] text-white" : "bg-[#F6465D] text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#F0B90B]" />
            Staking GCRM
          </h1>
          <p className="text-xs text-[#848E9C] mt-0.5">Gana recompensas con tus tokens GCRM, QFS, ALARAB y NESG</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-[#1E2329] rounded-lg p-2 sm:p-3 border border-[#2B3139]">
            <p className="text-[9px] sm:text-[10px] text-[#848E9C]">Total Staked</p>
            <p className="text-sm sm:text-base font-bold text-white">{totalStakedValue.toFixed(2)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-2 sm:p-3 border border-[#2B3139]">
            <p className="text-[9px] sm:text-[10px] text-[#848E9C]">Rewards</p>
            <p className="text-sm sm:text-base font-bold text-[#02C076]">{totalPendingRewards.toFixed(6)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-2 sm:p-3 border border-[#2B3139]">
            <p className="text-[9px] sm:text-[10px] text-[#848E9C]">Posiciones</p>
            <p className="text-sm sm:text-base font-bold text-[#F0B90B]">{positions.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#1E2329] rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("pools")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "pools" ? "bg-[#F0B90B] text-black" : "text-[#848E9C] hover:text-white"
            }`}
          >
            Pools de Staking
          </button>
          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "positions" ? "bg-[#F0B90B] text-black" : "text-[#848E9C] hover:text-white"
            }`}
          >
            Mis Posiciones
          </button>
        </div>

        {/* Pools Tab */}
        {activeTab === "pools" && (
          <div className="space-y-1.5">
            {pools.map((pool) => {
              const isExpanded = expandedPool === pool.id;
              const color = TOKEN_COLORS[pool.symbol] || "#F0B90B";
              const icon = TOKEN_ICONS[pool.symbol] || "?";
              const myPos = positions.find((p) => p.poolId === pool.id);
              const bal = balances[pool.symbol] ?? 0;

              return (
                <div key={pool.id} className="bg-[#1E2329] rounded-md border border-[#2B3139] overflow-hidden">
                  {/* Pool Header — single compact row */}
                  <button
                    onClick={() => setExpandedPool(isExpanded ? null : pool.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-[#2B3139]/30 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-black text-[9px] sm:text-[10px]" style={{ backgroundColor: color }}>
                        {icon}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-[11px] sm:text-xs font-bold text-white truncate leading-tight flex items-center gap-1.5">
                          {pool.name}
                          {(() => {
                            const days = parseInt(pool.name.match(/(\d+)/)?.[1] || "0");
                            const key = days === 90 ? "Popular" : days === 180 ? "Hot" : days === 365 ? "Premium" : "";
                            const badge = BADGES[key];
                            return badge ? <span className={`text-[7px] sm:text-[8px] font-bold px-1 py-px rounded-sm ${badge.color}`}>{badge.text}</span> : null;
                          })()}
                        </p>
                        <p className="text-[8px] sm:text-[9px] text-[#5E6673] leading-tight">Flexible · {pool.name.match(/(\d+)/)?.[1] || ""} dias · Min {pool.minStake}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm font-bold leading-tight" style={{ color }}>{pool.apy}%</p>
                        <p className="text-[8px] text-[#5E6673] leading-tight">APY</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-white leading-tight">{pool.tvl.toFixed(2)}</p>
                        <p className="text-[8px] text-[#5E6673] leading-tight">TVL</p>
                      </div>
                      {myPos && (
                        <div className="text-right hidden md:block">
                          <p className="text-[11px] text-[#02C076] leading-tight">{myPos.pendingReward.toFixed(6)}</p>
                          <p className="text-[8px] text-[#5E6673] leading-tight">Reward</p>
                        </div>
                      )}
                      <ChevronDown className={`w-3 h-3 text-[#5E6673] transition ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded Stake Form */}
                  {isExpanded && (
                    <div className="border-t border-[#2B3139] px-3 py-3 bg-[#181A20]">
                      {myPos && (
                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-[#1E2329] rounded-md p-2">
                            <p className="text-[9px] text-[#5E6673]">Stakeado</p>
                            <p className="text-xs font-bold text-white">{myPos.amount.toFixed(4)} {pool.symbol}</p>
                          </div>
                          <div className="bg-[#1E2329] rounded-md p-2">
                            <p className="text-[9px] text-[#5E6673]">Reward</p>
                            <p className="text-xs font-bold text-[#02C076]">{myPos.pendingReward.toFixed(6)}</p>
                          </div>
                          <div className="bg-[#1E2329] rounded-md p-2">
                            <p className="text-[9px] text-[#5E6673]">Desde</p>
                            <p className="text-xs font-bold text-white">{new Date(myPos.startTime).toLocaleDateString()}</p>
                          </div>
                          <div className="bg-[#1E2329] rounded-md p-2">
                            <p className="text-[9px] text-[#5E6673]">Saldo</p>
                            <p className="text-xs font-bold text-white">{bal.toFixed(4)} {pool.symbol}</p>
                          </div>
                        </div>
                      )}

                      {/* Stake Input */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            placeholder={`Cantidad de ${pool.symbol}`}
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="w-full bg-[#2B3139] border border-[#363C45] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]"
                          />
                          <button
                            onClick={() => setStakeAmount(String(bal))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#F0B90B] font-semibold bg-[#F0B90B]/10 px-1.5 py-0.5 rounded"
                          >
                            MAX
                          </button>
                        </div>
                        <button
                          onClick={() => handleStake(pool)}
                          disabled={!!actionLoading}
                          className="flex items-center justify-center gap-1.5 bg-[#F0B90B] hover:bg-[#F8D12F] text-black font-bold text-xs px-5 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          {actionLoading === `stake-${pool.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          Stake
                        </button>
                      </div>

                      {/* Action Buttons for existing positions */}
                      {myPos && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleClaim(myPos)}
                            disabled={!!actionLoading || myPos.pendingReward <= 0.000001}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#02C076]/10 border border-[#02C076]/30 text-[#02C076] font-semibold text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#02C076]/20 transition disabled:opacity-40"
                          >
                            {actionLoading === `claim-${myPos.id}` ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            <span>Reclamar</span>
                          </button>
                          <button
                            onClick={() => handleUnstake(myPos)}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] font-semibold text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-md hover:bg-[#F6465D]/20 transition disabled:opacity-40"
                          >
                            {actionLoading === `unstake-${myPos.id}` ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <ArrowDownLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            <span>Unstake</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div>
            {positions.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-[#2B3139] mx-auto mb-3" />
                <p className="text-[#848E9C] text-sm">No tienes posiciones de staking activas</p>
                <p className="text-[#5E6673] text-xs mt-1">Stakea tus tokens en la seccion de Pools</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {positions.map((pos) => {
                  const color = TOKEN_COLORS[pos.pool.symbol] || "#F0B90B";
                  const icon = TOKEN_ICONS[pos.pool.symbol] || "?";
                  const daysStaked = ((Date.now() - new Date(pos.startTime).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1);
                  const isLocked = pos.endTime && Date.now() < new Date(pos.endTime).getTime();
                  const daysLeft = isLocked
                    ? Math.ceil((new Date(pos.endTime!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <div key={pos.id} className="bg-[#1E2329] rounded-md border border-[#2B3139] px-2.5 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-bold text-black text-[9px]" style={{ backgroundColor: color }}>
                            {icon}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-[11px] font-bold text-white truncate leading-tight">{pos.pool.name}</p>
                            <p className="text-[8px] text-[#5E6673] leading-tight">{daysStaked}d{isLocked ? ` · Lock ${daysLeft}d` : ""} · +{pos.pool.apy}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleClaim(pos)}
                            disabled={!!actionLoading || pos.pendingReward <= 0.000001}
                            className="flex items-center justify-center gap-1 bg-[#02C076]/10 border border-[#02C076]/30 text-[#02C076] text-[9px] font-semibold px-2 py-1 rounded hover:bg-[#02C076]/20 transition disabled:opacity-40"
                          >
                            {actionLoading === `claim-${pos.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Gift className="w-2.5 h-2.5" />}
                            Claim
                          </button>
                          <button
                            onClick={() => handleUnstake(pos)}
                            disabled={!!actionLoading || isLocked}
                            className="flex items-center justify-center gap-1 bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-[9px] font-semibold px-2 py-1 rounded hover:bg-[#F6465D]/20 transition disabled:opacity-40"
                          >
                            {actionLoading === `unstake-${pos.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                            Unstake
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[8px] text-[#5E6673]">Stakeado</p>
                          <p className="text-[11px] font-bold text-white leading-tight">{pos.amount.toFixed(4)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-[#5E6673]">Reward</p>
                          <p className="text-[11px] font-bold text-[#02C076] leading-tight">{pos.pendingReward.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-[#5E6673]">Desde</p>
                          <p className="text-[11px] text-white leading-tight">{new Date(pos.startTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
