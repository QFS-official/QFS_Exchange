import { http, createConfig } from "wagmi";
import { mainnet, polygon, base, bsc, arbitrum, optimism, avalanche } from "wagmi/chains";
import { injected, coinbaseWallet, metaMask } from "wagmi/connectors";

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

export const SUPPORTED_CHAINS = [mainnet, bsc, polygon, arbitrum, optimism, base, avalanche] as const;

export const CHAIN_META: Record<number, { name: string; label: string; color: string; icon: string; explorer: string }> = {
  [mainnet.id]:    { name: "Ethereum",    label: "Ethereum (ERC20)", color: "#627EEA", icon: "Ξ",   explorer: "https://etherscan.io" },
  [bsc.id]:        { name: "BNB Chain",   label: "BSC (BEP20)",       color: "#F0B90B", icon: "B",   explorer: "https://bscscan.com" },
  [polygon.id]:    { name: "Polygon",     label: "Polygon",            color: "#8247E5", icon: "P",   explorer: "https://polygonscan.com" },
  [arbitrum.id]:   { name: "Arbitrum",    label: "Arbitrum One",       color: "#28A0F0", icon: "A",   explorer: "https://arbiscan.io" },
  [optimism.id]:   { name: "Optimism",    label: "Optimism",           color: "#FF0420", icon: "O",   explorer: "https://optimistic.etherscan.io" },
  [base.id]:       { name: "Base",        label: "Base",               color: "#0052FF", icon: "■",   explorer: "https://basescan.org" },
  [avalanche.id]:  { name: "Avalanche",   label: "Avalanche C-Chain",  color: "#E84142", icon: "▲",   explorer: "https://snowtrace.io" },
};

// Non-EVM networks (for deposit/withdraw UI — not switchable via wagmi)
export const NON_EVM_NETWORKS = [
  { id: -1, name: "Tron", label: "Tron (TRC20)", color: "#FF0013", icon: "T", explorer: "https://tronscan.org" },
  { id: -2, name: "Solana", label: "Solana (SPL)", color: "#14F195", icon: "S", explorer: "https://solscan.io" },
] as const;

export const ALL_NETWORKS = [
  ...SUPPORTED_CHAINS.map(c => ({ id: c.id, ...CHAIN_META[c.id] })),
  ...NON_EVM_NETWORKS,
];

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "GCRM Exchange" }),
  ],
  transports: {
    [mainnet.id]:    http(process.env.NEXT_PUBLIC_RPC_ETHEREUM || "https://eth.llamarpc.com"),
    [bsc.id]:        http(process.env.NEXT_PUBLIC_RPC_BSC || "https://bsc-dataseed.binance.org"),
    [polygon.id]:    http(process.env.NEXT_PUBLIC_RPC_POLYGON || "https://polygon-rpc.com"),
    [arbitrum.id]:   http(process.env.NEXT_PUBLIC_RPC_ARBITRUM || "https://arb1.arbitrum.io/rpc"),
    [optimism.id]:   http(process.env.NEXT_PUBLIC_RPC_OPTIMISM || "https://mainnet.optimism.io"),
    [base.id]:       http(process.env.NEXT_PUBLIC_RPC_BASE || "https://mainnet.base.org"),
    [avalanche.id]:  http(process.env.NEXT_PUBLIC_RPC_AVALANCHE || "https://api.avax.network/ext/bc/C/rpc"),
  },
  ssr: true,
});
