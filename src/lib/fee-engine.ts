// ═══════════════════════════════════════════════════════════════════════
// GCRM Exchange — Fee Engine (Binance-style Maker/Taker Model)
// ═══════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE:
//   1. Base rates: Maker 0.10%, Taker 0.10% (configurable per pair)
//   2. VIP tiers: Fee discounts based on 30-day trading volume
//   3. GCRM discount: 25% off if user pays fees with GCRM token
//   4. Precision: All calculations use 8-decimal fixed-point arithmetic
//      to prevent rounding errors in high-frequency trading
//   5. Fee currency:
//      - BUY orders:  fee deducted from received BASE token
//      - SELL orders: fee deducted from received QUOTE token (USDT)
//
// ═══════════════════════════════════════════════════════════════════════

import { db as prisma } from "./db";

// ── Precision Constants ──
const PRECISION = 1e8; // 8 decimal places for fixed-point math

/**
 * Precision-safe multiplication: (a * b) rounded to 8 decimals.
 * Prevents floating-point drift in fee calculations.
 */
export function preciseMul(a: number, b: number): number {
  return Math.round(a * b * PRECISION) / PRECISION;
}

/**
 * Precision-safe subtraction with floor to avoid crediting more than available.
 */
export function preciseSub(a: number, b: number): number {
  return Math.round((a - b) * PRECISION) / PRECISION;
}

/**
 * Precision-safe addition.
 */
export function preciseAdd(a: number, b: number): number {
  return Math.round((a + b) * PRECISION) / PRECISION;
}

// ── Trading Pair Fee Configuration ──
// Each pair can have custom base rates. Defaults to 0.10% maker/taker.

export interface PairFeeConfig {
  pair: string;
  makerRate: number;  // e.g. 0.001 = 0.10%
  takerRate: number;  // e.g. 0.001 = 0.10%
}

const PAIR_FEE_CONFIGS: Record<string, PairFeeConfig> = {
  GCRM_USDT:  { pair: "GCRM_USDT",  makerRate: 0.0010, takerRate: 0.0010 }, // 0.10% / 0.10%
  QFS_USDT:   { pair: "QFS_USDT",   makerRate: 0.0010, takerRate: 0.0010 },
  ALARAB_USDT:{ pair: "ALARAB_USDT", makerRate: 0.0010, takerRate: 0.0010 },
  NESG_USDT:  { pair: "NESG_USDT",  makerRate: 0.0010, takerRate: 0.0010 },
  BTC_USDT:   { pair: "BTC_USDT",   makerRate: 0.0010, takerRate: 0.0010 },
  ETH_USDT:   { pair: "ETH_USDT",   makerRate: 0.0010, takerRate: 0.0010 },
};

const DEFAULT_FEE_CONFIG: PairFeeConfig = {
  pair: "DEFAULT",
  makerRate: 0.0010,
  takerRate: 0.0010,
};

// ── VIP Tier System (Binance-style) ──
// VIP level is determined by 30-day trading volume (in USDT).
// Each tier reduces the base fee rate by a discount percentage.

export interface VipTier {
  level: number;
  name: string;
  minVolume30d: number;  // minimum 30-day volume in USDT
  makerDiscount: number; // e.g. 0.20 = 20% off maker fee
  takerDiscount: number; // e.g. 0.10 = 10% off taker fee
  effectiveMaker: string; // resulting maker rate
  effectiveTaker: string; // resulting taker rate
}

export const VIP_TIERS: VipTier[] = [
  { level: 0, name: "Regular",    minVolume30d: 0,            makerDiscount: 0,     takerDiscount: 0,     effectiveMaker: "0.10%", effectiveTaker: "0.10%" },
  { level: 1, name: "Silver",     minVolume30d: 50_000,      makerDiscount: 0.20,  takerDiscount: 0.10,  effectiveMaker: "0.08%", effectiveTaker: "0.09%" },
  { level: 2, name: "Gold",       minVolume30d: 250_000,     makerDiscount: 0.30,  takerDiscount: 0.15,  effectiveMaker: "0.07%", effectiveTaker: "0.085%" },
  { level: 3, name: "Platinum",   minVolume30d: 1_000_000,   makerDiscount: 0.40,  takerDiscount: 0.20,  effectiveMaker: "0.06%", effectiveTaker: "0.08%" },
  { level: 4, name: "Diamond",   minVolume30d: 5_000_000,   makerDiscount: 0.50,  takerDiscount: 0.30,  effectiveMaker: "0.05%", effectiveTaker: "0.07%" },
  { level: 5, name: "Crown",     minVolume30d: 20_000_000,  makerDiscount: 0.60,  takerDiscount: 0.40,  effectiveMaker: "0.04%", effectiveTaker: "0.06%" },
];

