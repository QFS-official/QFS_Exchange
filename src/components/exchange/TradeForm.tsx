"use client";

import { useAccount } from "wagmi";
import { useExchangeStore } from "@/lib/store";
import { TRADING_PAIRS } from "@/lib/tokens/config";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Wallet, Eye, EyeOff } from "lucide-react";

interface OrderResult {
  orderId: string;
  matches: {
    trades: { price: number; amount: number; total: number; fee: number }[];
    filledOrders: string[];
    partialOrders: string[];
  };
  orderStatus: string;
}

export function TradeForm() {
  const {
    selectedPairIndex, tradeSide, setTradeSide,
    orderType, setOrderType,
    price: priceInput, setPrice,
    amount, setAmount,
    total, setTotal,
    sliderPercent, setSliderPercent,
    txStatus, setTxStatus, prices,
  } = useExchangeStore();

  const { address, isConnected, chain } = useAccount();
  const pair = TRADING_PAIRS[selectedPairIndex] ?? TRADING_PAIRS[0];
  const priceData = prices[pair.base.cgId ?? ""];
  const marketPrice = priceData?.usd ?? 0;
  const [showBalance, setShowBalance] = useState(true);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");

  // Real exchange balances from API (auto-initializes 10,000 USDT on first fetch)
  const [exchangeBalances, setExchangeBalances] = useState<Record<string, number>>({});

  // Fetch balances from API when wallet connects
  useEffect(() => {
    if (!address) { setExchangeBalances({}); return; }
    let cancelled = false;
    async function fetchBalances() {
      try {
        const res = await fetch(`/api/balance?wallet=${address}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          const flat: Record<string, number> = {};
          for (const [sym, bal] of Object.entries(data)) {
            flat[sym] = (bal as { available: number; frozen: number }).available;
          }
          setExchangeBalances(flat);
        }
      } catch (e) { console.warn("Balance fetch failed:", e); }
    }
    fetchBalances();
    const iv = setInterval(fetchBalances, 10_000); // refresh every 10s
    return () => { cancelled = true; clearInterval(iv); };
  }, [address]);

  // Fetch user's exchange balances (placeholder: in production, query /api/balances)
  const walletBal = address ? exchangeBalances[pair.quote.symbol] ?? 0 : 0;
  const baseBal = address ? exchangeBalances[pair.base.symbol] ?? 0 : 0;
  const spendBalance = tradeSide === "buy" ? walletBal : baseBal;
  const spendSymbol = tradeSide === "buy" ? pair.quote.symbol : pair.base.symbol;

  // Auto-fill market price
  useEffect(() => {
    if (orderType === "market" && marketPrice > 0) {
      setPrice(marketPrice < 1 ? marketPrice.toFixed(4) : marketPrice.toFixed(3));
    }
  }, [orderType, marketPrice, setPrice]);

  // Calculate total from amount * price
  useEffect(() => {
    if (!amount || !priceInput) { setTotal(""); return; }
    const t = parseFloat(amount) * parseFloat(priceInput);
    setTotal(isNaN(t) ? "" : t.toFixed(2));
  }, [amount, priceInput, setTotal]);

  // Slider calculates amount
  useEffect(() => {
    if (sliderPercent === 0 || spendBalance <= 0) return;
    const val = parseFloat(priceInput);
    if (val <= 0) return;
    const maxTotal = spendBalance * (sliderPercent / 100);
    const amt = maxTotal / val;
    setAmount(amt.toFixed(amt < 1 ? 4 : 2));
  }, [sliderPercent, priceInput, spendBalance, setAmount]);

  // Fee calculation
  const fee = useMemo(() => {
    if (!total || parseFloat(total) <= 0) return 0;
    return parseFloat(total) * 0.001;
  }, [total]);

  const handleTrade = useCallback(async () => {
    if (!address || !amount || parseFloat(amount) <= 0) return;
    setError("");
    setOrderResult(null);

    const tradePrice = orderType === "market"
      ? parseFloat(priceInput) || marketPrice
      : parseFloat(priceInput);

    if (!tradePrice || tradePrice <= 0) {
      setError("Precio invalido");
      return;
    }

    const tradeAmount = parseFloat(amount);
    if (tradeAmount <= 0) {
      setError("Cantidad invalida");
      return;
    }

    // Check balance
    const spendAmount = tradeSide === "buy" ? tradePrice * tradeAmount : tradeAmount;
    if (spendAmount > spendBalance) {
      setError("Saldo insuficiente");
      return;
    }

    setTxStatus("swapping");

    try {
      const pairKey = `${pair.base.symbol}_${pair.quote.symbol}`;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          pair: pairKey,
          side: tradeSide,
          type: orderType,
          price: tradePrice,
          amount: tradeAmount,
          chainId: pair.base.chainId,
          baseSymbol: pair.base.symbol,
          quoteSymbol: pair.quote.symbol,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al colocar orden");
        setTxStatus("error");
        return;
      }

      setOrderResult(data);

      if (data.orderStatus === "filled") {
        setTxStatus("success");
      } else if (data.orderStatus === "partial") {
        setTxStatus("success");
      } else if (data.orderStatus === "open") {
        setTxStatus("success");
      } else {
        setTxStatus("error");
        setError(`Orden ${data.orderStatus}`);
      }

      // Update local balances by re-fetching from API
      setExchangeBalances(prev => {
        const next = { ...prev };
        if (data.matches?.trades) {
          for (const t of data.matches.trades) {
            if (tradeSide === "buy") {
              next[pair.quote.symbol] = (next[pair.quote.symbol] ?? 0) - t.total - t.fee;
              next[pair.base.symbol] = (next[pair.base.symbol] ?? 0) + t.amount;
            } else {
              next[pair.base.symbol] = (next[pair.base.symbol] ?? 0) - t.amount;
              next[pair.quote.symbol] = (next[pair.quote.symbol] ?? 0) + t.total - t.fee;
            }
          }
        }
        return next;
      });
      // Also trigger a server-side balance refresh in the background
      fetch(`/api/balance?wallet=${address}`).then(r => r.ok && r.json()).then(data => {
        if (!data) return;
        const flat: Record<string, number> = {};
        for (const [sym, bal] of Object.entries(data)) {
          flat[sym] = (bal as { available: number; frozen: number }).available;
        }
        setExchangeBalances(flat);
      }).catch(() => {});

      setAmount("");
      setTotal("");
      setSliderPercent(0);

      const timer = setTimeout(() => {
        setTxStatus("idle");
        setOrderResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Trade error:", err);
      setError("Error de conexion");
      setTxStatus("error");
    }
  }, [address, amount, priceInput, tradeSide, orderType, marketPrice, pair, spendBalance]);

  const isProcessing = txStatus === "swapping";

  const inputCls = "w-full bg-[#2B3139] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition text-right font-mono placeholder:text-[#5E6673]";
  const labelCls = "text-[10px] text-[#848E9C] mb-1 block";

  return (
    <div className="bg-[#1E2329] h-full flex flex-col">
      {/* Available Balance */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2B3139] shrink-0">
        <span className="text-[10px] text-[#848E9C]">
          {isConnected ? (showBalance ? "Disponible" : "Oculto") : "Conectar wallet"}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-white font-mono">
            {isConnected && showBalance
              ? `${spendBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${spendSymbol}`
              : "••••••••"}
          </span>
          {isConnected && (
            <button onClick={() => setShowBalance(!showBalance)} className="text-[#5E6673] hover:text-[#848E9C] transition">
              {showBalance ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Order type tabs */}
      <div className="flex items-center px-3 pt-2 pb-1 space-x-3 shrink-0">
        {(["limit", "market", "stop"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`text-[11px] font-semibold transition relative pb-1.5 ${
              orderType === t ? "text-[#F0B90B]" : "text-[#5E6673] hover:text-[#848E9C]"
            }`}
          >
            {t === "stop" ? "Stop Limit" : t.charAt(0).toUpperCase() + t.slice(1)}
            {orderType === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F0B90B]" />}
          </button>
        ))}
      </div>

      {/* Form fields */}
      <div className="flex-1 flex flex-col px-3 pb-3 overflow-y-auto">
        <div className="space-y-2.5 flex-1">
          {/* Price */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Precio</label>
              <div className="flex items-center space-x-2">
                {orderType === "limit" && (
                  <button onClick={() => setPrice(marketPrice > 0 ? (marketPrice < 1 ? marketPrice.toFixed(4) : marketPrice.toFixed(3)) : "")} className="text-[10px] text-[#F0B90B] font-medium">Mark</button>
                )}
                <span className="text-[10px] text-[#5E6673]">USDT</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="text" value={priceInput} onChange={(e) => setPrice(e.target.value)}
                disabled={orderType === "market"} placeholder="0.00"
                className={`${inputCls} ${orderType === "market" ? "opacity-40" : ""}`}
              />
              {orderType === "market" && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#F0B90B] font-semibold">Market</span>
              )}
            </div>
          </div>

          {/* Stop Price (only for stop orders) */}
          {orderType === "stop" && (
            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Stop Price</label>
                <span className="text-[10px] text-[#5E6673]">USDT</span>
              </div>
              <input type="text" placeholder="Trigger price" className={inputCls} />
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Cantidad</label>
              <div className="flex items-center space-x-2">
                <button onClick={() => {
                  if (spendBalance > 0 && parseFloat(priceInput) > 0) {
                    const max = spendBalance / parseFloat(priceInput);
                    setAmount(max.toFixed(max < 1 ? 4 : 2));
                  }
                }} className="text-[10px] text-[#F0B90B] font-medium">Max</button>
                <span className="text-[10px] text-[#5E6673]">{pair.base.symbol}</span>
              </div>
            </div>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>

          {/* Slider */}
          <div className="flex items-center space-x-1">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p} onClick={() => setSliderPercent(p)}
                className={`flex-1 text-[10px] py-1 rounded-sm font-semibold transition ${
                  sliderPercent === p
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#5E6673] hover:text-[#848E9C]"
                }`}
              >{p}%</button>
            ))}
          </div>

          {/* Total */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelCls}>Total</label>
              <span className="text-[10px] text-[#5E6673]">USDT</span>
            </div>
            <input type="text" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className={inputCls} />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center space-x-1 text-[10px] text-[#F6465D]">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order result */}
          {orderResult && txStatus === "success" && (
            <div className="bg-[#02C076]/10 border border-[#02C076]/20 rounded p-2 space-y-1">
              <div className="flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#02C076]" />
                <span className="text-[11px] text-[#02C076] font-semibold">
                  {orderResult.orderStatus === "filled" ? "Orden Ejecutada" : orderResult.orderStatus === "partial" ? "Parcialmente Ejecutada" : "Orden Colocada"}
                </span>
              </div>
              {orderResult.matches.trades.length > 0 && (
                <div className="text-[10px] text-[#848E9C] space-y-0.5">
                  {orderResult.matches.trades.map((t, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{t.amount.toFixed(2)} @ {t.price.toFixed(4)}</span>
                      <span className="text-white">{t.total.toFixed(2)} USDT</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Buy / Sell buttons */}
          {!isConnected ? (
            <a
              href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="w-full py-2.5 rounded font-bold text-xs flex items-center justify-center space-x-2 bg-[#F0B90B] text-black hover:bg-[#F8D12F] transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Conectar Wallet</span>
            </a>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={() => { setTradeSide("buy"); }}
                disabled={isProcessing || tradeSide === "sell"}
                className={`py-2.5 rounded font-bold text-xs flex items-center justify-center transition disabled:opacity-40 ${
                  tradeSide === "buy"
                    ? txStatus === "success" ? "bg-[#02C076] text-white" : txStatus === "error" ? "bg-[#F6465D] text-white" : "bg-[#02C076] text-white hover:brightness-110"
                    : "bg-[#02C076]/10 text-[#02C076]/50 hover:bg-[#02C076]/20"
                }`}
              >
                {tradeSide === "buy" && isProcessing && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {tradeSide === "buy" && txStatus === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                {tradeSide === "buy" && txStatus === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                <span>{tradeSide === "buy" ? "COMPRAR" : "COMPRAR"}</span>
              </button>
              <button
                onClick={() => { setTradeSide("sell"); }}
                disabled={isProcessing || tradeSide === "buy"}
                className={`py-2.5 rounded font-bold text-xs flex items-center justify-center transition disabled:opacity-40 ${
                  tradeSide === "sell"
                    ? txStatus === "success" ? "bg-[#F6465D] text-white" : txStatus === "error" ? "bg-[#F6465D] text-white" : "bg-[#F6465D] text-white hover:brightness-110"
                    : "bg-[#F6465D]/10 text-[#F6465D]/50 hover:bg-[#F6465D]/20"
                }`}
              >
                {tradeSide === "sell" && isProcessing && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {tradeSide === "sell" && txStatus === "success" && <CheckCircle className="w-3 h-3 mr-1" />}
                {tradeSide === "sell" && txStatus === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                <span>{tradeSide === "sell" ? "VENDER" : "VENDER"}</span>
              </button>
            </div>
          )}

          {/* Execute button (the actual action) */}
          {isConnected && tradeSide && (
            <button
              onClick={handleTrade}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center transition disabled:opacity-40 ${
                tradeSide === "buy"
                  ? "bg-[#02C076] text-white hover:brightness-110"
                  : "bg-[#F6465D] text-white hover:brightness-110"
              }`}
            >
              {isProcessing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Procesando...</>
              ) : (
                <>{tradeSide === "buy" ? `Comprar ${pair.base.symbol}` : `Vender ${pair.base.symbol}`}</>
              )}
            </button>
          )}
        </div>

        {/* Fee info */}
        <div className="border-t border-[#2B3139] pt-2 mt-auto">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#5E6673]">Comision (0.1%)</span>
            <span className="text-[#848E9C] font-mono">{fee.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
