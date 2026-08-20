// ─── ERC-20 ABI (minimal for read + approve/transfer) ───
export const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const USDT_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── Token Definitions ───
export interface TokenConfig {
  symbol: string;
  name: string;
  address: `0x${string}`;
  chainId: number;
  chainName: string;
  decimals: number;
  explorer: string;
  logo?: string;
  cgId?: string;       // CoinGecko id
  cmcId?: number;      // CoinMarketCap id
}

// Mainnet USDT addresses
export const USDT_ADDRESS_ETHEREUM = "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`;
export const USDT_ADDRESS_POLYGON = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" as `0x${string}`;

export const TOKENS: TokenConfig[] = [
  {
    symbol: "GCRM",
    name: "GCRM Token",
    address: "0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b3",
    chainId: 1,
    chainName: "Ethereum",
    decimals: 18,
    explorer: "https://etherscan.io/token/0x2ae2d0dfdb1b3b03a771167c43b983a97b65b9b3",
    cgId: "gcrm-token",
  },
  {
    symbol: "QFS",
    name: "QFS Token",
    address: "0x7c670a7eba354e0d22f0ecbbe7a36bf10dce305e",
    chainId: 1,
    chainName: "Ethereum",
    decimals: 18,
    explorer: "https://etherscan.io/token/0x7c670a7eba354e0d22f0ecbbe7a36bf10dce305e",
    cgId: "qfs-token",
  },
  {
    symbol: "ALARAB",
    name: "Alarab Token",
    address: "0xf5c068f28ebf91b22e52c2ecd230621879e914b8",
    chainId: 137,
    chainName: "Polygon",
    decimals: 18,
    explorer: "https://polygonscan.com/address/0xf5c068f28ebf91b22e52c2ecd230621879e914b8",
    cgId: "alarab-token",
  },
  {
    symbol: "NESG",
    name: "NESG Token",
    address: "0x1ac1fb7ca22c7836ce7d553be992c318fe2477cd",
    chainId: 1,
    chainName: "Ethereum",
    decimals: 18,
    explorer: "https://etherscan.io/address/0x1ac1fb7ca22c7836ce7d553be992c318fe2477cd",
    cgId: "nesg-token",
  },
];

// Trading pairs available on the exchange
export interface TradingPair {
  base: TokenConfig;
  quote: TokenConfig;
  quoteAddress: `0x${string}`;
}

const USDT_ETHEREUM: TokenConfig = {
  symbol: "USDT",
  name: "Tether USD",
  address: USDT_ADDRESS_ETHEREUM,
  chainId: 1,
  chainName: "Ethereum",
  decimals: 6,
  explorer: "https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7",
  cgId: "tether",
};

const USDT_POLYGON: TokenConfig = {
  symbol: "USDT",
  name: "Tether USD",
  address: USDT_ADDRESS_POLYGON,
  chainId: 137,
  chainName: "Polygon",
  decimals: 6,
  explorer: "https://polygonscan.com/token/0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  cgId: "tether",
};

export const TRADING_PAIRS: TradingPair[] = [
  { base: TOKENS[0], quote: USDT_ETHEREUM, quoteAddress: USDT_ADDRESS_ETHEREUM }, // GCRM/USDT
  { base: TOKENS[1], quote: USDT_ETHEREUM, quoteAddress: USDT_ADDRESS_ETHEREUM }, // QFS/USDT
  { base: TOKENS[2], quote: USDT_POLYGON, quoteAddress: USDT_ADDRESS_POLYGON },  // ALARAB/USDT
  { base: TOKENS[3], quote: USDT_ETHEREUM, quoteAddress: USDT_ADDRESS_ETHEREUM }, // NESG/USDT
];

// ─── Top 10 Major Crypto (informational, CoinGecko-powered) ───
export interface PopularPair {
  symbol: string;
  name: string;
  cgId: string;
}

export const POPULAR_PAIRS: PopularPair[] = [
  { symbol: "BTC",  name: "Bitcoin",      cgId: "bitcoin" },
  { symbol: "ETH",  name: "Ethereum",     cgId: "ethereum" },
  { symbol: "BNB",  name: "BNB",          cgId: "binancecoin" },
  { symbol: "SOL",  name: "Solana",       cgId: "solana" },
  { symbol: "XRP",  name: "XRP",          cgId: "ripple" },
  { symbol: "ADA",  name: "Cardano",      cgId: "cardano" },
  { symbol: "DOGE", name: "Dogecoin",     cgId: "dogecoin" },
  { symbol: "DOT",  name: "Polkadot",     cgId: "polkadot" },
  { symbol: "AVAX", name: "Avalanche",    cgId: "avalanche-2" },
  { symbol: "LINK", name: "Chainlink",    cgId: "chainlink" },
];

export function getUsdtAddress(chainId: number): `0x${string}` {
  if (chainId === 137) return USDT_ADDRESS_POLYGON;
  return USDT_ADDRESS_ETHEREUM;
}
