// ═══════════════════════════════════════════════════════════════════════
// GCRM Exchange — Order Matching Engine (Central Limit Order Book)
// In-memory CLOB with SQLite persistence
// ═══════════════════════════════════════════════════════════════════════

import { db as prisma } from "./db";
import { calculateFee, recordFee, isMarketMaker, preciseMul, preciseSub, preciseAdd } from "./fee-engine";
import type { FeeCalculation } from "./fee-engine";

// ── Balance helpers (server-side) ──
const INITIAL_BALANCES: Record<string, number> = {
  USDT: 10000, GCRM: 0, QFS: 0, ALARAB: 0, NESG: 0,
};

async function getAvailable(walletAddress: string, symbol: string): Promise<number> {
  const w = walletAddress.toLowerCase();
  const row = await prisma.exchangeBalance.findUnique({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
  });
  return row?.available ?? INITIAL_BALANCES[symbol] ?? 0;
}

async function creditWallet(walletAddress: string, symbol: string, amount: number) {
  const w = walletAddress.toLowerCase();
  await prisma.exchangeBalance.upsert({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
    create: { walletAddress: w, symbol, available: amount },
    update: { available: { increment: amount } },
  });
}

async function debitWallet(walletAddress: string, symbol: string, amount: number): Promise<boolean> {
  const w = walletAddress.toLowerCase();
  const row = await prisma.exchangeBalance.findUnique({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
  });
  const current = row?.available ?? (INITIAL_BALANCES[symbol] ?? 0);
  if (current < amount - 0.000001) return false;
  await prisma.exchangeBalance.upsert({
    where: { walletAddress_symbol: { walletAddress: w, symbol } },
    create: { walletAddress: w, symbol, available: Math.max(0, (INITIAL_BALANCES[symbol] ?? 0) - amount) },
    update: { available: { decrement: amount } },
  });
  return true;
}

// ── Types ──
export interface OrderBookEntry {
  id: string;
  walletAddress: string;
  price: number;
  amount: number;
  remaining: number;
  side: "buy" | "sell";
  type: "limit" | "market" | "stop";
  pair: string;
  chainId: number;
  baseSymbol: string;
  quoteSymbol: string;
  createdAt: Date;
}

export interface MatchResult {
  trades: {
    id: string;
    makerOrderId: string;
    takerOrderId: string;
    price: number;
    amount: number;
    total: number;
    fee: number;
    makerFee: number;
    takerFee: number;
    makerWallet: string;
    takerWallet: string;
    createdAt: Date;
  }[];
  filledOrders: string[];
  partialOrders: string[];
}

export interface OrderBookSnapshot {
  pair: string;
  bids: { price: number; amount: number; total: number }[];
  asks: { price: number; amount: number; total: number }[];
  spread: number;
  bestBid: number;
  bestAsk: number;
}

// ── In-Memory Order Books (one per pair) ──
const books = new Map<string, {
  bids: OrderBookEntry[]; // sorted by price DESC
  asks: OrderBookEntry[]; // sorted by price ASC
}>();

// Fee calculation is now handled by fee-engine.ts (Maker/Taker + VIP + GCRM discount)

function getBook(pair: string) {
  if (!books.has(pair)) {
    books.set(pair, { bids: [], asks: [] });
  }
  return books.get(pair)!;
}

// ── Sort helpers ──
function sortBids(bids: OrderBookEntry[]) {
  bids.sort((a, b) => {
    if (b.price !== a.price) return b.price - a.price; // highest price first
    return a.createdAt.getTime() - b.createdAt.getTime(); // oldest first (FIFO)
  });
}

function sortAsks(asks: OrderBookEntry[]) {
  asks.sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price; // lowest price first
    return a.createdAt.getTime() - b.createdAt.getTime(); // oldest first (FIFO)
  });
}

