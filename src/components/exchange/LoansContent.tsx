"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Landmark, AlertTriangle, Info, Shield, Clock, RefreshCw,
  Check, ChevronRight, ArrowRight, Wallet, TrendingUp,
  Lock, Zap, Percent, Calendar, DollarSign, X,
} from "lucide-react";

/* ============================================================
   TYPES
   ============================================================ */
interface LoanProduct {
  id: string; symbol: string; borrowSymbol: string; name: string;
  ltv: number; interestRate: number; maxLoanDuration: number;
  minCollateral: number; maxBorrow: number; isActive: boolean;
  totalBorrowed: number; collateralPriceUsd: number; borrowPriceUsd: number;
}

interface LoanPosition {
  id: string; walletAddress: string; productId: string;
  collateralSymbol: string; collateralAmount: number;
  borrowSymbol: string; borrowAmount: number;
  interestRate: number; interestAccrued: number;
  status: string; startDate: string; dueDate: string;
  repaidAt: string | null; collateralPriceUsd: number; borrowPriceUsd: number;
}

interface BalanceMap { [symbol: string]: { available: number; frozen: number } }

const TOKEN_META: Record<string, { color: string; icon: string }> = {
  USDT: { color: "#26A17B", icon: "\u20AE" },
  GCRM: { color: "#F0B90B", icon: "G" },
  QFS: { color: "#3B82F6", icon: "Q" },
  ALARAB: { color: "#8B5CF6", icon: "A" },
  NESG: { color: "#02C076", icon: "N" },
  BTC: { color: "#F7931A", icon: "\u20BF" },
  ETH: { color: "#627EEA", icon: "\u039E" },
  BNB: { color: "#F0B90B", icon: "B" },
  SOL: { color: "#9945FF", icon: "S" },
  XRP: { color: "#00AAE4", icon: "X" },
  ADA: { color: "#0033AD", icon: "\u20B3" },
  DOGE: { color: "#C2A633", icon: "D" },
  DOT: { color: "#E6007A", icon: "\u25CE" },
  AVAX: { color: "#E84142", icon: "\u25B2" },
  LINK: { color: "#2A5ADA", icon: "\u2197" },
};