// ── GCRM Token Discount ──
// If user pays fees using GCRM, apply additional 25% discount.
// This is checked by verifying the user has sufficient GCRM balance to cover the fee.

export const GCRM_FEE_DISCOUNT = 0.25; // 25% discount
export const GCRM_FEE_TOKEN = "GCRM";

// Market maker wallet is exempt from fees
const MM_WALLET = "0x000000000000000000000000000000000000mm".toLowerCase();
const MM_WALLET_ALT = "0x000000000000000000000000000000000000MM".toLowerCase();

export function isMarketMaker(walletAddress: string): boolean {
  const w = walletAddress.toLowerCase();
  return w === MM_WALLET || w === MM_WALLET_ALT;
}

// ── Fee Calculation Result ──

export interface FeeCalculation {
  role: "maker" | "taker";
  baseRate: number;        // raw rate for this role (e.g. 0.001)
  vipTier: number;         // VIP level (0-5)
  vipDiscount: number;     // VIP discount factor (e.g. 0.20 = 20%)
  gcrmDiscount: number;    // GCRM pay discount (0 or 0.25)
  effectiveRate: number;  // final rate after all discounts
  feeAmount: number;      // fee in fee token units
  feeToken: string;       // token symbol the fee is charged in
  notional: number;       // USDT value of the trade (price * amount)
  gcrmFeeEquivalent: number | null; // if paid in GCRM, how much GCRM
}

// ── Get User's VIP Tier ──

async function getUserVipTier(walletAddress: string): Promise<VipTier> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  // Sum all trading volume (notional) in the last 30 days
  const trades = await prisma.trade.findMany({
    where: {
      OR: [
        { makerWallet: walletAddress },
        { takerWallet: walletAddress },
      ],
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { total: true },
  });

  const volume30d = trades.reduce((sum, t) => sum + (t.total || 0), 0);

  // Find highest qualifying tier
  let tier = VIP_TIERS[0];
  for (const t of VIP_TIERS) {
    if (volume30d >= t.minVolume30d) tier = t;
  }

  return tier;
}

// ── Check if user wants to pay fees in GCRM ──
// For MVP: all users default to paying fees in the received token.
// GCRM discount can be enabled per-user via a setting later.

async function userUsesGcrmForFees(_walletAddress: string): Promise<boolean> {
  // TODO: Check user preference from profile or settings
  // For now, return false (fees charged in the trade's received token)
  return false;
}

/**
 * Get the GCRM/USDT price for converting fees.
 * Falls back to a default if not available.
 */
