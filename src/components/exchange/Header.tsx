"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN_META, ALL_NETWORKS, SUPPORTED_CHAINS } from "@/lib/web3/wagmi";
import { Wallet, LogOut, ChevronDown, ChevronRight, X, User, Settings, Copy, LogIn, Loader2, AlertTriangle, Shield, Crosshair, BarChart3, TrendingUp, Link2, Search, Menu, BookOpen, Megaphone, HelpCircle, Gift, Diamond, Play, UserPlus, Globe, PiggyBank, Receipt, Landmark, MessageSquare, Monitor, Bot, ArrowLeftRight, Calculator, RefreshCw, Users, CreditCard, Headphones, Send } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { AuthModal } from "./AuthModal";
import { LangSelector, ThemeSelector } from "@/components/ui/HeaderControls";

interface HeaderNavProps {
  onTradeModeChange?: (mode: string) => void;
  onBuyCryptoAction?: (action: string) => void;
  onToggleSidebar?: () => void;
}

const BUY_CRYPTO_ITEMS = [
  { id: "buy-sell", icon: <ArrowLeftRight className="w-5 h-5 text-[#F0B90B]" />, title: "Buy & Sell", desc: "Buy and sell crypto instantly" },
  { id: "recurring", icon: <RefreshCw className="w-5 h-5 text-[#F0B90B]" />, title: "Recurring Buy", desc: "Buy crypto automatically at regular intervals", badge: "NEW", badgeColor: "bg-[#F0B90B] text-black" },
  { id: "p2p", icon: <Users className="w-5 h-5 text-[#F0B90B]" />, title: "P2P Trading", desc: "Buy crypto from verified merchants" },
  { id: "bank-deposit", icon: <Landmark className="w-5 h-5 text-[#F0B90B]" />, title: "Bank Deposit", desc: "Top up fiat balance via bank transfer", badge: "HOT", badgeColor: "bg-[#F6465D] text-white" },
  { id: "crypto-card", icon: <CreditCard className="w-5 h-5 text-[#F0B90B]" />, title: "Crypto Card", desc: "Go to GCRM Wallet apply card" },
];

const TRADE_NAV_ITEMS = [
  { id: "spot", icon: <Crosshair className="w-4 h-4 text-[#F0B90B]" />, title: "Spot", desc: "Buy and sell crypto" },
  { id: "margin", icon: <BarChart3 className="w-4 h-4 text-[#F0B90B]" />, title: "Margin", desc: "Trade with 3x leverage" },
  { id: "futures", icon: <TrendingUp className="w-4 h-4 text-[#F0B90B]" />, title: "Futures", desc: "USDT-M Perpetual contracts" },
  { id: "onchain", icon: <Link2 className="w-4 h-4 text-[#F0B90B]" />, title: "Onchain", desc: "Full crypto & tokenized stocks" },
  { id: "convert", icon: <ArrowLeftRight className="w-4 h-4 text-[#F0B90B]" />, title: "Convert", desc: "Zero-fee instant conversion" },
];

const HERRAMIENTAS_ITEMS = [
  { id: "copy-trading", icon: <Users className="w-4 h-4 text-[#F0B90B]" />, title: "Copy Trading", desc: "Deja que los mejores traders trabajen por ti" },
  { id: "trading-bot", icon: <Bot className="w-4 h-4 text-[#F0B90B]" />, title: "Trading Bot", desc: "Trades Inteligentes Simplificados" },
  { id: "tradegpt", icon: <MessageSquare className="w-4 h-4 text-[#F0B90B]" />, title: "TradeGPT", desc: "Trading impulsado por IA" },
  { id: "tradingview", icon: <Monitor className="w-4 h-4 text-[#F0B90B]" />, title: "TradingView", desc: "Herramientas y gráficos profesionales" },
  { id: "wallet-dex", icon: <Wallet className="w-4 h-4 text-[#F0B90B]" />, title: "Wallet GCRM DEX", desc: "Gestiona tus activos en el DEX de GCRM" },
];