// ── Initialize from DB on startup ──
export async function initOrderBook() {
  const openOrders = await prisma.order.findMany({
    where: { status: { in: ["open", "partial"] } },
    orderBy: { createdAt: "asc" },
  });

  for (const o of openOrders) {
    const book = getBook(o.pair);
    const entry: OrderBookEntry = {
      id: o.id,
      walletAddress: o.walletAddress,
      price: o.price,
      amount: o.amount,
      remaining: o.amount - o.filledAmount,
      side: o.side as "buy" | "sell",
      type: o.type as "limit" | "market" | "stop",
      pair: o.pair,
      chainId: o.chainId,
      baseSymbol: o.baseSymbol,
      quoteSymbol: o.quoteSymbol,
      createdAt: o.createdAt,
    };
    if (o.side === "buy") book.bids.push(entry);
    else book.asks.push(entry);
  }

  for (const [, book] of books) {
    sortBids(book.bids);
    sortAsks(book.asks);
  }

  console.log(`[OrderEngine] Loaded ${openOrders.length} open orders across ${books.size} pairs`);
}

// ── Core Matching Logic ──
export async function placeOrder(params: {
  walletAddress: string;
  pair: string;
  side: "buy" | "sell";
  type: "limit" | "market" | "stop";
  price: number;
  stopPrice?: number;
  amount: number;
  chainId: number;
  baseSymbol: string;
  quoteSymbol: string;
}): Promise<{ orderId: string; matches: MatchResult; orderStatus: string }> {
  const { walletAddress, pair, side, type, price: inputPrice, stopPrice, amount, chainId, baseSymbol, quoteSymbol } = params;
  const book = getBook(pair);

  // For market orders, estimate price from the best opposite side of the book
  let effectivePrice = inputPrice;
  if (type === "market" && (!effectivePrice || effectivePrice <= 0)) {
    if (side === "buy" && book.asks.length > 0) {
      effectivePrice = book.asks[0].price;
    } else if (side === "sell" && book.bids.length > 0) {
      effectivePrice = book.bids[0].price;
    } else {
      effectivePrice = 0; // no liquidity
    }
  }

  const total = effectivePrice * amount;

  // Create DB order
  const dbOrder = await prisma.order.create({
    data: {
      walletAddress,
      pair,
      side,
      type,
      price: effectivePrice,
      stopPrice,
      amount,
      filledAmount: 0,
      remainingAmount: amount,
      total,
      chainId,
      baseSymbol,
      quoteSymbol,
      status: "open",
    },
  });

  const result: MatchResult = { trades: [], filledOrders: [], partialOrders: [] };

  // Stop orders: just park them (stop monitoring is separate)
  if (type === "stop") {
    // For stop orders, check balance when the stop triggers (not now)
    return { orderId: dbOrder.id, matches: result, orderStatus: "open" };
  }

  // ── Server-side balance check ──
  const spendSymbol = side === "buy" ? quoteSymbol : baseSymbol;
  // For buy: spend = total USDT. For sell: spend = amount of base token (+10% buffer for market slippage)
  const maxSpend = side === "buy"
    ? (type === "market" ? total * 1.10 : total)
    : (type === "market" ? amount * 1.10 : amount);
  const available = await getAvailable(walletAddress, spendSymbol);
  if (available < maxSpend) {
    await prisma.order.update({ where: { id: dbOrder.id }, data: { status: "rejected" } });
    return { orderId: dbOrder.id, matches: result, orderStatus: "rejected" };
  }
  // Debit the spend token upfront (will be refunded for unfilled portion)
  // For market orders with no liquidity, skip debit (will be rejected after matching)
  const debitAmt = maxSpend > 0 ? maxSpend : 0;
  if (debitAmt > 0) {
    await debitWallet(walletAddress, spendSymbol, debitAmt);
  }

  const takerEntry: OrderBookEntry = {
    id: dbOrder.id,
    walletAddress,
    price: effectivePrice,
    amount,
    remaining: amount,
    side,
    type,
    pair,
    chainId,
    baseSymbol,
    quoteSymbol,
    createdAt: dbOrder.createdAt,
  };

  let takerRemaining = amount;
  let takerFilled = 0;
  let totalTakerFee = 0;

  // Match against opposite side
  if (side === "buy") {
    // Buy matches against asks (sell orders) — asks sorted ASC
    for (let i = 0; i < book.asks.length && takerRemaining > 0; i++) {
      const maker = book.asks[i];
      if (type === "limit" && maker.price > effectivePrice) break;

      const matchPrice = maker.price;
      const matchAmount = Math.min(takerRemaining, maker.remaining);
      const matchTotal = preciseMul(matchPrice, matchAmount);

      // ── Fee Calculation (Maker/Taker) ──
      const takerFeeCalc = await calculateFee({
        walletAddress, pair, role: "taker", side: "buy",
        price: matchPrice, amount: matchAmount, baseSymbol, quoteSymbol,
      });
      const makerFeeCalc = await calculateFee({
        walletAddress: maker.walletAddress, pair, role: "maker", side: "sell",
        price: matchPrice, amount: matchAmount, baseSymbol, quoteSymbol,
      });

      const tradeId = `trd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      result.trades.push({
        id: tradeId,
        makerOrderId: maker.id,
        takerOrderId: dbOrder.id,
        price: matchPrice,
        amount: matchAmount,
        total: matchTotal,
        fee: takerFeeCalc.feeAmount,
        makerFee: makerFeeCalc.feeAmount,
        takerFee: takerFeeCalc.feeAmount,
        makerWallet: maker.walletAddress,
        takerWallet: walletAddress,
        createdAt: new Date(),
      });

      // ── Settle Balances (fee-deducted) ──
      // TAKER (BUY): receives BASE, pays USDT. Fee deducted from BASE received.
      const takerReceivesBase = preciseSub(matchAmount, takerFeeCalc.feeAmount);
      if (takerReceivesBase > 0) {
        await creditWallet(walletAddress, baseSymbol, takerReceivesBase);
      }
      // MAKER (SELL): receives USDT, gives BASE. Fee deducted from USDT received.
      const makerReceivesQuote = preciseSub(matchTotal, makerFeeCalc.feeAmount);
      if (makerReceivesQuote > 0) {
        await creditWallet(maker.walletAddress, quoteSymbol, makerReceivesQuote);
      }

      // ── Audit Log ──
      await recordFee({
        walletAddress, pair, orderId: dbOrder.id, tradeId, fee: takerFeeCalc,
        baseSymbol, quoteSymbol, price: matchPrice, amount: matchAmount, side: "buy",
      });
      await recordFee({
        walletAddress: maker.walletAddress, pair, orderId: maker.id, tradeId, fee: makerFeeCalc,
        baseSymbol, quoteSymbol, price: matchPrice, amount: matchAmount, side: "sell",
      });

      maker.remaining = preciseSub(maker.remaining, matchAmount);
      takerRemaining = preciseSub(takerRemaining, matchAmount);
      takerFilled = preciseAdd(takerFilled, matchAmount);
      totalTakerFee = preciseAdd(totalTakerFee, takerFeeCalc.feeAmount);

      if (maker.remaining <= 0.000001) {
        book.asks.splice(i, 1);
        i--;
        result.filledOrders.push(maker.id);
      } else {
        result.partialOrders.push(maker.id);
      }
    }
  } else {
    // Sell matches against bids (buy orders) — bids sorted DESC
    for (let i = 0; i < book.bids.length && takerRemaining > 0; i++) {
      const maker = book.bids[i];
      if (type === "limit" && maker.price < effectivePrice) break;

      const matchPrice = maker.price;
      const matchAmount = Math.min(takerRemaining, maker.remaining);
      const matchTotal = preciseMul(matchPrice, matchAmount);

      // ── Fee Calculation (Maker/Taker) ──
      const takerFeeCalc = await calculateFee({
        walletAddress, pair, role: "taker", side: "sell",
        price: matchPrice, amount: matchAmount, baseSymbol, quoteSymbol,
      });
      const makerFeeCalc = await calculateFee({
        walletAddress: maker.walletAddress, pair, role: "maker", side: "buy",
        price: matchPrice, amount: matchAmount, baseSymbol, quoteSymbol,
      });

      const tradeId = `trd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      result.trades.push({
        id: tradeId,
        makerOrderId: maker.id,
        takerOrderId: dbOrder.id,
        price: matchPrice,
        amount: matchAmount,
        total: matchTotal,
        fee: takerFeeCalc.feeAmount,
        makerFee: makerFeeCalc.feeAmount,
        takerFee: takerFeeCalc.feeAmount,
        makerWallet: maker.walletAddress,
        takerWallet: walletAddress,
        createdAt: new Date(),
      });

      // ── Settle Balances (fee-deducted) ──
      // TAKER (SELL): receives USDT, gives BASE. Fee deducted from USDT received.
      const takerReceivesQuote = preciseSub(matchTotal, takerFeeCalc.feeAmount);
      if (takerReceivesQuote > 0) {
        await creditWallet(walletAddress, quoteSymbol, takerReceivesQuote);
      }
      // MAKER (BUY): receives BASE, pays USDT. Fee deducted from BASE received.
      const makerReceivesBase = preciseSub(matchAmount, makerFeeCalc.feeAmount);
      if (makerReceivesBase > 0) {
        await creditWallet(maker.walletAddress, baseSymbol, makerReceivesBase);
      }

      // ── Audit Log ──
      await recordFee({
        walletAddress, pair, orderId: dbOrder.id, tradeId, fee: takerFeeCalc,
        baseSymbol, quoteSymbol, price: matchPrice, amount: matchAmount, side: "sell",
      });
      await recordFee({
        walletAddress: maker.walletAddress, pair, orderId: maker.id, tradeId, fee: makerFeeCalc,
        baseSymbol, quoteSymbol, price: matchPrice, amount: matchAmount, side: "buy",
      });

      maker.remaining = preciseSub(maker.remaining, matchAmount);
      takerRemaining = preciseSub(takerRemaining, matchAmount);
      takerFilled = preciseAdd(takerFilled, matchAmount);
      totalTakerFee = preciseAdd(totalTakerFee, takerFeeCalc.feeAmount);

      if (maker.remaining <= 0.000001) {
        book.bids.splice(i, 1);
        i--;
        result.filledOrders.push(maker.id);
      } else {
        result.partialOrders.push(maker.id);
      }
    }
  }

  // Persist trades to DB (with individual maker/taker fee amounts)
  for (const trade of result.trades) {
    await prisma.trade.create({
      data: {
        id: trade.id,
        orderId: trade.takerOrderId,
        pair: trade.pair || pair,
        side,
        price: trade.price,
        amount: trade.amount,
        total: trade.total,
        fee: trade.takerFee,
        makerWallet: trade.makerWallet,
        takerWallet: trade.takerWallet,
        isMaker: false,
      },
    });
    // Mirror trade for the maker
    await prisma.trade.create({
      data: {
        id: `${trade.id}_m`,
        orderId: trade.makerOrderId,
        pair: trade.pair || pair,
        side: side === "buy" ? "sell" : "buy",
        price: trade.price,
        amount: trade.amount,
        total: trade.total,
        fee: trade.makerFee,
        makerWallet: trade.makerWallet,
        takerWallet: trade.takerWallet,
        isMaker: true,
      },
    });
  }

  // ── Settle balances ──
  // Balances are now settled per-trade inside the matching loop above.
  // This section only handles the taker's refund for unfilled portion.
  // (Maker credits are also handled per-trade in the loop.)

  // Refund unspent portion to taker
  // For buy: actualSpent = sum of matchTotal for each fill (USDT already debited upfront)
  // For sell: actualSpent = takerFilled (base tokens debited upfront)
  let actualSpent = 0;
  if (takerFilled > 0) {
    if (side === "buy") {
      actualSpent = result.trades.reduce((s, t) => s + t.total, 0);
    } else {
      actualSpent = takerFilled;
    }
  }
  const refund = preciseSub(debitAmt, actualSpent);
  if (refund > 0.000001) {
    await creditWallet(walletAddress, spendSymbol, refund);
  }

  // Update taker order status in DB
  let orderStatus: string;
  if (takerFilled >= amount - 0.000001) {
    // Fully filled
    orderStatus = "filled";
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { filledAmount: amount, remainingAmount: 0, fee: totalTakerFee, status: "filled" },
    });
  } else if (takerFilled > 0) {
    // Partially filled
    orderStatus = "partial";
    takerEntry.remaining = takerRemaining;
    if (type === "limit") {
      // Add remaining to book
      if (side === "buy") {
        book.bids.push(takerEntry);
        sortBids(book.bids);
      } else {
        book.asks.push(takerEntry);
        sortAsks(book.asks);
      }
    }
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { filledAmount: takerFilled, remainingAmount: takerRemaining, fee: totalTakerFee, status: "partial" },
    });
  } else {
    // No fill — add to book if limit
    orderStatus = "open";
    if (type === "limit") {
      if (side === "buy") {
        book.bids.push(takerEntry);
        sortBids(book.bids);
      } else {
        book.asks.push(takerEntry);
        sortAsks(book.asks);
      }
    } else if (type === "market" && takerFilled === 0) {
      // Market order with no fill — reject and refund
      await prisma.order.update({
        where: { id: dbOrder.id },
        data: { status: "rejected" },
      });
      // Refund the debited amount
      await creditWallet(walletAddress, spendSymbol, debitAmt);
      orderStatus = "rejected";
    }
  }

  // Update filled maker orders in DB
  for (const makerId of result.filledOrders) {
    const makerOrder = await prisma.order.findUnique({ where: { id: makerId } });
    if (makerOrder) {
      await prisma.order.update({
        where: { id: makerId },
        data: { filledAmount: makerOrder.amount, remainingAmount: 0, status: "filled" },
      });
    }
  }
  for (const makerId of result.partialOrders) {
    if (!result.filledOrders.includes(makerId)) {
      const makerEntry = [...(side === "buy" ? book.asks : book.bids), ...(side === "sell" ? book.asks : book.bids)].find(e => e.id === makerId);
      if (makerEntry) {
        await prisma.order.update({
          where: { id: makerId },
          data: { filledAmount: makerEntry.amount - makerEntry.remaining, remainingAmount: makerEntry.remaining, status: "partial" },
        });
      }
    }
  }

  return { orderId: dbOrder.id, matches: result, orderStatus };
}

