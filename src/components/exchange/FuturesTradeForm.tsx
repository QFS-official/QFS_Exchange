"use client";

import { useState, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { Wallet, Eye, EyeOff, AlertTriangle, Info, Settings2 } from "lucide-react";
import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";

type OrderType = "limit" | "market" | "stop";
type Side = "long" | "short";

export function FuturesTradeForm() {
  const { isConnected } = useAccount();
  const { selectedPairIndex, prices } = useExchangeStore();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const priceData = prices[pair.base.cgId ?? ""];
  const marketPrice = priceData?.usd ?? 0;

  const [leverage, setLeverage] = useState(20);
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [side, setSide] = useState<Side>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [sliderPercent, setSliderPercent] = useState(0);

  const availableBalance = 1250.00;

  const handleLastPrice = useCallback(() => {
    if (marketPrice > 0) setEntryPrice(marketPrice < 1 ? marketPrice.toFixed(4) : marketPrice.toFixed(2));
  }, [marketPrice]);

  const calculations = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = orderType === "market" ? marketPrice : (parseFloat(entryPrice) || 0);
    const notional = qty * price;
    const margin = notional / leverage;
    const fee = notional * 0.0004;
    const roe = margin > 0 ? ((notional - margin) / margin) * 100 * (side === "long" ? 1 : -1) : 0;
    let liqPrice = 0;
    if (margin > 0 && qty > 0) {
      const m = 0.004;
      liqPrice = side === "long" ? price * (1 - (1 / leverage) + m) : price * (1 + (1 / leverage) - m);
    }
    return { notional, margin, fee, roe, liqPrice };
  }, [quantity, entryPrice, marketPrice, leverage, orderType, side]);

  const handleSlider = useCallback((pct: number) => {
    setSliderPercent(pct);
    const price = orderType === "market" ? marketPrice : (parseFloat(entryPrice) || marketPrice);
    if (price <= 0) return;
    const maxNotional = (availableBalance * pct / 100) * leverage;
    const qty = maxNotional / price;
    setQuantity(qty > 0 ? qty.toFixed(qty < 1 ? 4 : 2) : "");
  }, [orderType, marketPrice, entryPrice, leverage, availableBalance]);

  const inputCls = "w-full bg-[#2B3139] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition text-right font-mono placeholder:text-[#5E6673]";
  const labelCls = "text-[10px] text-[#848E9C] mb-1 block";

  return (
    <div className="bg-[#1E2329] h-full flex flex-col">
      {/* Contract info + Balance */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2B3139] shrink-0">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded bg-[#F0B90B]/10 flex items-center justify-center">
            <Settings2 className="w-3 h-3 text-[#F0B90B]" />
          </div>
          <span className="text-[10px] text-[#848E9C]">USDT-M Perpetual</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-white font-mono">
            {isConnected && showBalance ? `${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••"}
          </span>
          <span className="text-[10px] text-[#5E6673]">USDT</span>
          {isConnected && (
            <button onClick={() => setShowBalance(!showBalance)} className="text-[#5E6673] hover:text-[#848E9C] transition">
              {showBalance ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Leverage */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#848E9C]">Leverage</span>
          <span className="text-xs font-bold text-[#F0B90B]">{leverage}x</span>
        </div>
        <div className="relative h-1 bg-[#2B3139] rounded-full">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#F0B90B] to-[#F8D12F] rounded-full transition-all duration-150" style={{ width: `${(leverage / 125) * 100}%` }} />
          <input type="range" min="1" max="125" step="1" value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
        </div>
        <div className="flex gap-0.5 mt-1.5">
          {[1, 5, 10, 25, 50, 100].map((lv) => (
            <button key={lv} onClick={() => setLeverage(lv)} className={`flex-1 text-[9px] py-0.5 rounded-sm font-semibold transition ${
              leverage === lv ? "bg-[#F0B90B]/15 text-[#F0B90B]" : "bg-[#2B3139] text-[#5E6673] hover:text-[#848E9C]"
            }`}>{lv}x</button>
          ))}
        </div>
      </div>

      {/* Order type tabs */}
      <div className="flex items-center px-3 pt-1 pb-1 space-x-3 shrink-0">
        {(["limit", "market", "stop"] as const).map((t) => (
          <button key={t} onClick={() => setOrderType(t)} className={`text-[11px] font-semibold transition relative pb-1.5 ${
            orderType === t ? "text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"
          }`}>
            {t === "stop" ? "Stop Limit" : t.charAt(0).toUpperCase() + t.slice(1)}
            {orderType === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0B90B]" />}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col px-3 pb-3 overflow-y-auto">
        <div className="space-y-2.5 flex-1">
          {/* Entry Price */}
          {(orderType === "limit" || orderType === "stop") && (
            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Price</label>
                <div className="flex items-center space-x-2">
                  {orderType === "limit" && <button onClick={handleLastPrice} className="text-[10px] text-[#F0B90B] font-medium">Last</button>}
                  <span className="text-[10px] text-[#5E6673]">USDT</span>
                </div>
              </div>
              <input type="text" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder={marketPrice > 0 ? marketPrice.toFixed(2) : "0.00"} className={inputCls} />
            </div>
          )}

          {/* Stop Price */}
          {orderType === "stop" && (
            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Trigger Price</label>
                <span className="text-[10px] text-[#5E6673]">USDT</span>
              </div>
              <input type="text" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Qty ({pair.base.symbol})</label>
              <button onClick={() => handleSlider(100)} className="text-[10px] text-[#F0B90B] font-medium">Max</button>
            </div>
            <input type="text" value={quantity} onChange={(e) => { setQuantity(e.target.value); setSliderPercent(0); }} placeholder="0.00" className={inputCls} />
          </div>

          {/* Slider */}
          <div className="flex items-center space-x-1">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} onClick={() => handleSlider(p)} className={`flex-1 text-[10px] py-1 rounded-sm font-semibold transition ${
                sliderPercent === p ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30" : "bg-[#2B3139] text-[#5E6673] hover:text-[#848E9C]"
              }`}>{p}%</button>
            ))}
          </div>

          {/* Margin info — compact */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#2B3139] rounded px-2 py-1.5">
              <span className="text-[9px] text-[#5E6673] block">Margin</span>
              <span className="text-[11px] text-white font-mono">{calculations.margin > 0 ? calculations.margin.toFixed(2) : "0.00"}</span>
            </div>
            <div className="bg-[#2B3139] rounded px-2 py-1.5">
              <span className="text-[9px] text-[#5E6673] block">Notional</span>
              <span className="text-[11px] text-[#848E9C] font-mono">{calculations.notional > 0 ? (calculations.notional > 1000 ? (calculations.notional / 1000).toFixed(1) + "K" : calculations.notional.toFixed(2)) : "0.00"}</span>
            </div>
          </div>

          {/* TP/SL toggle */}
          <div className="flex items-center justify-between">
            <button onClick={() => setShowTpSl(!showTpSl)} className={`flex items-center space-x-1.5 text-[10px] font-semibold transition ${showTpSl ? "text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"}`}>
              <span>TP/SL</span>
              <div className={`w-7 h-3.5 rounded-full transition relative ${showTpSl ? "bg-[#F0B90B]/30" : "bg-[#2B3139]"}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${showTpSl ? "left-4 bg-[#F0B90B]" : "left-0.5 bg-[#5E6673]"}`} />
              </div>
            </button>
            {calculations.roe !== 0 && (
              <span className={`text-[10px] font-mono font-semibold ${calculations.roe > 0 ? "text-[#02C076]" : "text-[#F6465D]"}`}>ROE {calculations.roe > 0 ? "+" : ""}{calculations.roe.toFixed(2)}%</span>
            )}
          </div>

          {showTpSl && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-[#02C076] uppercase tracking-wider mb-1 block">Take Profit</label>
                <input type="text" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} placeholder="0.00" className={`${inputCls} !text-left !pl-2`} />
              </div>
              <div>
                <label className="text-[9px] text-[#F6465D] uppercase tracking-wider mb-1 block">Stop Loss</label>
                <input type="text" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} placeholder="0.00" className={`${inputCls} !text-left !pl-2`} />
              </div>
            </div>
          )}

          {/* Long / Short buttons */}
          {!isConnected ? (
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full py-2.5 rounded font-bold text-xs flex items-center justify-center space-x-2 bg-[#F0B90B] text-black hover:bg-[#F8D12F] transition">
              <Wallet className="w-3.5 h-3.5" /><span>CONNECT WALLET</span>
            </a>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button onClick={() => setSide("long")} className={`py-2.5 rounded font-bold text-[11px] flex items-center justify-center space-x-1 transition ${
                side === "long" ? "bg-[#02C076] text-white" : "bg-[#02C076]/10 text-[#02C076]/50 hover:bg-[#02C076]/20"
              }`}><span>▲</span><span>Buy/Long</span></button>
              <button onClick={() => setSide("short")} className={`py-2.5 rounded font-bold text-[11px] flex items-center justify-center space-x-1 transition ${
                side === "short" ? "bg-[#F6465D] text-white" : "bg-[#F6465D]/10 text-[#F6465D]/50 hover:bg-[#F6465D]/20"
              }`}><span>▼</span><span>Sell/Short</span></button>
            </div>
          )}
        </div>

        {/* Fee & Liquidation — bottom compact */}
        <div className="border-t border-[#2B3139] pt-2 mt-auto space-y-1">
          {calculations.fee > 0 && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#5E6673] flex items-center space-x-1"><Info className="w-2.5 h-2.5" /><span>Est. Fee</span></span>
              <span className="text-[#848E9C] font-mono">{calculations.fee.toFixed(2)} USDT</span>
            </div>
          )}
          {calculations.liqPrice > 0 && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#5E6673] flex items-center space-x-1"><AlertTriangle className="w-2.5 h-2.5" /><span>Liq. Price</span></span>
              <span className="text-[#F6465D] font-mono">{calculations.liqPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
