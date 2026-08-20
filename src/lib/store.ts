import { create } from "zustand";
import { TRADING_PAIRS, type TradingPair, TOKENS } from "./tokens/config";

interface PriceInfo {
  usd: number;
  usd_24h_change: number;
  usd_24h_vol: number;
  usd_market_cap: number;
  usd_24h_high?: number;
  usd_24h_low?: number;
}

interface ExchangeStore {
  // Selected pair
  selectedPairIndex: number;
  selectedPair: () => TradingPair;
  setPairIndex: (i: number) => void;

  // Price data
  prices: Record<string, PriceInfo>;
  setPrices: (p: Record<string, PriceInfo>) => void;
  getPrice: (cgId: string) => PriceInfo | undefined;

  // Trade form
  tradeSide: "buy" | "sell";
  setTradeSide: (s: "buy" | "sell") => void;
  orderType: "limit" | "market" | "stop";
  setOrderType: (t: "limit" | "market" | "stop") => void;
  price: string;
  setPrice: (p: string) => void;
  amount: string;
  setAmount: (a: string) => void;
  total: string;
  setTotal: (t: string) => void;
  sliderPercent: number;
  setSliderPercent: (p: number) => void;

  // Wallet balances (per token address)
  balances: Record<string, bigint>;
  setBalance: (addr: string, bal: bigint) => void;

  // TX status
  txStatus: "idle" | "approving" | "swapping" | "success" | "error";
  setTxStatus: (s: "idle" | "approving" | "swapping" | "success" | "error") => void;
  txHash: string | null;
  setTxHash: (h: string | null) => void;
}

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  selectedPairIndex: 0,
  selectedPair: () => TRADING_PAIRS[get().selectedPairIndex] ?? TRADING_PAIRS[0],
  setPairIndex: (i) => set({ selectedPairIndex: i }),

  prices: {},
  setPrices: (p) => set({ prices: p }),
  getPrice: (cgId) => get().prices[cgId],

  tradeSide: "buy",
  setTradeSide: (s) => set({ tradeSide: s }),
  orderType: "market",
  setOrderType: (t) => set({ orderType: t }),
  price: "",
  setPrice: (p) => set({ price: p }),
  amount: "",
  setAmount: (a) => set({ amount: a }),
  total: "",
  setTotal: (t) => set({ total: t }),
  sliderPercent: 0,
  setSliderPercent: (p) => set({ sliderPercent: p }),

  balances: {},
  setBalance: (addr, bal) =>
    set((s) => ({ balances: { ...s.balances, [addr.toLowerCase()]: bal } })),

  txStatus: "idle",
  setTxStatus: (s) => set({ txStatus: s }),
  txHash: null,
  setTxHash: (h) => set({ txHash: h }),
}));