// ── Cancel Order ──
export async function cancelOrder(orderId: string, walletAddress: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.walletAddress !== walletAddress) return false;
  if (order.status === "filled" || order.status === "cancelled") return false;

  // Remove from in-memory book
  const book = getBook(order.pair);
  const list = order.side === "buy" ? book.bids : book.asks;
  const idx = list.findIndex(e => e.id === orderId);
  if (idx >= 0) list.splice(idx, 1);

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
  });

  // Refund remaining amount to user's exchange balance
  const remaining = order.remainingAmount ?? (order.amount - order.filledAmount);
  if (remaining > 0.000001) {
    const refundSymbol = order.side === "buy" ? order.quoteSymbol : order.baseSymbol;
    const refundAmount = order.side === "buy"
      ? remaining * order.price
      : remaining;
    await creditWallet(walletAddress, refundSymbol, refundAmount);
  }

  return true;
}

// ── Get Order Book Snapshot ──
export function getOrderBookSnapshot(pair: string, depth: number = 20): OrderBookSnapshot {
  const book = getBook(pair);

  // Aggregate by price level
  const bidMap = new Map<number, number>();
  for (const bid of book.bids) {
    bidMap.set(bid.price, (bidMap.get(bid.price) ?? 0) + bid.remaining);
  }
  const askMap = new Map<number, number>();
  for (const ask of book.asks) {
    askMap.set(ask.price, (askMap.get(ask.price) ?? 0) + ask.remaining);
  }

  const bidEntries = [...bidMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, depth);
  const askEntries = [...askMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, depth);

  let runningBidTotal = 0;
  const bids = bidEntries.map(([price, amount]) => {
    runningBidTotal += price * amount;
    return { price, amount, total: runningBidTotal };
  });

  let runningAskTotal = 0;
  const asks = askEntries.map(([price, amount]) => {
    runningAskTotal += price * amount;
    return { price, amount, total: runningAskTotal };
  });

  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const spread = bestBid && bestAsk ? bestAsk - bestBid : 0;

  return { pair, bids, asks, spread, bestBid, bestAsk };
}

