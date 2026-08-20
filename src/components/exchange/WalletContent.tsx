"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, Copy, Check, ChevronDown,
  AlertTriangle, Info, ExternalLink, RefreshCw, QrCode, Search,
  ChevronLeft, ChevronRight, Shield, Zap, Eye, EyeOff, Send,
} from "lucide-react";
import { QRScannerModal } from "@/components/ui/QRScannerModal";

type WalletTab = "overview" | "deposit" | "withdraw" | "transfer" | "history";
type WalletMode = "wallet-overview" | "wallet-deposit" | "wallet-withdraw" | "wallet-transfer" | "wallet-history";

interface WalletContentProps {
  mode?: WalletMode;
}

interface BalanceData {
  [symbol: string]: { available: number; frozen: number };
}

interface Transaction {
  id: string;
  type: string;
  symbol: string;
  amount: number;
  fee: number;
  status: string;
  txHash: string | null;
  toAddress: string | null;
  fromAddress: string | null;
  network: string;
  memo: string | null;
  createdAt: string;
}

const NETWORK_ICONS: Record<string, { color: string; icon: string }> = {
  "Ethereum (ERC20)": { color: "#627EEA", icon: "Ξ" },
  "BSC (BEP20)":       { color: "#F0B90B", icon: "B" },
  "Polygon":           { color: "#8247E5", icon: "P" },
  "Arbitrum One":      { color: "#28A0F0", icon: "A" },
  "Optimism":          { color: "#FF0420", icon: "O" },
  "Avalanche C-Chain": { color: "#E84142", icon: "▲" },
  "Base":              { color: "#0052FF", icon: "■" },
  "Tron (TRC20)":      { color: "#FF0013", icon: "T" },
  "Solana (SPL)":      { color: "#14F195", icon: "S" },
};

const TOKEN_META: Record<string, { name: string; color: string; networks: string[]; icon: string }> = {
  USDT:   { name: "Tether USD",   color: "#26A17B", networks: ["Ethereum (ERC20)", "BSC (BEP20)", "Polygon", "Arbitrum One", "Optimism", "Avalanche C-Chain", "Base", "Tron (TRC20)", "Solana (SPL)"], icon: "₮" },
  GCRM:   { name: "GCRM Token",   color: "#F0B90B", networks: ["Ethereum (ERC20)", "BSC (BEP20)", "Polygon", "Arbitrum One", "Base"], icon: "G" },
  QFS:    { name: "QFS Token",    color: "#3B82F6", networks: ["Ethereum (ERC20)", "BSC (BEP20)", "Polygon", "Arbitrum One", "Base"], icon: "Q" },
  ALARAB: { name: "Alarab Token", color: "#8B5CF6", networks: ["Polygon", "BSC (BEP20)", "Ethereum (ERC20)", "Arbitrum One"], icon: "A" },
  NESG:   { name: "NESG Token",   color: "#02C076", networks: ["Ethereum (ERC20)", "BSC (BEP20)", "Polygon", "Arbitrum One", "Base"], icon: "N" },
};

