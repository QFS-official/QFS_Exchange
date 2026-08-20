import { NextResponse } from "next/server";

// Default pools — always returned even if DB is completely broken
const DEFAULT_POOLS = [
  { symbol: "GCRM", name: "GCRM Flexible", apy: 18.5, lockDays: 0, minStake: 1 },
  { symbol: "GCRM", name: "GCRM 30 Dias", apy: 28.0, lockDays: 30, minStake: 10 },
  { symbol: "GCRM", name: "GCRM 90 Dias", apy: 42.0, lockDays: 90, minStake: 10 },
  { symbol: "QFS", name: "QFS Flexible", apy: 15.0, lockDays: 0, minStake: 100 },
  { symbol: "ALARAB", name: "ALARAB Flexible", apy: 12.0, lockDays: 0, minStake: 50 },
  { symbol: "NESG", name: "NESG Flexible", apy: 10.0, lockDays: 0, minStake: 100 },
];

const makeDefaultPools = () =>
  DEFAULT_POOLS.map((p, i) => ({
    ...p,
    id: `default-${i}`,
    totalStaked: 0,
    tvl: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

// Lazy Prisma import — never fails at module load time
let _prisma: any = null;
let _prismaFailed = false;

async function getPrisma() {
  if (_prismaFailed) return null;
  if (_prisma) return _prisma;
  try {
    const mod = await import("@/lib/db");
    _prisma = mod.db;
    console.log("[Staking] Prisma loaded successfully");
    return _prisma;
  } catch (err) {
    console.error("[Staking] Failed to load Prisma:", err);
    _prismaFailed = true;
    return null;
  }
}

let poolsSeeded = false;

async function ensurePools(prisma: any): Promise<boolean> {
  if (poolsSeeded) return true;
  if (!prisma) return false;
  try {
    const count = await prisma.stakingPool.count();
    if (count === 0) {
      for (const p of DEFAULT_POOLS) {
        await prisma.stakingPool.create({ data: p });
      }
      console.log(`[Staking] Seeded ${DEFAULT_POOLS.length} pools`);
    }
    poolsSeeded = true;
    return true;
  } catch (err) {
    console.error("[Staking] ensurePools error:", err);
    return false;
  }
}

// GET /api/staking?wallet=0x... → pools + user positions + rewards
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  try {
    const prisma = await getPrisma();
    if (prisma) await ensurePools(prisma);

    let pools;
    if (prisma) {
      try {
        pools = await prisma.stakingPool.findMany({ orderBy: { apy: "desc" } });
      } catch {
        console.warn("[Staking GET] DB query error, using defaults");
        pools = null;
      }
    }

    if (!pools || pools.length === 0) {
      pools = makeDefaultPools();
    }

    // Calculate pending rewards for each active position
    let positions: any[] = [];
    if (prisma && wallet) {
      try {
        positions = await prisma.stakingPosition.findMany({
          where: { walletAddress: wallet.toLowerCase(), status: "active" },
          include: { pool: true },
          orderBy: { startTime: "desc" },
        });
      } catch {
        positions = [];
      }
    }

    // Update pending rewards
    const now = Date.now();
    for (const pos of positions) {
      const daysStaked = (now - pos.startTime.getTime()) / (1000 * 60 * 60 * 24);
      const dailyRate = pos.pool.apy / 365 / 100;
      const earned = pos.amount * dailyRate * daysStaked;
      pos.pendingReward = Math.max(0, earned - pos.rewardDebt);
    }

    // Aggregate total staked per pool
    let totalMap = new Map<string, number>();
    if (prisma) {
      try {
        const poolAgg = await prisma.stakingPosition.groupBy({
          by: ["poolId"],
          where: { status: "active" },
          _sum: { amount: true },
        });
        totalMap = new Map(poolAgg.map((p: any) => [p.poolId, p._sum.amount ?? 0]));
      } catch {
        // TVL unavailable
      }
    }

    const poolsWithTVL = pools.map((p: any) => ({
      ...p,
      tvl: totalMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({ pools: poolsWithTVL, positions });
  } catch (error) {
    console.error("[Staking GET] Unexpected error:", error);
    return NextResponse.json({ pools: makeDefaultPools(), positions: [] });
  }
}

// POST /api/staking → { action: "stake"|"unstake"|"claim", ... }
export async function POST(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  await ensurePools(prisma);
  try {
    const body = await req.json();
    const { action, walletAddress, poolId, amount } = body;

    if (!walletAddress || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const w = walletAddress.toLowerCase();

    if (action === "stake") {
      if (!poolId || !amount || amount <= 0) {
        return NextResponse.json({ error: "poolId and amount required" }, { status: 400 });
      }

      const pool = await prisma.stakingPool.findUnique({ where: { id: poolId } });
      if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });
      if (amount < pool.minStake) {
        return NextResponse.json({ error: `Minimum stake: ${pool.minStake} ${pool.symbol}` }, { status: 400 });
      }

      const bal = await prisma.exchangeBalance.findUnique({
        where: { walletAddress_symbol: { walletAddress: w, symbol: pool.symbol } },
      });
      const available = bal?.available ?? 0;
      if (available < amount) {
        return NextResponse.json({ error: `Insufficient ${pool.symbol} balance. Available: ${available}` }, { status: 422 });
      }

      await prisma.exchangeBalance.upsert({
        where: { walletAddress_symbol: { walletAddress: w, symbol: pool.symbol } },
        create: { walletAddress: w, symbol: pool.symbol, available: Math.max(0, -amount) },
        update: { available: { decrement: amount } },
      });

      const endTime = pool.lockDays > 0
        ? new Date(Date.now() + pool.lockDays * 24 * 60 * 60 * 1000)
        : null;

      const position = await prisma.stakingPosition.create({
        data: {
          walletAddress: w,
          poolId,
          amount,
          rewardDebt: 0,
          pendingReward: 0,
          startTime: new Date(),
          endTime,
          status: "active",
        },
        include: { pool: true },
      });

      return NextResponse.json({ success: true, position });
    }

    if (action === "unstake") {
      if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });

      const position = await prisma.stakingPosition.findFirst({
        where: { walletAddress: w, poolId, status: "active" },
        include: { pool: true },
      });
      if (!position) return NextResponse.json({ error: "No active position found" }, { status: 404 });

      if (position.endTime && Date.now() < position.endTime.getTime()) {
        const daysLeft = Math.ceil((position.endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return NextResponse.json({ error: `Locked. ${daysLeft} days remaining` }, { status: 422 });
      }

      const daysStaked = (Date.now() - position.startTime.getTime()) / (1000 * 60 * 60 * 24);
      const dailyRate = position.pool.apy / 365 / 100;
      const totalReward = position.amount * dailyRate * daysStaked;
      const netReward = totalReward - position.rewardDebt;

      await prisma.exchangeBalance.upsert({
        where: { walletAddress_symbol: { walletAddress: w, symbol: position.pool.symbol } },
        create: { walletAddress: w, symbol: position.pool.symbol, available: position.amount + netReward },
        update: { available: { increment: position.amount + netReward } },
      });

      await prisma.stakingPosition.update({
        where: { id: position.id },
        data: { status: "unstaked", pendingReward: 0, rewardDebt: totalReward },
      });

      return NextResponse.json({ success: true, unstakedAmount: position.amount, rewardClaimed: netReward });
    }

    if (action === "claim") {
      if (!poolId) return NextResponse.json({ error: "poolId required" }, { status: 400 });

      const position = await prisma.stakingPosition.findFirst({
        where: { walletAddress: w, poolId, status: "active" },
        include: { pool: true },
      });
      if (!position) return NextResponse.json({ error: "No active position found" }, { status: 404 });

      const daysStaked = (Date.now() - position.startTime.getTime()) / (1000 * 60 * 60 * 24);
      const dailyRate = position.pool.apy / 365 / 100;
      const totalReward = position.amount * dailyRate * daysStaked;
      const netReward = totalReward - position.rewardDebt;

      if (netReward <= 0.000001) {
        return NextResponse.json({ error: "No rewards to claim" }, { status: 400 });
      }

      await prisma.exchangeBalance.upsert({
        where: { walletAddress_symbol: { walletAddress: w, symbol: position.pool.symbol } },
        create: { walletAddress: w, symbol: position.pool.symbol, available: netReward },
        update: { available: { increment: netReward } },
      });

      await prisma.stakingPosition.update({
        where: { id: position.id },
        data: { rewardDebt: totalReward, pendingReward: 0 },
      });

      return NextResponse.json({ success: true, rewardClaimed: netReward });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Staking POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