// ── Get Recent Trades ──
export async function getRecentTrades(pair: string, limit: number = 30) {
  const trades = await prisma.trade.findMany({
    where: { pair, isMaker: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return trades.reverse().map(t => ({
    id: t.id,
    price: t.price,
    amount: t.amount,
    side: t.side as "buy" | "sell",
    time: t.createdAt,
  }));
}

// ── Get User Open Orders ──
export async function getUserOrders(walletAddress: string, pair?: string) {
  const where: Record<string, unknown> = { walletAddress, status: { in: ["open", "partial"] } };
  if (pair) where.pair = pair;

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ── Get User Trade History ──
export async function getUserTradeHistory(walletAddress: string, pair?: string, limit: number = 50) {
  const where: Record<string, unknown> = { takerWallet: walletAddress };
  if (pair) where.pair = pair;

  return prisma.trade.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ── Seed Market Maker Orders (initial liquidity) ──
export async function seedMarketMakerLiquidity(pair: string, basePrice: number, baseSymbol: string, quoteSymbol: string, chainId: number) {
  const book = getBook(pair);
  if (book.bids.length > 0 || book.asks.length > 0) return; // already has liquidity

  const MM_WALLET = "0x000000000000000000000000000000000000MM";
  const spread = basePrice * 0.002; // 0.2% spread
  const levels = 15;
  const baseAmount = 500 + Math.random() * 1500;

  for (let i = 0; i < levels; i++) {
    const bidPrice = basePrice - spread / 2 - (i + 1) * basePrice * 0.0005;
    const askPrice = basePrice + spread / 2 + (i + 1) * basePrice * 0.0005;
    const bidAmt = baseAmount * (1 - i * 0.04) + Math.random() * 200;
    const askAmt = baseAmount * (1 - i * 0.04) + Math.random() * 200;

    // Create bid
    const bidOrder = await prisma.order.create({
      data: {
        walletAddress: MM_WALLET,
        pair,
        side: "buy",
        type: "limit",
        price: Math.round(bidPrice * 10000) / 10000,
        amount: Math.round(bidAmt * 100) / 100,
        filledAmount: 0,
        remainingAmount: Math.round(bidAmt * 100) / 100,
        total: Math.round(bidPrice * bidAmt * 100) / 100,
        chainId,
        baseSymbol,
        quoteSymbol,
        status: "open",
      },
    });
    book.bids.push({
      id: bidOrder.id,
      walletAddress: MM_WALLET,
      price: bidOrder.price,
      amount: bidOrder.amount,
      remaining: bidOrder.amount,
      side: "buy",
      type: "limit",
      pair,
      chainId,
      baseSymbol,
      quoteSymbol,
      createdAt: bidOrder.createdAt,
    });

    // Create ask
    const askOrder = await prisma.order.create({
      data: {
        walletAddress: MM_WALLET,
        pair,
        side: "sell",
        type: "limit",
        price: Math.round(askPrice * 10000) / 10000,
        amount: Math.round(askAmt * 100) / 100,
        filledAmount: 0,
        remainingAmount: Math.round(askAmt * 100) / 100,
        total: Math.round(askPrice * askAmt * 100) / 100,
        chainId,
        baseSymbol,
        quoteSymbol,
        status: "open",
      },
    });
    book.asks.push({
      id: askOrder.id,
      walletAddress: MM_WALLET,
      price: askOrder.price,
      amount: askOrder.amount,
      remaining: askOrder.amount,
      side: "sell",
      type: "limit",
      pair,
      chainId,
      baseSymbol,
      quoteSymbol,
      createdAt: askOrder.createdAt,
    });
  }

  sortBids(book.bids);
  sortAsks(book.asks);
  console.log(`[OrderEngine] Seeded ${levels} bid + ${levels} ask levels for ${pair}`);
}

// ── Check stop orders ──
export async function checkStopOrders(pair: string, currentPrice: number) {
  // Find open stop orders for this pair
  const stopOrders = await prisma.order.findMany({
    where: { pair, type: "stop", status: "open" },
  });

  for (const so of stopOrders) {
    const shouldTrigger = so.side === "buy"
      ? (currentPrice >= (so.stopPrice ?? 0))
      : (currentPrice <= (so.stopPrice ?? 0));

    if (shouldTrigger) {
      // Convert stop to limit order
      await prisma.order.update({
        where: { id: so.id },
        data: {
          type: "limit",
          status: "open",
        },
      });
      // Now place as limit order
      await placeOrder({
        walletAddress: so.walletAddress,
        pair: so.pair,
        side: so.side as "buy" | "sell",
        type: "limit",
        price: so.price,
        amount: so.amount,
        chainId: so.chainId,
        baseSymbol: so.baseSymbol,
        quoteSymbol: so.quoteSymbol,
      });
    }
  }
}

// ── Market Stats ──
export async function getMarketStats(pair: string) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const trades = await prisma.trade.findMany({
    where: { pair, isMaker: false, createdAt: { gte: last24h } },
  });

  let volume24h = 0;
  let high24h = 0;
  let low24h = Infinity;
  let trades24h = trades.length;

  for (const t of trades) {
    volume24h += t.total;
    if (t.price > high24h) high24h = t.price;
    if (t.price < low24h) low24h = t.price;
  }

  if (low24h === Infinity) low24h = 0;

  return { volume24h, high24h, low24h, trades24h };
}