const ALL_TOKENS = ["USDT", "GCRM", "QFS", "ALARAB", "NESG"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-[#F0B90B]", bg: "bg-[#F0B90B]/15" },
  processing: { label: "Processing", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/15" },
  completed: { label: "Completed", color: "text-[#02C076]", bg: "bg-[#02C076]/15" },
  failed: { label: "Failed", color: "text-[#F6465D]", bg: "bg-[#F6465D]/15" },
  rejected: { label: "Rejected", color: "text-[#F6465D]", bg: "bg-[#F6465D]/15" },
  cancelled: { label: "Cancelled", color: "text-[#848E9C]", bg: "bg-[#848E9C]/15" },
};

export default function WalletContent({ mode }: WalletContentProps) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [balances, setBalances] = useState<BalanceData>({});
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);

  // Sync tab from mode prop
  useEffect(() => {
    if (mode) {
      const map: Record<WalletMode, WalletTab> = {
        "wallet-overview": "overview",
        "wallet-deposit": "deposit",
        "wallet-withdraw": "withdraw",
        "wallet-transfer": "transfer",
        "wallet-history": "history",
      };
      setActiveTab(map[mode] || "overview");
    }
  }, [mode]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/balance?wallet=${address}`);
      if (res.ok) setBalances(await res.json());
    } catch (e) { console.error("Balance fetch error:", e); }
    setLoading(false);
  }, [address]);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  const tabs: { id: WalletTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Wallet className="w-4 h-4" /> },
    { id: "deposit", label: "Deposit", icon: <ArrowDownLeft className="w-4 h-4" /> },
    { id: "withdraw", label: "Withdraw", icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: "transfer", label: "Transferir", icon: <Send className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <Clock className="w-4 h-4" /> },
  ];

  const totalBalance = Object.values(balances).reduce((sum, b) => sum + b.available + b.frozen, 0);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2B3139] flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[#848E9C]" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-[#848E9C] max-w-sm">Please connect your wallet to view balances, make deposits, and withdraw funds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-5 pb-4 border-b border-[#2B3139]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              Wallet
            </h1>
            <p className="text-xs text-[#5E6673] mt-1">Manage your assets — Deposit, Withdraw, and View History</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchBalances} className="p-2 rounded-lg bg-[#2B3139] hover:bg-[#363C45] text-[#848E9C] hover:text-white transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => setHideBalances(!hideBalances)} className="p-2 rounded-lg bg-[#2B3139] hover:bg-[#363C45] text-[#848E9C] hover:text-white transition">
              {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="bg-[#1E2329] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5E6673] mb-1">Estimated Balance</p>
              <p className="text-2xl font-bold text-white">
                {hideBalances ? "****.**" : `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("deposit")}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#02C076] hover:bg-[#02C076]/80 text-white text-sm font-semibold rounded-lg transition"
              >
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F0B90B] hover:bg-[#F8D12F] text-black text-sm font-semibold rounded-lg transition"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#F0B90B]/15 text-[#F0B90B]"
                  : "text-[#848E9C] hover:text-white hover:bg-[#2B3139]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab balances={balances} loading={loading} hide={hideBalances} onSelectDeposit={() => setActiveTab("deposit")} onSelectWithdraw={() => setActiveTab("withdraw")} />}
        {activeTab === "deposit" && <DepositTab address={address!} balances={balances} hide={hideBalances} onRefresh={fetchBalances} />}
        {activeTab === "withdraw" && <WithdrawTab address={address!} balances={balances} hide={hideBalances} onRefresh={fetchBalances} />}
        {activeTab === "transfer" && <TransferTab address={address!} balances={balances} hide={hideBalances} onRefresh={fetchBalances} />}
        {activeTab === "history" && <HistoryTab address={address!} hide={hideBalances} />}
      </div>
    </div>
  );
}

/* ============================================================
   OVERVIEW TAB
   ============================================================ */