const FINANZAS_ITEMS = [
  { id: "loans", icon: <Landmark className="w-4 h-4 text-[#F0B90B]" />, title: "Préstamos", desc: "Préstamos crypto sin liquidación" },
  { id: "convert", icon: <Calculator className="w-4 h-4 text-[#F0B90B]" />, title: "Convert", desc: "Conversión instantánea sin comisión" },
  { id: "history", icon: <Receipt className="w-4 h-4 text-[#F0B90B]" />, title: "Historial", desc: "Revisa tu historial de transacciones" },
];

const WALLET_DEX_ITEMS = [
  { id: "wallet-overview", icon: <Wallet className="w-4 h-4 text-[#F0B90B]" />, title: "Overview", desc: "Resumen de tu wallet y balances" },
  { id: "wallet-deposit", icon: <ArrowLeftRight className="w-4 h-4 text-[#F0B90B]" />, title: "Depositar", desc: "Deposita fondos a tu wallet GCRM" },
  { id: "wallet-withdraw", icon: <CreditCard className="w-4 h-4 text-[#F0B90B]" />, title: "Retirar", desc: "Retira tus fondos cuando quieras" },
  { id: "wallet-transfer", icon: <Send className="w-4 h-4 text-[#F0B90B]" />, title: "Transferir", desc: "Transfiere tokens a otra wallet interna" },
  { id: "wallet-history", icon: <Receipt className="w-4 h-4 text-[#F0B90B]" />, title: "Historial", desc: "Historial completo de transacciones" },
];

const EXPLORE_ITEMS_MORE = [
  { id: "learn", icon: <BookOpen className="w-5 h-5 text-[#F0B90B]" />, title: "GCRM Learn", desc: "Mejora tus habilidades de trading con conocimientos cripto expertos", badge: "NEW", badgeColor: "bg-[#F0B90B] text-black" },
  { id: "announcements", icon: <Megaphone className="w-5 h-5 text-[#F0B90B]" />, title: "Anuncios", desc: "No te pierdas las novedades" },
  { id: "help", icon: <HelpCircle className="w-5 h-5 text-[#F0B90B]" />, title: "Centro de ayuda", desc: "Accede al soporte para cualquier consulta sobre productos" },
];

const PROGRAMS_ITEMS = [
  { id: "rewards", icon: <Gift className="w-5 h-5 text-[#F0B90B]" />, title: "Rewards Hub", desc: "Completa tareas simples para recompensas" },
  { id: "vip", icon: <Diamond className="w-5 h-5 text-[#F0B90B]" />, title: "Programa VIP", desc: "Obtén acceso exclusivo a descuentos en tarifas y más", badge: "NEW", badgeColor: "bg-[#F0B90B] text-black" },
  { id: "livestream", icon: <Play className="w-5 h-5 text-[#F0B90B]" />, title: "Livestream", desc: "Mira transmisiones en vivo para recibir airdrops" },
  { id: "referrals", icon: <UserPlus className="w-5 h-5 text-[#F0B90B]" />, title: "Programa de Referidos", desc: "Invita a un amigo y gana 10 Eur en GCRM cada uno." },
  { id: "affiliates", icon: <Globe className="w-5 h-5 text-[#F0B90B]" />, title: "Programa de afiliados", desc: "Desbloquea ofertas exclusivas, haz crecer tu red y gana hasta un 50% de comisión como afiliado de GCRM." },
  { id: "soporte-vip", icon: <Headphones className="w-5 h-5 text-[#F0B90B]" />, title: "Soporte VIP", desc: "Atención prioritaria y soporte dedicado 24/7" },
];

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  referralCode: string | null;
  role: string;
  kycLevel: number;
  twoFactor: boolean;
}