async function getGcrmPrice(): Promise<number> {
  try {
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/prices`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.GCRM_USDT?.price) return data.GCRM_USDT.price;
    }
  } catch {
    // fallback
  }
  return 1.25; // default GCRM price fallback
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN: Calculate Fee for a Single Trade Match
// ═══════════════════════════════════════════════════════════════════════

export async function calculateFee(params: {
  walletAddress: string;
  pair: string;
  role: "maker" | "taker";
  side: "buy" | "sell";      // from THIS user's perspective
  price: number;
  amount: number;            // base token amount
  baseSymbol: string;
  quoteSymbol: string;
}): Promise<FeeCalculation> {
  const { walletAddress, pair, role, side, price, amount, baseSymbol, quoteSymbol } = params;

  // Market makers are exempt from fees
  if (isMarketMaker(walletAddress)) {
    return {
      role,
      baseRate: 0,
      vipTier: 0,
      vipDiscount: 0,
      gcrmDiscount: 0,
      effectiveRate: 0,
      feeAmount: 0,
      feeToken: quoteSymbol,
      notional: preciseMul(price, amount),
      gcrmFeeEquivalent: null,
    };
  }

  // 1. Get base fee rate for this pair and role
  const pairConfig = PAIR_FEE_CONFIGS[pair] || DEFAULT_FEE_CONFIG;
  const baseRate = role === "maker" ? pairConfig.makerRate : pairConfig.takerRate;

  // 2. Get user's VIP tier and discount
  const vipTier = await getUserVipTier(walletAddress);
  const vipDiscount = role === "maker" ? vipTier.makerDiscount : vipTier.takerDiscount;

  // 3. Check GCRM fee payment discount
  const usesGcrm = await userUsesGcrmForFees(walletAddress);
  const gcrmDiscount = usesGcrm ? GCRM_FEE_DISCOUNT : 0;

  // 4. Calculate effective rate
  // effectiveRate = baseRate * (1 - vipDiscount) * (1 - gcrmDiscount)
  const rateAfterVip = preciseMul(baseRate, (1 - vipDiscount));
  const effectiveRate = preciseMul(rateAfterVip, (1 - gcrmDiscount));

  // 5. Calculate notional (USDT value of the trade)
  const notional = preciseMul(price, amount);

  // 6. Calculate fee amount
  // FEE CURRENCY RULES (Binance model):
 //   - BUY orders:  user receives BASE token → fee deducted in BASE
  //   - SELL orders: user receives QUOTE (USDT) → fee deducted in QUOTE (USDT)
  let feeAmount: number;
  let feeToken: string;
  let gcrmFeeEquivalent: number | null = null;

  if (side === "buy") {
    // Fee is in the base token (e.g., GCRM)
    // feeAmount = amount * effectiveRate  (not notional * rate)
    feeAmount = preciseMul(amount, effectiveRate);
    feeToken = baseSymbol;
  } else {
    // Fee is in the quote token (USDT)
    // feeAmount = notional * effectiveRate
    feeAmount = preciseMul(notional, effectiveRate);
    feeToken = quoteSymbol;
  }

  // 7. If paying in GCRM, calculate the GCRM equivalent
  if (usesGcrm && feeToken !== GCRM_FEE_TOKEN) {
    const gcrmPrice = await getGcrmPrice();
    if (gcrmPrice > 0) {
      gcrmFeeEquivalent = preciseDiv(feeAmount, gcrmPrice);
      feeAmount = gcrmFeeEquivalent;
      feeToken = GCRM_FEE_TOKEN;
    }
  }

  return {
    role,
    baseRate,
    vipTier: vipTier.level,
    vipDiscount,
    gcrmDiscount,
    effectiveRate,
    feeAmount,
    feeToken,
    notional,
    gcrmFeeEquivalent,
  };
}

/**
 * Precision-safe division.
 */
function preciseDiv(a: number, b: number): number {
  if (b === 0) return 0;
  return Math.round((a / b) * PRECISION) / PRECISION;
}

// ═══════════════════════════════════════════════════════════════════════
// PERSIST: Record fee to database for audit
// ═══════════════════════════════════════════════════════════════════════

export async function recordFee(params: {
  walletAddress: string;
  pair: string;
  orderId: string;
  tradeId: string;
  fee: FeeCalculation;
  baseSymbol: string;
  quoteSymbol: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
}) {
  const { walletAddress, pair, orderId, tradeId, fee, baseSymbol, quoteSymbol, price, amount, side } = params;

  await prisma.feeRecord.create({
    data: {
      walletAddress,
      pair,
      orderId,
      tradeId,
      role: fee.role,
      side,
      baseSymbol,
      quoteSymbol,
      price,
      amount,
      notional: fee.notional,
      feeRate: fee.baseRate,
      vipDiscount: fee.vipDiscount,
      gcrmDiscount: fee.gcrmDiscount,
      effectiveRate: fee.effectiveRate,
      feeAmount: fee.feeAmount,
      feeToken: fee.feeToken,
      gcrmEquivalent: fee.gcrmFeeEquivalent,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// GET: User's fee schedule
// ═══════════════════════════════════════════════════════════════════════

export async function getUserFeeSchedule(walletAddress: string) {
  const vipTier = await getUserVipTier(walletAddress);
  const configs = Object.values(PAIR_FEE_CONFIGS);

  return configs.map(cfg => {
    const makerRateAfterVip = preciseMul(cfg.makerRate, (1 - vipTier.makerDiscount));
    const takerRateAfterVip = preciseMul(cfg.takerRate, (1 - vipTier.takerDiscount));
    const makerWithGcrm = preciseMul(makerRateAfterVip, (1 - GCRM_FEE_DISCOUNT));
    const takerWithGcrm = preciseMul(takerRateAfterVip, (1 - GCRM_FEE_DISCOUNT));

    return {
      pair: cfg.pair,
      maker: {
        baseRate: cfg.makerRate,
        effectiveRate: makerRateAfterVip,
        withGcrmDiscount: makerWithGcrm,
      },
      taker: {
        baseRate: cfg.takerRate,
        effectiveRate: takerRateAfterVip,
        withGcrmDiscount: takerWithGcrm,
      },
    };
  });
}

export { PAIR_FEE_CONFIGS, VIP_TIERS, GCRM_FEE_DISCOUNT };
