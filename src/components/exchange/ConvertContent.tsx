"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  ArrowUpDown, ArrowDown, RefreshCw, Check, Info, Zap,
  Wallet, ChevronDown, Clock, Shield,
} from "lucide-react";

/* ============================================================
   TOKEN CONFIG
   ============================================================ */
const TOKENS: Record<string, { name: string; color: string; icon: string; cgId: string }> = {
  USDT:   { name: "Tether USD",    color: "#26A17B", icon: "\u20AE", cgId: "tether" },
  GCRM:   { name: "GCRM Token",     color: "#F0B90B", icon: "G",      cgId: "gcrm-token" },
  QFS:    { name: "QFS Token",      color: "#3B82F6", icon: "Q",      cgId: "qfs-token" },
  ALARAB: { name: "Alarab Token",   color: "#8B5CF6", icon: "A",      cgId: "alarab-token" },
  NESG:   { name: "NESG Token",     color: "#02C076", icon: "N",      cgId: "nesg-token" },
};
const TOKEN_LIST = ["USDT", "GCRM", "QFS", "ALARAB", "NESG"];

interface PriceMap { [cgId: string]: { usd: number; usd_24h_change: number } }
interface BalanceMap { [symbol: string]: { available: number; frozen: number } }

export default function ConvertContent() {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState("GCRM");
  const [toToken, setToToken] = useState("USDT");
  const [fromAmount, setFromAmount] = useState("");
  const [balances, setBalances] = useState<BalanceMap>({});
  const [prices, setPrices] = useState<PriceMap>({});
  const [quote, setQuote] = useState<{ toAmount: number; rate: number } | null>(null);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<{ from: string; to: string; fromAmount: number; toAmount: number } | null>(null);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/balance?wallet=${address}`);
      if (res.ok) setBalances(await res.json());
    } catch {}
  }, [address]);

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const res = await fetch("/api/prices");
      if (res.ok) setPrices(await res.json());
    } catch {}
    setLoadingPrices(false);
  }, []);

  useEffect(() => { fetchBalances(); fetchPrices(); }, [fetchBalances, fetchPrices]);
  useEffect(() => { const iv = setInterval(fetchPrices, 60_000); return () => clearInterval(iv); }, [fetchPrices]);

  // Get price in USD for a symbol
  const getPrice = (sym: string): number => {
    const cgId = TOKENS[sym]?.cgId;
    if (sym === "USDT") return 1;
    if (cgId && prices[cgId]) return prices[cgId].usd;
    return 1;
  };

  // Calculate quote when amounts/tokens change
  useEffect(() => {
    const amt = parseFloat(fromAmount || "0");
    if (amt <= 0 || fromToken === toToken) { setQuote(null); return; }
    const fromPrice = getPrice(fromToken);
    const toPrice = getPrice(toToken);
    const rate = fromPrice / toPrice;
    setQuote({ toAmount: amt * rate, rate });
  }, [fromAmount, fromToken, toToken, prices]);

  // Swap from <-> to
  const handleSwap = () => {
    const prevFrom = fromToken;
    const prevTo = toToken;
    setFromToken(prevTo);
    setToToken(prevFrom);
    if (quote) {
      setFromAmount(quote.toAmount.toFixed(6));
    }
    setResult(null);
  };

  // Execute conversion
  const handleConvert = async () => {
    if (!address || !quote || converting) return;
    setConverting(true);
    setResult(null);
    try {
      const res = await fetch("/api/wallet/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          from: fromToken,
          to: toToken,
          amount: parseFloat(fromAmount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ from: data.from, to: data.to, fromAmount: data.fromAmount, toAmount: data.toAmount });
        setFromAmount("");
        fetchBalances();
      } else {
        alert(data.error || "Conversion failed");
      }
    } catch {
      alert("Network error. Please try again.");
    }
    setConverting(false);
  };

  const fromBal = balances[fromToken]?.available || 0;
  const toBal = balances[toToken]?.available || 0;
  const fromMeta = TOKENS[fromToken];
  const toMeta = TOKENS[toToken];
  const rateDisplay = quote ? (1 / quote.rate) : 0;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2B3139] flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[#848E9C]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-[#848E9C] max-w-sm">Connect your wallet to start converting between GCRM, QFS, ALARAB, NESG, and USDT.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E11]">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Convert
          </h1>
          <p className="text-xs text-[#5E6673] mt-1">Instant, zero-fee conversion between tokens at market price</p>
        </div>

        {/* Success Result */}
        {result && (
          <div className="bg-[#02C076]/10 border border-[#02C076]/20 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-[#02C076]" />
              <span className="text-sm font-semibold text-[#02C076]">Conversion Successful</span>
            </div>
            <p className="text-sm text-white">
              {result.fromAmount.toFixed(6)} {result.from} <span className="text-[#5E6673] mx-1">→</span> {" "}
              <span className="text-[#02C076] font-medium">{result.toAmount.toFixed(6)} {result.to}</span>
            </p>
          </div>
        )}

        {/* Convert Card */}
        <div className="bg-[#1E2329] rounded-2xl p-5 space-y-4">
          {/* From Section */}
          <div className="bg-[#0B0E11] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5E6673] font-medium">From</span>
              <span className="text-xs text-[#5E6673]">
                Balance: <button onClick={() => setFromAmount(fromBal.toString())} className="text-[#F0B90B] hover:text-[#F8D12F] transition">{fromBal.toFixed(fromBal < 1 ? 6 : 2)}</button> {fromToken}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { setShowFromDropdown(!showFromDropdown); setShowToDropdown(false); }}
                  className="flex items-center gap-2 bg-[#2B3139] hover:bg-[#363C45] rounded-lg px-3 py-2.5 transition border border-[#2B3139]"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: fromMeta.color + "33", color: fromMeta.color }}>
                    {fromMeta.icon}
                  </div>
                  <span className="text-sm font-semibold text-white">{fromToken}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5E6673]" />
                </button>
                {showFromDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-[#2B3139] rounded-xl shadow-2xl border border-[#363C45] z-20 overflow-hidden">
                    {TOKEN_LIST.filter(t => t !== toToken).map(sym => {
                      const m = TOKENS[sym];
                      return (
                        <button
                          key={sym}
                          onClick={() => { setFromToken(sym); setShowFromDropdown(false); setFromAmount(""); setResult(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#363C45] transition ${fromToken === sym ? "bg-[#F0B90B]/10" : ""}`}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: m.color + "33", color: m.color }}>{m.icon}</div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{sym}</p>
                            <p className="text-[10px] text-[#5E6673]">{m.name}</p>
                          </div>
                          <span className="ml-auto text-xs text-[#5E6673]">${getPrice(sym).toFixed(sym === "USDT" ? 2 : 4)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="0.00"
                value={fromAmount}
                onChange={e => { setFromAmount(e.target.value); setResult(null); }}
                className="flex-1 bg-transparent text-right text-xl font-semibold text-white placeholder:text-[#5E6673] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <p className="text-[11px] text-[#5E6673] mt-2 text-right">
              ≈ ${fromAmount ? (parseFloat(fromAmount) * getPrice(fromToken)).toFixed(2) : "0.00"} USD
            </p>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleSwap}
              className="w-10 h-10 rounded-full bg-[#2B3139] hover:bg-[#F0B90B] text-[#848E9C] hover:text-black flex items-center justify-center transition border-2 border-[#1E2329] hover:border-[#F0B90B]"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>

          {/* To Section */}
          <div className="bg-[#0B0E11] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5E6673] font-medium">To</span>
              <span className="text-xs text-[#5E6673]">Balance: {toBal.toFixed(toBal < 1 ? 6 : 2)} {toToken}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => { setShowToDropdown(!showToDropdown); setShowFromDropdown(false); }}
                  className="flex items-center gap-2 bg-[#2B3139] hover:bg-[#363C45] rounded-lg px-3 py-2.5 transition border border-[#2B3139]"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: toMeta.color + "33", color: toMeta.color }}>
                    {toMeta.icon}
                  </div>
                  <span className="text-sm font-semibold text-white">{toToken}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5E6673]" />
                </button>
                {showToDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-[#2B3139] rounded-xl shadow-2xl border border-[#363C45] z-20 overflow-hidden">
                    {TOKEN_LIST.filter(t => t !== fromToken).map(sym => {
                      const m = TOKENS[sym];
                      return (
                        <button
                          key={sym}
                          onClick={() => { setToToken(sym); setShowToDropdown(false); setResult(null); }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#363C45] transition ${toToken === sym ? "bg-[#F0B90B]/10" : ""}`}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: m.color + "33", color: m.color }}>{m.icon}</div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">{sym}</p>
                            <p className="text-[10px] text-[#5E6673]">{m.name}</p>
                          </div>
                          <span className="ml-auto text-xs text-[#5E6673]">${getPrice(sym).toFixed(sym === "USDT" ? 2 : 4)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex-1 text-right">
                <p className="text-xl font-semibold text-[#02C076]">
                  {quote ? quote.toAmount.toFixed(quote.toAmount < 0.01 ? 8 : 6) : "0.00"}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-[#5E6673] mt-2 text-right">
              ≈ ${quote ? (quote.toAmount * getPrice(toToken)).toFixed(2) : "0.00"} USD
            </p>
          </div>

          {/* Rate Info */}
          {quote && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <RefreshCw className={`w-3 h-3 ${loadingPrices ? "animate-spin" : ""} text-[#5E6673]`} />
                <span className="text-[11px] text-[#5E6673]">
                  1 {fromToken} = {quote.rate.toFixed(6)} {toToken}
                </span>
              </div>
              <span className="text-[11px] text-[#5E6673]">
                1 {toToken} = {rateDisplay.toFixed(6)} {fromToken}
              </span>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={converting || !fromAmount || parseFloat(fromAmount) <= 0 || !quote || parseFloat(fromAmount) > fromBal}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#F0B90B] hover:bg-[#F8D12F] text-black"
          >
            {converting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
            {converting ? "Converting..." : "Convert Now"}
          </button>

          {fromAmount && parseFloat(fromAmount) > fromBal && (
            <p className="text-[11px] text-[#F6465D] text-center">Insufficient {fromToken} balance</p>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-[#1E2329] rounded-xl p-4">
          <div className="flex items-start gap-2.5 mb-3">
            <Shield className="w-4 h-4 text-[#02C076] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white mb-1">Zero-Fee Instant Conversion</p>
              <p className="text-[11px] text-[#848E9C] leading-relaxed">Convert between GCRM, QFS, ALARAB, NESG, and USDT instantly at market price with zero fees.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white mb-1">Market Price</p>
              <p className="text-[11px] text-[#848E9C] leading-relaxed">Conversion rate is based on real-time market prices from CoinGecko. Rates refresh every 60 seconds.</p>
            </div>
          </div>
        </div>

        {/* Recent Conversions - will show from history */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#5E6673]" />
            <h3 className="text-sm font-semibold text-white">Recent Conversions</h3>
          </div>
          <RecentConversions address={address!} />
        </div>

        {/* Click outside to close dropdowns */}
        {(showFromDropdown || showToDropdown) && (
          <div className="fixed inset-0 z-10" onClick={() => { setShowFromDropdown(false); setShowToDropdown(false); }} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   RECENT CONVERSIONS
   ============================================================ */
function RecentConversions({ address }: { address: string }) {
  const [txs, setTxs] = useState<Array<{ id: string; symbol: string; amount: number; type: string; createdAt: string; note: string | null }>>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/wallet/transactions?wallet=${address}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          // Only show convert-related transactions
          setTxs(data.transactions.filter((t: { network: string }) => t.network === "Convert"));
        }
      } catch {}
    }
    load();
  }, [address]);

  if (txs.length === 0) {
    return (
      <div className="bg-[#1E2329] rounded-xl p-6 text-center">
        <p className="text-xs text-[#5E6673]">No conversions yet. Make your first conversion above.</p>
      </div>
    );
  }

  // Group by pairs (deposit + withdraw are paired)
  const conversions: Array<{ date: string; from: string; to: string; fromAmount: number; toAmount: number }> = [];
  const depositTxs = txs.filter(t => t.type === "deposit");
  const withdrawTxs = txs.filter(t => t.type === "withdraw");

  for (let i = 0; i < depositTxs.length; i++) {
    const dep = depositTxs[i];
    const wit = withdrawTxs[i];
    if (dep && wit) {
      conversions.push({
        date: dep.createdAt,
        from: wit.symbol,
        to: dep.symbol,
        fromAmount: wit.amount,
        toAmount: dep.amount,
      });
    }
  }

  return (
    <div className="bg-[#1E2329] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2B3139]">
            <th className="text-left px-4 py-2.5 text-[10px] text-[#5E6673] font-medium uppercase">You Paid</th>
            <th className="text-center px-2 py-2.5"><span className="text-[#5E6673]"></span></th>
            <th className="text-left px-4 py-2.5 text-[10px] text-[#5E6673] font-medium uppercase">You Received</th>
            <th className="text-right px-4 py-2.5 text-[10px] text-[#5E6673] font-medium uppercase">Time</th>
          </tr>
        </thead>
        <tbody>
          {conversions.slice(0, 5).map((c, i) => {
            const dt = new Date(c.date);
            const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const fromM = TOKENS[c.from];
            const toM = TOKENS[c.to];
            return (
              <tr key={i} className="border-b border-[#2B3139]/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: (fromM?.color || "#666") + "33", color: fromM?.color || "#fff" }}>{fromM?.icon || "?"}</div>
                    <span className="text-xs text-white font-medium">{c.fromAmount.toFixed(6)} {c.from}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-center text-[#5E6673]">→</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: (toM?.color || "#666") + "33", color: toM?.color || "#fff" }}>{toM?.icon || "?"}</div>
                    <span className="text-xs text-[#02C076] font-medium">{c.toAmount.toFixed(6)} {c.to}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[11px] text-[#5E6673]">{timeStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