const WALLET_OPTIONS = [
  {
    id: "gcrm-wallet",
    name: "GCRM Wallet",
    external: true,
    url: "https://gcrm-wallet-web-production.up.railway.app",
    icon: (
      <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#0B0E11] flex items-center justify-center p-0.5">
        <img src="/gcrm-wallet-logo.png" alt="GCRM Wallet" className="w-full h-full object-contain rounded" />
      </div>
    ),
    detect: () => true,
    getConnectorId: () => "metaMaskSDK" as const,
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#F6851B" fillOpacity="0.15" />
        <path d="M30.5 14L28 28.5L20 32L12 28.5L9.5 14H30.5Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.5" />
        <path d="M20 16V30L26.5 27.5L28.5 16H20Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.3" />
        <path d="M14.5 18.5L17.5 21.5L16.5 18L14.5 18.5Z" fill="#233447" />
        <path d="M25.5 18.5L22.5 21.5L23.5 18L25.5 18.5Z" fill="#233447" />
        <path d="M15 24L17 23L15.5 25.5L15 24Z" fill="#233447" />
        <path d="M25 24L23 23L24.5 25.5L25 24Z" fill="#233447" />
      </svg>
    ),
    detect: () => typeof window !== "undefined" && !!(window as Record<string, unknown>).ethereum,
    getConnectorId: () => "metaMaskSDK" as const,
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#3375BB" fillOpacity="0.15" />
        <path d="M20 8L11 13V21C11 26.5 14.8 31.6 20 33C25.2 31.6 29 26.5 29 21V13L20 8Z" fill="#3375BB" />
        <path d="M20 11L14 14.5V21C14 24.8 16.5 28.3 20 29.5C23.5 28.3 26 24.8 26 21V14.5L20 11Z" fill="#fff" fillOpacity="0.2" />
        <path d="M17 20L19.5 22.5L24 17" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    detect: () => {
      if (typeof window === "undefined") return false;
      const w = window as Record<string, unknown>;
      const eth = w.ethereum as Record<string, unknown> | undefined;
      return !!(eth && (eth.isTrust || eth.isTrustWallet));
    },
    getConnectorId: () => "injected" as const,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#0052FF" fillOpacity="0.15" />
        <circle cx="20" cy="20" r="10" fill="#0052FF" />
        <rect x="14" y="16" width="12" height="8" rx="2" fill="#fff" />
        <circle cx="17" cy="20" r="1.5" fill="#0052FF" />
        <circle cx="23" cy="20" r="1.5" fill="#0052FF" />
      </svg>
    ),
    detect: () => {
      if (typeof window === "undefined") return false;
      const w = window as Record<string, unknown>;
      const eth = w.ethereum as Record<string, unknown> | undefined;
      return !!(eth && (eth.isCoinbaseWallet || eth.providerMap?.CoinbaseWallet));
    },
    getConnectorId: () => "coinbaseWalletSDK" as const,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#00F0FF" fillOpacity="0.15" />
        <rect x="10" y="14" width="20" height="12" rx="3" fill="#00D4E5" />
        <path d="M15 18H25" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 22H22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="28" cy="12" r="3" fill="#00F0FF" />
      </svg>
    ),
    detect: () => {
      if (typeof window === "undefined") return false;
      const w = window as Record<string, unknown>;
      return !!(w.bitkeep?.ethereum || w.bitkeep);
    },
    getConnectorId: () => "injected" as const,
  },
  {
    id: "binance",
    name: "Binance Wallet",
    icon: (
      <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
        <rect width="40" height="40" rx="8" fill="#F0B90B" fillOpacity="0.15" />
        <path d="M15 17L20 12L25 17L23 19L20 16L17 19L15 17Z" fill="#F0B90B" />
        <path d="M12 20L14 18L16 20L14 22L12 20Z" fill="#F0B90B" />
        <path d="M20 20L22 18L24 20L22 22L20 20Z" fill="#F0B90B" />
        <path d="M24 20L26 18L28 20L26 22L24 20Z" fill="#F0B90B" />
        <path d="M15 23L20 18L25 23L23 25L20 22L17 25L15 23Z" fill="#F0B90B" />
        <path d="M20 26L15 31L13 29L18 24L20 26Z" fill="#F0B90B" />
        <path d="M20 26L25 31L27 29L22 24L20 26Z" fill="#F0B90B" />
      </svg>
    ),
    detect: () => {
      if (typeof window === "undefined") return false;
      return !!(window as Record<string, unknown>).BinanceChain;
    },
    getConnectorId: () => "injected" as const,
  },
];

