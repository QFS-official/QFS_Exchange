"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { TRADING_PAIRS } from "@/lib/tokens/config";
import { useExchangeStore } from "@/lib/store";
import { Clock, X, RefreshCw } from "lucide-react";

const TABS = ["Open Orders", "Order History", "Alerts"] as const;
type Tab = (typeof TABS)[number];

interface DBOrder {
  id: string;
  pair: string;
  side: string;
  type: string;
  price: number;
  amount: number;
  filledAmount: number;
  remainingAmount: number;
  total: number;
  fee: number;
  status: string;
  createdAt: string;
}

interface DBTrade {
  id: string;
  pair: string;
  side: string;
  price: number;
  amount: number;
  total: number;
  fee: number;
  createdAt: string;
}

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("Open Orders");
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [trades, setTrades] = useState<DBTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const { selectedPairIndex } = useExchangeStore();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;

  const fetchData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const [ordersRes, tradesRes] = await Promise.all([
        fetch(`/api/orders?wallet=${address}&pair=${pairKey}`),
        fetch(`/api/trades?wallet=${address}&pair=${pairKey}&limit=30`),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (tradesRes.ok) {
        const data = await tradesRes.json();
        setTrades(data.trades || []);
      }
    } catch (e) {
      console.warn("[BottomPanel] Fetch error:", e);
    }
    setLoading(false);
  }, [address, pairKey]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handleCancel = async (orderId: string) => {
    if (!address) return;
    try {
      const res = await fetch(`/api/orders?orderId=${orderId}&wallet=${address}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.warn("Cancel error:", e);
    }
  };

  return (
    <div className="bg-[#1E2329] border-t border-[#2B3139] flex flex-col h-[200px] shrink-0">
      {/* Tabs */}
      <div className="flex items-center border-b border-[#2B3139] px-1 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold transition relative ${
              activeTab === tab
                ? "text-[#F0B90B]"
                : "text-[#5E6673] hover:text-[#848E9C]"
            }`}
          >
            {tab}
            {tab === "Open Orders" && orders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#F0B90B]/20 text-[#F0B90B] text-[10px]">
                {orders.length}
              </span>
            )}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0B90B]" />}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={fetchData}
          className="text-[#5E6673] hover:text-[#848E9C] transition p-2"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {!address ? (
          <div className="flex items-center justify-center h-full text-[#5E6673] text-xs">
            Conecta tu wallet para ver ordenes
          </div>
        ) : activeTab === "Open Orders" ? (
          <OpenOrdersTable orders={orders} onCancel={handleCancel} />
        ) : activeTab === "Order History" ? (
          <HistoryTable trades={trades} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#5E6673] text-xs">
            No hay alertas activas. Crea alertas de precio desde el grafico.
          </div>
        )}
      </div>
    </div>
  );
}

function OpenOrdersTable({ orders, onCancel }: { orders: DBOrder[]; onCancel: (id: string) => void }) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#5E6673] text-xs">
        No hay ordenes abiertas
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[#5E6673] text-[11px]">
          <th className="text-left font-medium px-3 py-1.5">Fecha</th>
          <th className="text-left font-medium px-3 py-1.5">Par</th>
          <th className="text-left font-medium px-3 py-1.5">Tipo</th>
          <th className="text-right font-medium px-3 py-1.5">Lado</th>
          <th className="text-right font-medium px-3 py-1.5">Precio</th>
          <th className="text-right font-medium px-3 py-1.5">Cantidad</th>
          <th className="text-right font-medium px-3 py-1.5">Rellenado</th>
          <th className="text-center font-medium px-3 py-1.5">Accion</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const fillPct = o.amount > 0 ? ((o.filledAmount / o.amount) * 100).toFixed(1) : "0";
          return (
            <tr key={o.id} className="border-t border-[#2B3139]/50 hover:bg-[#2B3139]/30 transition">
              <td className="px-3 py-1.5 text-[#848E9C] font-mono text-[11px]">
                {new Date(o.createdAt).toLocaleTimeString("en-US", { hour12: false })}
              </td>
              <td className="px-3 py-1.5 text-white font-semibold">{o.pair.replace("_", "/")}</td>
              <td className="px-3 py-1.5 text-[#848E9C] capitalize">{o.type}</td>
              <td className={`px-3 py-1.5 text-right font-semibold ${o.side === "buy" ? "text-[#02C076]" : "text-[#F6465D]"}`}>
                {o.side === "buy" ? "Compra" : "Venta"}
              </td>
              <td className="px-3 py-1.5 text-right text-white font-mono">
                {o.price < 1 ? o.price.toFixed(4) : o.price.toFixed(2)}
              </td>
              <td className="px-3 py-1.5 text-right text-[#848E9C] font-mono">
                {o.remainingAmount < 1 ? o.remainingAmount.toFixed(4) : o.remainingAmount.toFixed(2)}
              </td>
              <td className="px-3 py-1.5 text-right text-[#848E9C] font-mono">
                {fillPct}%
              </td>
              <td className="px-3 py-1.5 text-center">
                <button
                  onClick={() => onCancel(o.id)}
                  className="text-[#F6465D] hover:text-[#F6465D]/80 font-medium transition"
                >
                  Cancelar
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function HistoryTable({ trades }: { trades: DBTrade[] }) {
  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[#5E6673] text-xs">
        No hay historial de operaciones
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[#5E6673] text-[11px]">
          <th className="text-left font-medium px-3 py-1.5">Fecha</th>
          <th className="text-left font-medium px-3 py-1.5">Par</th>
          <th className="text-right font-medium px-3 py-1.5">Lado</th>
          <th className="text-right font-medium px-3 py-1.5">Precio</th>
          <th className="text-right font-medium px-3 py-1.5">Cantidad</th>
          <th className="text-right font-medium px-3 py-1.5">Total</th>
          <th className="text-right font-medium px-3 py-1.5">Comision</th>
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => (
          <tr key={t.id} className="border-t border-[#2B3139]/50 hover:bg-[#2B3139]/30 transition">
            <td className="px-3 py-1.5 text-[#848E9C] font-mono text-[11px]">
              {new Date(t.createdAt).toLocaleTimeString("en-US", { hour12: false })}
            </td>
            <td className="px-3 py-1.5 text-white font-semibold">{t.pair.replace("_", "/")}</td>
            <td className={`px-3 py-1.5 text-right font-semibold ${t.side === "buy" ? "text-[#02C076]" : "text-[#F6465D]"}`}>
              {t.side === "buy" ? "Compra" : "Venta"}
            </td>
            <td className="px-3 py-1.5 text-right text-white font-mono">
              {t.price < 1 ? t.price.toFixed(4) : t.price.toFixed(2)}
            </td>
            <td className="px-3 py-1.5 text-right text-[#848E9C] font-mono">
              {t.amount < 1 ? t.amount.toFixed(4) : t.amount.toFixed(2)}
            </td>
            <td className="px-3 py-1.5 text-right text-[#848E9C] font-mono">{t.total.toFixed(2)}</td>
            <td className="px-3 py-1.5 text-right text-[#F0B90B] font-mono">{t.fee.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