type Tab = "borrow" | "my-loans";

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function LoansContent() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("borrow");
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [positions, setPositions] = useState<LoanPosition[]>([]);
  const [balances, setBalances] = useState<BalanceMap>({});
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState<string | null>(null);
  const [repayResult, setRepayResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) { setLoading(false); return; }
    setLoading(true);
    try {
      const [loansRes, balRes] = await Promise.all([
        fetch(`/api/loans?wallet=${address}`),
        fetch(`/api/balance?wallet=${address}`),
      ]);
      if (loansRes.ok) {
        const data = await loansRes.json();
        setProducts(data.products || []);
        setPositions(data.positions || []);
      }
      if (balRes.ok) setBalances(await balRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [address]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRepay = async (posId: string) => {
    if (!address) return;
    setRepaying(posId);
    setRepayResult(null);
    try {
      const res = await fetch("/api/loans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, positionId: posId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRepayResult(data.message);
        fetchData();
      } else {
        alert(data.error || "Repayment failed");
      }
    } catch { alert("Network error"); }
    setRepaying(null);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2B3139] flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[#848E9C]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-[#848E9C] max-w-sm">Connect your wallet to borrow USDT against your crypto collateral.</p>
        </div>
      </div>
    );
  }

  const activePositions = positions.filter(p => p.status === "active");

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E11]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center">
                <Landmark className="w-4 h-4 text-white" />
              </div>
              Crypto Loans
            </h1>
            <p className="text-xs text-[#5E6673] mt-1">Borrow USDT against your crypto collateral — No liquidation risk</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1E2329] rounded-xl p-4">
            <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Active Loans</p>
            <p className="text-lg font-bold text-white">{activePositions.length}</p>
          </div>
          <div className="bg-[#1E2329] rounded-xl p-4">
            <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Total Borrowed</p>
            <p className="text-lg font-bold text-[#F6465D]">
              ${activePositions.reduce((s, p) => s + p.borrowAmount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-[#1E2329] rounded-xl p-4">
            <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Collateral Value</p>
            <p className="text-lg font-bold text-[#F0B90B]">
              ${activePositions.reduce((s, p) => s + p.collateralAmount * (p.collateralPriceUsd || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-[#1E2329] rounded-xl p-4">
            <p className="text-[10px] text-[#5E6673] uppercase tracking-wider mb-1">Available Assets</p>
            <p className="text-lg font-bold text-[#02C076]">14</p>
          </div>
        </div>

        {/* Repay Result */}
        {repayResult && (
          <div className="bg-[#02C076]/10 border border-[#02C076]/20 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#02C076]" />
              <p className="text-sm text-[#02C076] font-medium">{repayResult}</p>
            </div>
            <button onClick={() => setRepayResult(null)} className="text-[#5E6673] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          <button onClick={() => setTab("borrow")} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${tab === "borrow" ? "bg-[#F0B90B]/15 text-[#F0B90B]" : "text-[#848E9C] hover:text-white hover:bg-[#2B3139]"}`}>
            Borrow
          </button>
          <button onClick={() => setTab("my-loans")} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${tab === "my-loans" ? "bg-[#F0B90B]/15 text-[#F0B90B]" : "text-[#848E9C] hover:text-white hover:bg-[#2B3139]"}`}>
            My Loans {activePositions.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-[#F6465D] text-white text-[10px] rounded-full">{activePositions.length}</span>}
          </button>
        </div>

        {tab === "borrow" && (
          <BorrowTab products={products} balances={balances} onBorrowed={fetchData} isLoading={loading} />
        )}
        {tab === "my-loans" && (
          <MyLoansTab positions={positions} repaying={repaying} onRepay={handleRepay} loading={loading} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   BORROW TAB
   ============================================================ */
function BorrowTab({ products, balances, onBorrowed, isLoading }: { products: LoanProduct[]; balances: BalanceMap; onBorrowed: () => void; isLoading: boolean }) {
  const { address } = useAccount();
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [collateralAmt, setCollateralAmt] = useState("");
  const [duration, setDuration] = useState("30");
  const [borrowing, setBorrowing] = useState(false);

  if (!selectedProduct) {
    return (
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 text-[#F0B90B] animate-spin" /></div>
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} balance={balances[p.symbol]?.available || 0} onSelect={() => { setSelectedProduct(p); setCollateralAmt(""); setDuration("30"); }} />)
        )}
      </div>
    );
  }

  const meta = TOKEN_META[selectedProduct.symbol] || { color: "#666", icon: "?" };
  const bal = balances[selectedProduct.symbol]?.available || 0;
  const colAmt = parseFloat(collateralAmt || "0");
  const colValueUsd = colAmt * (selectedProduct.collateralPriceUsd || 0);
  const maxBorrow = colValueUsd * selectedProduct.ltv;
  const days = parseInt(duration);
  const interest = maxBorrow * selectedProduct.interestRate * (days / 365);

  const handleBorrow = async () => {
    if (!address || colAmt <= 0 || maxBorrow <= 0) return;
    setBorrowing(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          productId: selectedProduct.id,
          collateralAmount: colAmt,
          borrowAmount: maxBorrow,
          durationDays: days,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setSelectedProduct(null);
        onBorrowed();
      } else {
        alert(data.error || "Borrow failed");
      }
    } catch { alert("Network error"); }
    setBorrowing(false);
  };

  return (
    <div className="bg-[#1E2329] rounded-2xl p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: meta.color + "33", color: meta.color }}>{meta.icon}</div>
          Borrow USDT against {selectedProduct.name}
        </h2>
        <button onClick={() => setSelectedProduct(null)} className="text-[#5E6673] hover:text-white transition"><X className="w-5 h-5" /></button>
      </div>

      {/* Collateral Input */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-[#5E6673] font-medium">Collateral Amount</label>
          <button onClick={() => setCollateralAmt(bal.toString())} className="text-xs text-[#F0B90B] hover:text-[#F8D12F]">Max: {bal.toFixed(bal < 1 ? 6 : 2)} {selectedProduct.symbol}</button>
        </div>
        <div className="relative">
          <input
            type="number" placeholder="0.00" value={collateralAmt}
            onChange={e => setCollateralAmt(e.target.value)}
            className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F0B90B]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5E6673] font-medium">{selectedProduct.symbol}</span>
        </div>
        <p className="text-[11px] text-[#5E6673] mt-1">Value: ≈ ${colValueUsd.toFixed(2)}</p>
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="text-xs text-[#5E6673] font-medium mb-1.5 block">Loan Duration</label>
        <div className="flex gap-2">
          {["7", "14", "30", "60", "90"].map(d => {
            const dInt = parseInt(d);
            const disabled = dInt > selectedProduct.maxLoanDuration;
            return (
              <button key={d} onClick={() => setDuration(d)} disabled={disabled}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${duration === d ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30" : disabled ? "bg-[#0B0E11] text-[#5E6673] border border-transparent opacity-40 cursor-not-allowed" : "bg-[#0B0E11] text-[#848E9C] border border-[#2B3139] hover:text-white"}`}
              >{d}d</button>
            );
          })}
        </div>
      </div>

      {/* Loan Summary */}
      <div className="bg-[#0B0E11] rounded-xl p-4 space-y-2.5 mb-5">
        <div className="flex justify-between text-xs">
          <span className="text-[#5E6673]">Max LTV</span>
          <span className="text-white">{(selectedProduct.ltv * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#5E6673]">Annual Interest Rate</span>
          <span className="text-[#F0B90B]">{(selectedProduct.interestRate * 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#5E6673]">You Receive (Max Borrow)</span>
          <span className="text-white font-medium">{colAmt > 0 ? `${maxBorrow.toFixed(2)} USDT` : "-"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#5E6673]">Est. Interest ({days}d)</span>
          <span className="text-[#F6465D]">{colAmt > 0 ? `${interest.toFixed(4)} USDT` : "-"}</span>
        </div>
        <div className="border-t border-[#2B3139] pt-2.5 flex justify-between text-xs">
          <span className="text-[#5E6673]">Total to Repay</span>
          <span className="text-white font-semibold">{colAmt > 0 ? `${(maxBorrow + interest).toFixed(2)} USDT` : "-"}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-2 p-3 bg-[#F0B90B]/5 border border-[#F0B90B]/10 rounded-lg mb-4">
        <Shield className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#848E9C] leading-relaxed">Collateral is locked until full repayment. Repay anytime before due date to recover your collateral plus any remaining value.</p>
      </div>

      <button
        onClick={handleBorrow} disabled={borrowing || colAmt <= 0 || maxBorrow <= 0 || colAmt > bal}
        className="w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#F0B90B] hover:bg-[#F8D12F] text-black"
      >
        {borrowing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {borrowing ? "Processing..." : `Borrow ${colAmt > 0 ? maxBorrow.toFixed(2) : "0"} USDT`}
      </button>
    </div>
  );
}

/* ============================================================
   PRODUCT CARD
   ============================================================ */
function ProductCard({ product, balance, onSelect }: { product: LoanProduct; balance: number; onSelect: () => void }) {
  const meta = TOKEN_META[product.symbol] || { color: "#666", icon: "?" };
  const colValue = balance * (product.collateralPriceUsd || 0);
  const maxBorrow = colValue * product.ltv;

  return (
    <button onClick={onSelect} className="w-full bg-[#1E2329] hover:bg-[#2B3139]/50 rounded-xl p-4 transition text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: meta.color + "33", color: meta.color }}>{meta.icon}</div>
          <div>
            <p className="text-sm font-semibold text-white">{product.name}</p>
            <p className="text-[11px] text-[#5E6673]">Balance: {balance.toFixed(balance < 1 ? 6 : 2)} {product.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{(product.ltv * 100).toFixed(0)}% LTV</p>
          <p className="text-[11px] text-[#F0B90B]">{(product.interestRate * 100).toFixed(2)}% APR</p>
        </div>
        <ChevronRight className="w-4 h-4 text-[#5E6673] shrink-0" />
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-[#2B3139]">
        <div className="flex items-center gap-1 text-[10px] text-[#5E6673]">
          <DollarSign className="w-3 h-3" /> Price: <span className="text-white">${(product.collateralPriceUsd || 0).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#5E6673]">
          <TrendingUp className="w-3 h-3" /> Max Borrow: <span className="text-[#02C076]">${maxBorrow.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#5E6673]">
          <Calendar className="w-3 h-3" /> Up to <span className="text-white">{product.maxLoanDuration}d</span>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   MY LOANS TAB
   ============================================================ */
function MyLoansTab({ positions, repaying, onRepay, loading }: {
  positions: LoanPosition[]; repaying: string | null; onRepay: (id: string) => void; loading: boolean;
}) {
  if (loading) {
    return <div className="flex items-center justify-center py-16"><RefreshCw className="w-5 h-5 text-[#F0B90B] animate-spin" /></div>;
  }

  if (positions.length === 0) {
    return (
      <div className="bg-[#1E2329] rounded-xl p-12 text-center">
        <Landmark className="w-10 h-10 text-[#2B3139] mx-auto mb-3" />
        <p className="text-sm text-[#5E6673]">No loans yet. Go to Borrow to get started.</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "text-[#F0B90B]", bg: "bg-[#F0B90B]/15" },
    repaid: { label: "Repaid", color: "text-[#02C076]", bg: "bg-[#02C076]/15" },
    liquidated: { label: "Liquidated", color: "text-[#F6465D]", bg: "bg-[#F6465D]/15" },
    overdue: { label: "Overdue", color: "text-[#F6465D]", bg: "bg-[#F6465D]/15" },
  };

  return (
    <div className="space-y-3">
      {positions.map(pos => {
        const sc = statusConfig[pos.status] || statusConfig.active;
        const meta = TOKEN_META[pos.collateralSymbol] || { color: "#666", icon: "?" };
        const colValue = pos.collateralAmount * (pos.collateralPriceUsd || 0);
        const daysBorrowed = Math.max(1, (Date.now() - new Date(pos.startDate).getTime()) / (1000 * 60 * 60 * 24));
        const interest = pos.borrowAmount * pos.interestRate * (daysBorrowed / 365);
        const totalRepay = pos.borrowAmount + interest;
        const dueDate = new Date(pos.dueDate);
        const isOverdue = pos.status === "active" && dueDate < new Date();
        const daysLeft = Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

        return (
          <div key={pos.id} className="bg-[#1E2329] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: meta.color + "33", color: meta.color }}>{meta.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{pos.collateralSymbol} → USDT</p>
                  <p className="text-[10px] text-[#5E6673]">{(pos.interestRate * 100).toFixed(2)}% APR</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${sc.color} ${sc.bg}`}>{isOverdue ? "Overdue" : sc.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#5E6673]">Collateral</span>
                <span className="text-white">{pos.collateralAmount.toFixed(6)} {pos.collateralSymbol} <span className="text-[#5E6673]">(${colValue.toFixed(2)})</span></span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5E6673]">Borrowed</span>
                <span className="text-[#F6465D]">{pos.borrowAmount.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5E6673]">Interest Accrued</span>
                <span className="text-[#F0B90B]">{interest.toFixed(4)} USDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5E6673]">Days Left</span>
                <span className={daysLeft <= 3 ? "text-[#F6465D]" : "text-white"}>{isOverdue ? "Overdue" : `${daysLeft}d`}</span>
              </div>
            </div>

            {pos.status === "active" && (
              <div className="flex items-center justify-between pt-3 border-t border-[#2B3139]">
                <div>
                  <p className="text-[10px] text-[#5E6673]">Total to Repay</p>
                  <p className="text-sm font-bold text-white">{totalRepay.toFixed(2)} USDT</p>
                </div>
                <button
                  onClick={() => onRepay(pos.id)} disabled={repaying === pos.id}
                  className="px-5 py-2 bg-[#02C076] hover:bg-[#02C076]/80 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  {repaying === pos.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Repay Now
                </button>
              </div>
            )}

            {pos.status === "repaid" && (
              <div className="flex items-center gap-2 pt-3 border-t border-[#2B3139]">
                <Check className="w-3.5 h-3.5 text-[#02C076]" />
                <p className="text-xs text-[#02C076]">Repaid on {pos.repaidAt ? new Date(pos.repaidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