export function Header({ onTradeModeChange, onBuyCryptoAction, onToggleSidebar }: HeaderNavProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [chainMenuOpen, setChainMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chainRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const tradeNavRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const walletDexRef = useRef<HTMLDivElement>(null);
  const finanzasRef = useRef<HTMLDivElement>(null);

  const closeWalletMenu = useCallback(() => setWalletMenuOpen(false), []);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) setUser(d.user);
    }).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeWalletMenu();
      if (chainRef.current && !chainRef.current.contains(e.target as Node)) setChainMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (tradeNavRef.current && !tradeNavRef.current.contains(e.target as Node)) setTradeNavOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
      if (walletDexRef.current && !walletDexRef.current.contains(e.target as Node)) setWalletDexOpen(false);
      if (finanzasRef.current && !finanzasRef.current.contains(e.target as Node)) setFinanzasOpen(false);

    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeWalletMenu]);

  function handleAuthLogin(u: AuthUser) { setUser(u); }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null); setUserMenuOpen(false);
  }

  function copyReferral() {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const { switchChain } = useSwitchChain();
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  const chainLabel = chain ? (CHAIN_META[chain.id]?.name ?? chain.name) : "Unknown";

  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [tradeNavOpen, setTradeNavOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [walletDexOpen, setWalletDexOpen] = useState(false);
  const [finanzasOpen, setFinanzasOpen] = useState(false);

  useEffect(() => {
    if (connectError) {
      const t = setTimeout(() => setConnectError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [connectError]);

  async function handleWalletSelect(walletId: string) {
    const wallet = WALLET_OPTIONS.find((w) => w.id === walletId);
    if (!wallet) return;
    // External wallet — open in new tab
    if ('external' in wallet && wallet.external && wallet.url) {
      window.open(wallet.url, '_blank', 'noopener,noreferrer');
      closeWalletMenu();
      return;
    }
    setConnectError(null);
    setConnectingWallet(walletId);
    try {
      const connector = connectors.find((c) => c.id === wallet.getConnectorId());
      if (!connector) {
        setConnectError(`${wallet.name} connector not available.`);
        setConnectingWallet(null);
        return;
      }
      connect(
        { connector },
        {
          onSuccess: () => { setConnectingWallet(null); closeWalletMenu(); },
          onError: (err) => {
            const msg = err.message.includes("rejected")
              ? "Connection rejected by user"
              : err.message.includes("not found") || err.message.includes("Provider")
                ? `${wallet.name} not detected. Install the extension.`
                : err.message.includes("already pending")
                  ? "A connection request is already pending."
                  : `Failed: ${err.message.slice(0, 80)}`;
            setConnectError(msg);
            setConnectingWallet(null);
          },
        },
      );
    } catch {
      setConnectError(`Unexpected error connecting to ${wallet.name}`);
      setConnectingWallet(null);
    }
  }

  function handleTradeNav(mode: string) {
    onTradeModeChange?.(mode);
    setTradeNavOpen(false);
    document.getElementById("trade")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleBuyCrypto(action: string) {
    onBuyCryptoAction?.(action);
  }

  const navItemCls = "flex items-center space-x-1 px-2.5 py-2 text-[13px] text-[#848E9C] hover:text-white transition cursor-pointer select-none whitespace-nowrap";

  return (
    <>
      <header className="bg-[#0B0E11] border-b border-[#1E2329] h-[48px] flex items-center relative z-50 shrink-0">
        <div className="flex items-center justify-between w-full h-full px-3">
          {/* Left: Logo + Nav */}
          <div className="flex items-center min-w-0">
            {/* Sidebar toggle (desktop) */}
            <button onClick={onToggleSidebar} className="hidden lg:flex mr-2 text-[#848E9C] hover:text-white transition p-1">
              <Menu className="w-4 h-4" />
            </button>
            {/* Mobile hamburger */}
            <button className="lg:hidden mr-2 text-[#848E9C] hover:text-white transition p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <a href="#" onClick={() => onTradeModeChange?.("spot")} className="flex items-center shrink-0 mr-3">
              <img
                src="https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881"
                alt="GCRM"
                className="h-8 w-auto object-contain"
              />
            </a>

            {/* Desktop Nav - compact */}
            <nav className="hidden xl:flex items-center h-full">
              {/* Trading dropdown */}
              <div ref={tradeNavRef} className="relative h-full flex items-center">
                <button
                  onClick={() => { setTradeNavOpen(!tradeNavOpen); setMoreMenuOpen(false); setWalletDexOpen(false); }}
                  onMouseEnter={() => setTradeNavOpen(true)}
                  className={`${navItemCls} h-full ${tradeNavOpen ? "text-white" : ""}`}
                >
                  <span>Trading</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${tradeNavOpen ? "rotate-180" : ""}`} />
                </button>
                {tradeNavOpen && (
                  <div className="absolute left-0 top-full mt-0 w-[260px] bg-[#2B3139] border border-[#363C45] shadow-2xl shadow-black/40 rounded-b-lg overflow-hidden z-50">
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-wider">Trade Modes</span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {TRADE_NAV_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleTradeNav(item.id)}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left group"
                        >
                          <div className="w-7 h-7 rounded bg-[#1E2329] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white group-hover:text-[#F0B90B] transition">{item.title}</p>
                            <p className="text-[10px] text-[#5E6673] group-hover:text-[#848E9C] transition">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Markets - direct link */}
              <button
                onClick={() => onTradeModeChange?.("spot")}
                className={`${navItemCls} h-full`}
              >
                <span>Markets</span>
              </button>

              {/* Earn - direct link */}
              <button
                onClick={() => onTradeModeChange?.("staking")}
                className={`${navItemCls} h-full`}
              >
                <span>Earn</span>
              </button>

              {/* Finanzas dropdown */}
              <div ref={finanzasRef} className="relative h-full flex items-center">
                <button
                  onClick={() => { setFinanzasOpen(!finanzasOpen); setTradeNavOpen(false); setMoreMenuOpen(false); setWalletDexOpen(false); }}
                  onMouseEnter={() => setFinanzasOpen(true)}
                  className={`${navItemCls} h-full ${finanzasOpen ? "text-white" : ""}`}
                >
                  <span>Finanzas</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${finanzasOpen ? "rotate-180" : ""}`} />
                </button>
                {finanzasOpen && (
                  <div className="absolute left-0 top-full mt-0 w-[260px] bg-[#2B3139] border border-[#363C45] shadow-2xl shadow-black/40 rounded-b-lg overflow-hidden z-50">
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-wider">Finanzas</span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {FINANZAS_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { onTradeModeChange?.(item.id); setFinanzasOpen(false); }}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left group"
                        >
                          <div className="w-7 h-7 rounded bg-[#1E2329] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white group-hover:text-[#F0B90B] transition">{item.title}</p>
                            <p className="text-[10px] text-[#5E6673] group-hover:text-[#848E9C] transition">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Airdrop */}
              <button
                onClick={() => onTradeModeChange?.("airdrop")}
                className={`${navItemCls} h-full`}
              >
                <span>Airdrop</span>
              </button>

              {/* Programas */}
              <button
                onClick={() => onTradeModeChange?.("programs")}
                className={`${navItemCls} h-full`}
              >
                <span>Programas</span>
              </button>

              {/* Wallet GCRM DEX dropdown */}
              <div ref={walletDexRef} className="relative h-full flex items-center">
                <button
                  onClick={() => { setWalletDexOpen(!walletDexOpen); setTradeNavOpen(false); setMoreMenuOpen(false); setFinanzasOpen(false); }}
                  onMouseEnter={() => setWalletDexOpen(true)}
                  className={`${navItemCls} h-full ${walletDexOpen ? "text-white" : ""}`}
                >
                  <span>Wallet</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${walletDexOpen ? "rotate-180" : ""}`} />
                </button>
                {walletDexOpen && (
                  <div className="absolute left-0 top-full mt-0 w-[260px] bg-[#2B3139] border border-[#363C45] shadow-2xl shadow-black/40 rounded-b-lg overflow-hidden z-50">
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-wider">Wallet GCRM DEX</span>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {WALLET_DEX_ITEMS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { onTradeModeChange?.(item.id); setWalletDexOpen(false); }}
                          className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left group"
                        >
                          <div className="w-7 h-7 rounded bg-[#1E2329] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white group-hover:text-[#F0B90B] transition">{item.title}</p>
                            <p className="text-[10px] text-[#5E6673] group-hover:text-[#848E9C] transition">{item.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Soporte */}
              <button
                onClick={() => onTradeModeChange?.("soporte")}
                className={`${navItemCls} h-full`}
              >
                <span>Soporte</span>
              </button>

              {/* VIP */}
              <button
                onClick={() => onTradeModeChange?.("vip")}
                className={`${navItemCls} h-full`}
              >
                <span>VIP</span>
              </button>

              {/* More dropdown */}
              <div ref={moreMenuRef} className="relative h-full flex items-center">
                <button
                  onClick={() => { setMoreMenuOpen(!moreMenuOpen); setTradeNavOpen(false); setWalletDexOpen(false); }}
                  onMouseEnter={() => setMoreMenuOpen(true)}
                  className={`${navItemCls} h-full ${moreMenuOpen ? "text-white" : ""}`}
                >
                  <span>Más</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${moreMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {moreMenuOpen && (
                  <div className="absolute right-0 top-full mt-0 w-[520px] bg-[#2B3139] border border-[#363C45] shadow-2xl shadow-black/40 rounded-lg overflow-hidden z-50">
                    {/* Search bar */}
                    <div className="px-4 pt-3 pb-2 border-b border-[#363C45]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          className="w-full bg-[#1E2329] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-[#5E6673] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]/50 transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-[#363C45]">
                      {/* Left: Herramientas */}
                      <div className="py-2">
                        <div className="px-3 pb-1.5">
                          <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest">Herramientas</span>
                        </div>
                        <div className="space-y-0.5 px-1.5">
                          {HERRAMIENTAS_ITEMS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => { onTradeModeChange?.(item.id); setMoreMenuOpen(false); }}
                              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded hover:bg-[#363C45] transition text-left group"
                            >
                              <div className="w-7 h-7 rounded bg-[#1E2329] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition">{item.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white group-hover:text-[#F0B90B] transition">{item.title}</p>
                                <p className="text-[10px] text-[#5E6673] group-hover:text-[#848E9C] transition">{item.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Right: Programas */}
                      <div className="py-2">
                        <div className="px-3 pb-1.5">
                          <span className="text-[10px] font-bold text-[#5E6673] uppercase tracking-widest">Programas</span>
                        </div>
                        <div className="space-y-0.5 px-1.5">
                          {PROGRAMS_ITEMS.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => { onTradeModeChange?.(item.id); setMoreMenuOpen(false); }}
                              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded hover:bg-[#363C45] transition text-left group"
                            >
                              <div className="w-7 h-7 rounded bg-[#1E2329] group-hover:bg-[#363C45] flex items-center justify-center shrink-0 transition">{item.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <p className="text-[13px] font-semibold text-white group-hover:text-[#F0B90B] transition">{item.title}</p>
                                  {item.badge && <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${item.badgeColor}`}>{item.badge}</span>}
                                </div>
                                <p className="text-[10px] text-[#5E6673] group-hover:text-[#848E9C] transition leading-snug">{item.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Search icon */}
            <button className="text-[#848E9C] hover:text-white transition p-1.5">
              <Search className="w-4 h-4" />
            </button>

            {/* Auth buttons */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 bg-[#2B3139] rounded px-3 py-1.5 hover:bg-[#363C45] transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/70 flex items-center justify-center text-black text-xs font-bold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm text-white font-medium max-w-[100px] truncate">
                    {user.name || user.email.split("@")[0]}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-[#5E6673] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-60 bg-[#2B3139] rounded shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#363C45]">
                      <p className="text-sm font-bold text-white truncate">{user.name || "GCRM User"}</p>
                      <p className="text-xs text-[#5E6673] truncate">{user.email}</p>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${user.role === "vip" ? "bg-[#F0B90B]/20 text-[#F0B90B]" : "bg-[#363C45] text-[#848E9C]"}`}>
                          {user.role.toUpperCase()}
                        </span>
                        {user.kycLevel > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#02C076]/10 text-[#02C076]">
                            KYC {user.kycLevel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-1">
                      <button onClick={() => { onTradeModeChange?.("profile"); setUserMenuOpen(false); }} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left">
                        <User className="w-4 h-4 text-[#848E9C]" />
                        <span className="text-sm text-white">Profile</span>
                        <ChevronRight className="w-3 h-3 text-[#5E6673] ml-auto" />
                      </button>
                      <button onClick={() => { onTradeModeChange?.("security"); setUserMenuOpen(false); }} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left">
                        <Settings className="w-4 h-4 text-[#848E9C]" />
                        <span className="text-sm text-white">Security</span>
                        <ChevronRight className="w-3 h-3 text-[#5E6673] ml-auto" />
                      </button>
                      <button onClick={() => { onTradeModeChange?.("verification"); setUserMenuOpen(false); }} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left">
                        <Shield className="w-4 h-4 text-[#848E9C]" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-white">Verificación</span>
                          {user.kycLevel < 2 && <span className="text-[9px] bg-[#F0B90B] text-black px-1.5 py-0.5 rounded font-bold">ACTION REQUIRED</span>}
                        </div>
                        <ChevronRight className="w-3 h-3 text-[#5E6673]" />
                      </button>
                      {user.referralCode && (
                        <button onClick={copyReferral} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#363C45] transition text-left">
                          <Copy className="w-4 h-4 text-[#848E9C]" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white">Referral Code</span>
                            <span className="text-[10px] text-[#F0B90B] font-mono ml-2">{user.referralCode}</span>
                          </div>
                          {copied && <span className="text-[10px] text-[#02C076]">Copied!</span>}
                        </button>
                      )}
                    </div>
                    <div className="p-1 border-t border-[#363C45]">
                      <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2 rounded hover:bg-[#F6465D]/10 transition text-left group">
                        <LogOut className="w-4 h-4 text-[#848E9C] group-hover:text-[#F6465D]" />
                        <span className="text-sm text-[#848E9C] group-hover:text-[#F6465D]">Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => { setAuthTab("login"); setAuthModalOpen(true); }}
                className="text-sm text-[#848E9C] hover:text-white font-medium transition px-3 py-1.5"
              >
                <span className="hidden md:inline">LOG IN</span>
                <LogIn className="w-4 h-4 md:hidden" />
              </button>
            )}

            {/* Language + Theme selectors */}
            <div className="flex items-center gap-0.5">
              <LangSelector />
              <ThemeSelector />
            </div>

            {/* Wallet connect / address */}
            {isConnected && address ? (
              <div className="flex items-center space-x-2" ref={chainRef}>
                <div className="relative">
                  <button
                    onClick={() => setChainMenuOpen(!chainMenuOpen)}
                    className="flex items-center space-x-1 text-xs bg-[#2B3139] rounded px-2.5 py-1.5 hover:bg-[#363C45] transition"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#02C076]" />
                    <span className="text-[#848E9C]">{chainLabel}</span>
                    <ChevronDown className={`w-3 h-3 text-[#5E6673] transition-transform ${chainMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {chainMenuOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#2B3139] rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50 border border-[#363C45]">
                      <div className="px-3 py-2.5 border-b border-[#363C45]">
                        <p className="text-xs font-bold text-white">Select Network</p>
                        <p className="text-[10px] text-[#5E6673] mt-0.5">EVM chains switch your wallet network</p>
                      </div>
                      <div className="p-1 max-h-80 overflow-y-auto">
                        {SUPPORTED_CHAINS.map((c) => {
                          const meta = CHAIN_META[c.id];
                          const isActive = chain?.id === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => { switchChain?.({ chainId: c.id }); setChainMenuOpen(false); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition ${
                                isActive ? "bg-[#F0B90B]/10" : "hover:bg-[#363C45]"
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                style={{ backgroundColor: meta.color + "33", color: meta.color }}
                              >
                                {meta.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium ${isActive ? "text-[#F0B90B]" : "text-white"}`}>{meta.name}</p>
                                <p className="text-[10px] text-[#5E6673]">{meta.label}</p>
                              </div>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#02C076] shrink-0" />}
                            </button>
                          );
                        })}
                        <div className="border-t border-[#363C45] my-1" />
                        {ALL_NETWORKS.filter(n => n.id < 0).map((nw) => (
                          <div
                            key={nw.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-md"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ backgroundColor: nw.color + "33", color: nw.color }}
                            >
                              {nw.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white">{nw.name}</p>
                              <p className="text-[10px] text-[#5E6673]">{nw.label}</p>
                            </div>
                            <span className="text-[9px] text-[#5E6673] bg-[#1E2329] px-1.5 py-0.5 rounded font-medium shrink-0">Deposit/Withdraw</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center bg-[#2B3139] rounded px-2.5 py-1.5">
                  <span className="text-sm text-white font-medium">{shortAddr}</span>
                </div>
                <button onClick={() => disconnect()} className="p-1.5 text-[#848E9C] hover:text-[#F6465D] transition" title="Disconnect">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center space-x-2 bg-[#F0B90B] text-black font-bold text-sm px-4 py-2 rounded hover:bg-[#F8D12F] transition"
                >
                  <Wallet className="w-4 h-4" />
                  <span className="hidden md:inline">CONNECT WALLET</span>
                </button>
                {walletMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-[#2B3139] rounded shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#363C45]">
                      <span className="text-sm font-bold text-white">Connect Wallet</span>
                      <button onClick={closeWalletMenu} className="text-[#5E6673] hover:text-white transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {connectError && (
                      <div className="mx-3 mt-3 bg-[#F6465D]/10 border border-[#F6465D]/30 rounded px-3 py-2.5 flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-[#F6465D] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#F6465D] leading-relaxed">{connectError}</p>
                      </div>
                    )}
                    <div className="p-1.5 space-y-0.5">
                      {WALLET_OPTIONS.map((w) => {
                        const detected = w.detect();
                        const isExternal = 'external' in w && w.external;
                        const isConnecting = connectingWallet === w.id;
                        return (
                          <button
                            key={w.id}
                            onClick={() => !isConnecting && handleWalletSelect(w.id)}
                            disabled={isConnecting}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded hover:bg-[#363C45] transition group text-left disabled:opacity-60"
                          >
                            <div className="shrink-0">{w.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white group-hover:text-[#F0B90B] transition">{w.name}</p>
                              {isExternal && <p className="text-[10px] text-[#F0B90B] mt-0.5">Non-custodial · Multichain</p>}
                              {!detected && !isExternal && <p className="text-[10px] text-[#5E6673] mt-0.5">Not detected</p>}
                            </div>
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 text-[#F0B90B] animate-spin shrink-0" />
                            ) : isExternal ? (
                              <span className="text-[10px] text-[#F0B90B] bg-[#F0B90B]/10 px-2 py-0.5 rounded-full font-semibold shrink-0">Recommended</span>
                            ) : detected ? (
                              <span className="text-[10px] text-[#02C076] bg-[#02C076]/10 px-2 py-0.5 rounded-full font-semibold shrink-0">Detected</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-4 py-2.5 border-t border-[#363C45]">
                      <p className="text-[10px] text-[#5E6673] leading-relaxed">
                        Install the browser extension and refresh to detect your wallet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} onLogin={handleAuthLogin} initialTab={authTab} />
    </>
  );
}