function OverviewTab({ balances, loading, hide, onSelectDeposit, onSelectWithdraw }: {
  balances: BalanceData; loading: boolean; hide: boolean;
  onSelectDeposit: () => void; onSelectWithdraw: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens = ALL_TOKENS.filter(
    (t) => t.toLowerCase().includes(searchTerm.toLowerCase()) || (TOKEN_META[t]?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#2B3139] border border-[#2B3139] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50"
        />
      </div>
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#2B3139] text-xs text-[#5E6673] font-medium uppercase tracking-wider">
          <div className="col-span-4">Asset</div>
          <div className="col-span-3 text-right">Available</div>
          <div className="col-span-2 text-right">In Orders</div>
          <div className="col-span-3 text-right">Action</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 text-[#F0B90B] animate-spin" />
          </div>
        ) : (
          filteredTokens.map((symbol) => {
            const meta = TOKEN_META[symbol];
            const bal = balances[symbol] || { available: 0, frozen: 0 };
            return (
              <div key={symbol} className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-[#2B3139]/50 hover:bg-[#2B3139]/30 transition items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: meta?.color + "33", color: meta?.color }}>
                    {meta?.icon || symbol[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{symbol}</p>
                    <p className="text-[11px] text-[#5E6673]">{meta?.name}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <p className="text-sm font-medium text-white">{hide ? "*****" : bal.available.toFixed(bal.available < 1 ? 6 : 2)}</p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm text-[#848E9C]">{hide ? "*****" : bal.frozen.toFixed(bal.frozen < 1 ? 6 : 2)}</p>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button onClick={onSelectDeposit} className="px-3 py-1.5 text-xs font-medium text-[#02C076] bg-[#02C076]/10 hover:bg-[#02C076]/20 rounded-md transition">
                    Deposit
                  </button>
                  <button onClick={onSelectWithdraw} className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] bg-[#F0B90B]/10 hover:bg-[#F0B90B]/20 rounded-md transition">
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DEPOSIT TAB
   ============================================================ */
function DepositTab({ address, balances, hide, onRefresh }: {
  address: string; balances: BalanceData; hide: boolean; onRefresh: () => void;
}) {
  const [selectedToken, setSelectedToken] = useState("GCRM");
  const [selectedNetwork, setSelectedNetwork] = useState(TOKEN_META.GCRM.networks[0]);
  const [depositAddress, setDepositAddress] = useState("");
  const [minDeposit, setMinDeposit] = useState(1);
  const [confirmations, setConfirmations] = useState(12);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositMsg, setDepositMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const meta = TOKEN_META[selectedToken];
  const bal = balances[selectedToken] || { available: 0, frozen: 0 };

  useEffect(() => {
    setSelectedNetwork(TOKEN_META[selectedToken]?.networks[0] || "");
    setDepositMsg(null);
    setDepositAmount("");
  }, [selectedToken]);

  useEffect(() => {
    async function fetchDepositInfo() {
      try {
        const res = await fetch(`/api/wallet/deposit?wallet=${address}&symbol=${selectedToken}`);
        if (res.ok) {
          const data = await res.json();
          const net = data.networks?.find((n: { network: string }) => n.network === selectedNetwork);
          if (net) {
            setDepositAddress(net.address);
            setMinDeposit(net.minDeposit);
            setConfirmations(net.confirmations);
            setEstimatedTime(net.estimatedTime || "");
          }
        }
      } catch (e) { console.error(e); }
    }
    fetchDepositInfo();
  }, [address, selectedToken, selectedNetwork]);

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositing(true);
    setDepositMsg(null);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          symbol: selectedToken,
          amount: parseFloat(depositAmount),
          network: selectedNetwork,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDepositMsg({ type: "success", text: data.message || "Deposit successful!" });
        setDepositAmount("");
        onRefresh();
      } else {
        setDepositMsg({ type: "error", text: data.error || "Deposit failed" });
      }
    } catch {
      setDepositMsg({ type: "error", text: "Network error. Please try again." });
    }
    setDepositing(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Select Coin</label>
        <div className="relative">
          <button
            onClick={() => {}}
            className="w-full flex items-center justify-between bg-[#2B3139] rounded-lg px-4 py-3 text-left border border-[#2B3139] focus:border-[#F0B90B]/50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: meta.color + "33", color: meta.color }}>
                {meta.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{selectedToken}</p>
                <p className="text-[11px] text-[#5E6673]">{meta.name}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#5E6673]" />
          </button>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_TOKENS.map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedToken(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedToken === sym
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#848E9C] hover:text-white border border-transparent"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Network</label>
        <div className="flex flex-wrap gap-2">
          {meta.networks.map((nw) => {
            const nwMeta = NETWORK_ICONS[nw];
            return (
              <button
                key={nw}
                onClick={() => setSelectedNetwork(nw)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedNetwork === nw
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#848E9C] hover:text-white border border-transparent"
                }`}
              >
                {nwMeta && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: nwMeta.color + "33", color: nwMeta.color }}
                  >
                    {nwMeta.icon}
                  </span>
                )}
                {nw}
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Deposit Address</label>
        <div className="bg-[#0B0E11] rounded-lg p-4 border border-[#2B3139]">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-mono text-white break-all flex-1">{depositAddress || "Loading..."}</p>
            <button onClick={copyAddress} className="shrink-0 p-2 rounded-lg bg-[#2B3139] hover:bg-[#363C45] text-[#848E9C] hover:text-white transition">
              {copied ? <Check className="w-4 h-4 text-[#02C076]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-1.5 text-xs text-[#F0B90B] hover:text-[#F8D12F] transition">
            <QrCode className="w-3.5 h-3.5" /> {showQR ? "Hide QR Code" : "Show QR Code"}
          </button>
          {showQR && depositAddress && (
            <div className="mt-3 flex justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={depositAddress} size={160} />
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2 p-3 bg-[#F0B90B]/5 border border-[#F0B90B]/10 rounded-lg">
          <Info className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#848E9C] leading-relaxed">
            <p>Minimum deposit: <span className="text-white font-medium">{minDeposit} {selectedToken}</span></p>
            <p>Network confirmations: <span className="text-white font-medium">{confirmations}</span></p>
            {estimatedTime && <p>Estimated arrival: <span className="text-white font-medium">{estimatedTime}</span></p>}
            <p className="mt-1 text-[#F6465D]">Only send {selectedToken} via {selectedNetwork}. Deposits via other networks may result in permanent loss.</p>
          </div>
        </div>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#02C076]" />
          <label className="text-xs text-[#5E6673] font-medium uppercase tracking-wider">Quick Deposit (Virtual Credit)</label>
        </div>
        <p className="text-xs text-[#848E9C] mb-3">Instantly credit your GCRM Exchange wallet for trading. No on-chain transfer required.</p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="number"
              placeholder={`Amount in ${selectedToken}`}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-[#2B3139] border border-[#2B3139] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5E6673] font-medium">{selectedToken}</span>
          </div>
          <button
            onClick={handleDeposit}
            disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
            className="px-6 py-2.5 bg-[#02C076] hover:bg-[#02C076]/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
          >
            {depositing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
            Deposit
          </button>
        </div>
        {depositMsg && (
          <div className={`mt-3 p-3 rounded-lg text-xs font-medium ${depositMsg.type === "success" ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#F6465D]/10 text-[#F6465D]"}`}>
            {depositMsg.text}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#5E6673]">
          <span>Current balance:</span>
          <span className="text-white font-medium">{hide ? "*****" : `${bal.available.toFixed(bal.available < 1 ? 6 : 2)} ${selectedToken}`}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WITHDRAW TAB
   ============================================================ */
function WithdrawTab({ address, balances, hide, onRefresh }: {
  address: string; balances: BalanceData; hide: boolean; onRefresh: () => void;
}) {
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState(TOKEN_META.USDT.networks[0]);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [fee, setFee] = useState(1);
  const [available, setAvailable] = useState(0);
  const [minWithdraw, setMinWithdraw] = useState(5);
  const [maxWithdraw, setMaxWithdraw] = useState(100000);
  const [withdrawEstTime, setWithdrawEstTime] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const meta = TOKEN_META[selectedToken];
  const bal = balances[selectedToken] || { available: 0, frozen: 0 };
  const amt = withdrawAmount ? parseFloat(withdrawAmount) : 0;
  const receiveAmt = Math.max(0, amt - fee);

  useEffect(() => {
    setSelectedNetwork(TOKEN_META[selectedToken]?.networks[0] || "");
    setWithdrawMsg(null);
    setWithdrawAmount("");
    setWithdrawAddress("");
  }, [selectedToken]);

  useEffect(() => {
    async function fetchWithdrawInfo() {
      try {
        const res = await fetch(`/api/wallet/withdraw?wallet=${address}&symbol=${selectedToken}`);
        if (res.ok) {
          const data = await res.json();
          setAvailable(data.available);
          // Set fee/min/max for the currently selected network
          const netInfo = data.networks?.find((n: { network: string }) => n.network === selectedNetwork);
          if (netInfo) {
            setFee(netInfo.fee);
            setMinWithdraw(netInfo.min);
            setMaxWithdraw(netInfo.max);
            setWithdrawEstTime(netInfo.estimatedTime || "");
          }
        }
      } catch (e) { console.error(e); }
    }
    fetchWithdrawInfo();
  }, [address, selectedToken, selectedNetwork]);

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount || amt <= 0) return;
    setWithdrawing(true);
    setWithdrawMsg(null);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          symbol: selectedToken,
          amount: amt,
          network: selectedNetwork,
          toAddress: withdrawAddress,
          memo: memo || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawMsg({ type: "success", text: data.message || "Withdrawal submitted successfully!" });
        setWithdrawAmount("");
        setWithdrawAddress("");
        setShowConfirm(false);
        onRefresh();
      } else {
        setWithdrawMsg({ type: "error", text: data.error || "Withdrawal failed" });
      }
    } catch {
      setWithdrawMsg({ type: "error", text: "Network error. Please try again." });
    }
    setWithdrawing(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Select Coin</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TOKENS.map((sym) => {
            const m = TOKEN_META[sym];
            return (
              <button
                key={sym}
                onClick={() => setSelectedToken(sym)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedToken === sym
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#848E9C] hover:text-white border border-transparent"
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: m.color + "33", color: m.color }}>
                  {m.icon}
                </div>
                {sym}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[#5E6673]">Available Balance</span>
          <span className="text-white font-medium">{hide ? "*****" : `${available.toFixed(available < 1 ? 6 : 2)} ${selectedToken}`}</span>
        </div>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Network</label>
        <div className="flex flex-wrap gap-2">
          {meta.networks.map((nw) => {
            const nwMeta = NETWORK_ICONS[nw];
            return (
              <button
                key={nw}
                onClick={() => setSelectedNetwork(nw)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  selectedNetwork === nw
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#848E9C] hover:text-white border border-transparent"
                }`}
              >
                {nwMeta && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                    style={{ backgroundColor: nwMeta.color + "33", color: nwMeta.color }}
                  >
                    {nwMeta.icon}
                  </span>
                )}
                {nw}
              </button>
            );
          })}
        </div>
        {withdrawEstTime && (
          <p className="mt-2 text-[11px] text-[#5E6673]">Estimated arrival: <span className="text-[#02C076] font-medium">{withdrawEstTime}</span></p>
        )}
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider">Withdrawal Address</label>
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-1 text-[10px] text-[#F0B90B] hover:text-[#F8D12F] font-medium transition"
          >
            <QrCode className="w-3.5 h-3.5" />
            Scan QR
          </button>
        </div>
        <input
          type="text"
          placeholder={selectedNetwork.includes("TRC20") ? "Enter Tron address (T...)" : selectedNetwork.includes("SPL") ? "Enter Solana address" : "Enter withdrawal address (0x...)"}
          value={withdrawAddress}
          onChange={(e) => setWithdrawAddress(e.target.value)}
          className="w-full bg-[#2B3139] border border-[#2B3139] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition font-mono"
        />

        {selectedNetwork === "Tron (TRC20)" && (
          <div className="mt-3">
            <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-2">Memo (Optional)</label>
            <input
              type="text"
              placeholder="Enter memo/tag if required"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-[#2B3139] border border-[#2B3139] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition"
            />
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#5E6673] font-medium uppercase tracking-wider">Amount</label>
            <button
              onClick={() => setWithdrawAmount(available.toString())}
              className="text-xs text-[#F0B90B] hover:text-[#F8D12F] font-medium transition"
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <input
              type="number"
              placeholder={`Minimum: ${minWithdraw} ${selectedToken}`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-[#2B3139] border border-[#2B3139] rounded-lg px-4 py-2.5 pr-16 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5E6673] font-medium">{selectedToken}</span>
          </div>
        </div>
        <div className="mt-4 bg-[#0B0E11] rounded-lg p-4 space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Withdrawal Amount</span>
            <span className="text-white">{amt > 0 ? `${amt.toFixed(6)} ${selectedToken}` : "-"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Network Fee</span>
            <span className="text-white">{fee} {selectedToken}</span>
          </div>
          <div className="border-t border-[#2B3139] pt-2.5 flex justify-between text-xs">
            <span className="text-[#5E6673]">You Receive</span>
            <span className="text-[#02C076] font-medium">{amt > 0 ? `${receiveAmt.toFixed(6)} ${selectedToken}` : "-"}</span>
          </div>
        </div>
        <div className="mt-3 flex gap-2 p-3 bg-[#F6465D]/5 border border-[#F6465D]/10 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
          <div className="text-[11px] text-[#848E9C] leading-relaxed">
            <p>Minimum withdrawal: <span className="text-white font-medium">{minWithdraw} {selectedToken}</span></p>
            <p>Ensure the address supports {selectedNetwork}. Incorrect addresses may result in permanent loss of funds.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={withdrawing || !withdrawAddress || !withdrawAmount || amt < minWithdraw}
          className="flex-1 py-3 bg-[#F0B90B] hover:bg-[#F8D12F] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          {withdrawing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
          Withdraw
        </button>
      </div>

      {withdrawMsg && (
        <div className={`mt-3 p-3 rounded-lg text-xs font-medium ${withdrawMsg.type === "success" ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#F6465D]/10 text-[#F6465D]"}`}>
          {withdrawMsg.text}
        </div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-[#1E2329] rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F6465D]/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#F6465D]" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Withdrawal</h3>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Coin</span>
                <span className="text-white font-medium">{selectedToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Network</span>
                <span className="text-white font-medium">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Amount</span>
                <span className="text-white font-medium">{amt.toFixed(6)} {selectedToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Fee</span>
                <span className="text-white font-medium">{fee} {selectedToken}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">You Receive</span>
                <span className="text-[#02C076] font-medium">{receiveAmt.toFixed(6)} {selectedToken}</span>
              </div>
              <div className="pt-2 border-t border-[#2B3139]">
                <span className="text-xs text-[#5E6673]">To Address</span>
                <p className="text-xs font-mono text-white mt-1 break-all">{withdrawAddress}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 bg-[#2B3139] hover:bg-[#363C45] text-white text-sm font-medium rounded-lg transition">
                Cancel
              </button>
              <button onClick={handleWithdraw} className="flex-1 py-2.5 bg-[#F6465D] hover:bg-[#F6465D]/80 text-white text-sm font-medium rounded-lg transition">
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR Scanner Modal */}
      <QRScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onResult={(data) => { setWithdrawAddress(data.trim()); setQrOpen(false); }}
      />
    </div>
  );
}

/* ============================================================
   HISTORY TAB
   ============================================================ */
function HistoryTab({ address, hide }: { address: string; hide: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSymbol, setFilterSymbol] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTx = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ wallet: address, page: page.toString(), limit: "20" });
      if (filterType !== "all") params.set("type", filterType);
      if (filterSymbol !== "all") params.set("symbol", filterSymbol);
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/wallet/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [address, filterType, filterSymbol, filterStatus, page]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const resetFilters = () => {
    setFilterType("all");
    setFilterSymbol("all");
    setFilterStatus("all");
    setPage(1);
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const fmtAddr = (a: string | null) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : "-";

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="bg-[#2B3139] border border-[#2B3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F0B90B]/50"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
        </select>
        <select
          value={filterSymbol}
          onChange={(e) => { setFilterSymbol(e.target.value); setPage(1); }}
          className="bg-[#2B3139] border border-[#2B3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F0B90B]/50"
        >
          <option value="all">All Coins</option>
          {ALL_TOKENS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-[#2B3139] border border-[#2B3139] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F0B90B]/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={resetFilters} className="px-3 py-2 text-xs text-[#848E9C] hover:text-white transition">Reset</button>
      </div>
      <div className="bg-[#1E2329] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2B3139]">
                <th className="text-left px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Time</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Coin</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Type</th>
                <th className="text-right px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Amount</th>
                <th className="text-right px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Fee</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[10px] text-[#5E6673] font-medium uppercase tracking-wider">Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><RefreshCw className="w-5 h-5 text-[#F0B90B] animate-spin mx-auto" /></td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-[#5E6673]">No transactions found</td></tr>
              ) : (
                transactions.map((tx) => {
                  const sc = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
                  const meta = TOKEN_META[tx.symbol];
                  return (
                    <tr key={tx.id} className="border-b border-[#2B3139]/30 hover:bg-[#2B3139]/20 transition">
                      <td className="px-4 py-3 text-xs text-[#848E9C] whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: (meta?.color || "#666") + "33", color: meta?.color || "#fff" }}>
                            {meta?.icon || tx.symbol[0]}
                          </div>
                          <span className="text-xs font-medium text-white">{tx.symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${tx.type === "deposit" ? "text-[#02C076]" : "text-[#F6465D]"}`}>
                          {tx.type === "deposit" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === "deposit" ? "Deposit" : "Withdraw"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-white font-medium">
                        {hide ? "*****" : `${tx.type === "withdraw" ? "-" : "+"}${tx.amount.toFixed(6)}`}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#5E6673]">{tx.fee > 0 ? `${tx.fee}` : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${sc.color} ${sc.bg}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#5E6673] font-mono">{fmtAddr(tx.toAddress || tx.fromAddress)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2B3139]">
            <p className="text-xs text-[#5E6673]">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-1.5 rounded bg-[#2B3139] hover:bg-[#363C45] disabled:opacity-30 text-[#848E9C] transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-1.5 rounded bg-[#2B3139] hover:bg-[#363C45] disabled:opacity-30 text-[#848E9C] transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SIMPLE QR CODE SVG (no external deps)
   ============================================================ */
function QRCodeSVG({ value, size = 160 }: { value: string; size?: number }) {
  // Generate a deterministic pattern from the string for visual representation
  const hash = value.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells = 21;
  const cellSize = size / cells;

  const isFinderPattern = (r: number, c: number) => {
    // Top-left
    if (r < 7 && c < 7) return true;
    // Top-right
    if (r < 7 && c >= cells - 7) return true;
    // Bottom-left
    if (r >= cells - 7 && c < 7) return true;
    return false;
  };

  const isFinderFilled = (r: number, c: number) => {
    const inOuter = (r === 0 || r === 6 || c === 0 || c === 6);
    const inInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
    return inOuter || inInner;
  };

  const isDataFilled = (r: number, c: number) => {
    const idx = (r * cells + c + hash) % 17;
    return idx < 8;
  };

  const rects: JSX.Element[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      let filled = false;
      if (isFinderPattern(r, c)) {
        filled = isFinderFilled(r, c);
      } else {
        filled = isDataFilled(r, c);
      }
      if (filled) {
        rects.push(<rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#000" />);
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {rects}
    </svg>
  );
}

/* ============================================================
   TRANSFER TAB — Internal wallet-to-wallet transfer
   ============================================================ */
const TRANSFER_TOKENS = ["GCRM", "NESG", "ALARAB", "QFS"];

function TransferTab({ address, balances, hide, onRefresh }: {
  address: string; balances: BalanceData; hide: boolean; onRefresh: () => void;
}) {
  const [selectedToken, setSelectedToken] = useState("GCRM");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const meta = TOKEN_META[selectedToken];
  const bal = balances[selectedToken] || { available: 0, frozen: 0 };
  const amt = parseFloat(amount || "0");

  const handleMax = () => setAmount(bal.available.toString());

  const handleTransfer = async () => {
    if (!toAddress || amt <= 0) return;
    if (!confirmed) { setConfirmed(true); return; }

    setTransferring(true);
    setResult(null);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWallet: address,
          toWallet: toAddress.trim(),
          symbol: selectedToken,
          amount: amt,
          memo: memo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: "success", text: data.message });
        setToAddress("");
        setAmount("");
        setMemo("");
        setConfirmed(false);
        onRefresh();
      } else {
        setResult({ type: "error", text: data.error || "Transferencia fallida" });
        setConfirmed(false);
      }
    } catch {
      setResult({ type: "error", text: "Error de red. Intenta de nuevo." });
      setConfirmed(false);
    }
    setTransferring(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#F8D12F] flex items-center justify-center">
            <Send className="w-4 h-4 text-black" />
          </div>
          Transferencia Interna
        </h2>
        <p className="text-xs text-[#5E6673] mt-1">Envia tokens directamente a otra wallet dentro de GCRM Exchange. Sin comisiones.</p>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-3">Seleccionar Token</label>
        <div className="flex flex-wrap gap-2">
          {TRANSFER_TOKENS.map((sym) => {
            const m = TOKEN_META[sym];
            const b = balances[sym] || { available: 0, frozen: 0 };
            return (
              <button
                key={sym}
                onClick={() => { setSelectedToken(sym); setAmount(""); setConfirmed(false); setResult(null); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  selectedToken === sym
                    ? "bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30"
                    : "bg-[#2B3139] text-[#848E9C] hover:text-white border border-transparent"
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: m.color + "33", color: m.color }}>
                  {m.icon}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold">{sym}</p>
                  <p className="text-[10px] opacity-60">{hide ? "*****" : b.available.toFixed(b.available < 1 ? 6 : 2)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>


      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <div className="mb-4">
          <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-1.5">Desde (Tu Wallet)</label>
          <div className="bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-mono text-[#848E9C] break-all">{address.slice(0, 10)}...{address.slice(-8)}</p>
            <span className="text-xs text-[#5E6673] shrink-0 ml-2">Mi Wallet</span>
          </div>
        </div>

        <div className="flex justify-center -my-1 relative z-10">
          <div className="w-8 h-8 rounded-full bg-[#2B3139] border-4 border-[#1E2329] flex items-center justify-center">
            <ArrowDownLeft className="w-3.5 h-3.5 text-[#F0B90B] rotate-180" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-1.5">Hacia (Wallet Destino)</label>
          <input
            type="text"
            placeholder="0x... Direccion de wallet destino"
            value={toAddress}
            onChange={(e) => { setToAddress(e.target.value); setConfirmed(false); }}
            className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 text-sm text-white font-mono placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition"
          />
        </div>
      </div>
      <div className="bg-[#1E2329] rounded-xl p-5 mb-4">
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-1.5">Monto</label>
        <div className="relative mb-4">
          <input
            type="number"
            placeholder={`0.00`}
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setConfirmed(false); }}
            className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-[#5E6673] font-medium">{selectedToken}</span>
            <button onClick={handleMax} className="text-[10px] text-[#F0B90B] hover:text-[#F8D12F] font-semibold bg-[#F0B90B]/10 px-2 py-0.5 rounded transition">
              MAX
            </button>
          </div>
        </div>
        <label className="block text-xs text-[#5E6673] font-medium uppercase tracking-wider mb-1.5">Memo (Opcional)</label>
        <input
          type="text"
          placeholder="Nota o referencia de la transferencia"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={120}
          className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]/50 transition"
        />
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#5E6673]">
          <span>Disponible:</span>
          <span className="text-white font-medium">{hide ? "*****" : `${bal.available.toFixed(bal.available < 1 ? 6 : 2)} ${selectedToken}`}</span>
        </div>
      </div>
      {amt > 0 && (
        <div className="bg-[#0B0E11] rounded-xl p-4 space-y-2.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Token</span>
            <span className="text-white font-medium">{selectedToken}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Monto</span>
            <span className="text-white font-medium">{amt.toFixed(6)} {selectedToken}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Comision</span>
            <span className="text-[#02C076] font-medium">0.00 {selectedToken} (Gratis)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#5E6673]">Destinatario recibe</span>
            <span className="text-[#F0B90B] font-semibold">{amt.toFixed(6)} {selectedToken}</span>
          </div>
          <div className="border-t border-[#2B3139] pt-2.5 flex justify-between text-xs">
            <span className="text-[#5E6673]">Red</span>
            <span className="text-white">GCRM Internal</span>
          </div>
        </div>
      )}
      <div className="flex gap-2 p-3 bg-[#3B82F6]/5 border border-[#3B82F6]/10 rounded-lg mb-4">
        <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#848E9C] leading-relaxed">
          <p>Solo puedes transferir <span className="text-white font-medium">GCRM, NESG, ALARAB y QFS</span> entre wallets internas de GCRM Exchange.</p>
          <p className="mt-1">Las transferencias son <span className="text-[#02C076] font-medium">instantaneas y sin comision</span>. Asegurate de que la direccion destino sea correcta.</p>
        </div>
      </div>
      {result && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium mb-4 ${result.type === "success" ? "bg-[#02C076]/10 text-[#02C076]" : "bg-[#F6465D]/10 text-[#F6465D]"}`}>
          {result.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <p>{result.text}</p>
        </div>
      )}
      {confirmed && !result?.type && (
        <div className="flex gap-2 p-3 bg-[#F6465D]/5 border border-[#F6465D]/10 rounded-lg mb-4">
          <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
          <p className="text-xs text-[#F6465D]">Estas a punto de enviar <span className="font-bold">{amt.toFixed(6)} {selectedToken}</span> a <span className="font-mono">{toAddress.slice(0, 10)}...{toAddress.slice(-8)}</span>. Haz clic nuevamente para confirmar.</p>
        </div>
      )}
      <button
        onClick={handleTransfer}
        disabled={transferring || !toAddress || amt <= 0 || amt > bal.available || toAddress.toLowerCase().trim() === address.toLowerCase()}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
          confirmed ? "bg-[#F6465D] hover:bg-[#F6465D]/80 text-white" : "bg-[#F0B90B] hover:bg-[#F8D12F] text-black"
        }`}
      >
        {transferring ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmed ? <Shield className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {transferring ? "Procesando..." : confirmed ? "Confirmar Transferencia" : `Transferir ${amt > 0 ? amt.toFixed(6) + " " + selectedToken : selectedToken}`}
      </button>
    </div>
  );
}
