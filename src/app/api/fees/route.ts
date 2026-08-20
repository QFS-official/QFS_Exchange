import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getUserFeeSchedule, VIP_TIERS, PAIR_FEE_CONFIGS, GCRM_FEE_DISCOUNT } from "@/lib/fee-engine";
import { getMe } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/*
  GET /api/fees

  Query params:
    action=schedule  → Returns user's fee schedule (VIP-adjusted)
    action=history   → Returns fee audit log
    action=tiers     → Returns all VIP tiers
*/

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "schedule";

    // ── FEE SCHEDULE ──
    if (action === "schedule") {
      // Return public fee structure (no auth required)
      const schedule = Object.values(PAIR_FEE_CONFIGS).map(cfg => ({
        pair: cfg.pair,
        makerRate: cfg.makerRate,
        takerRate: cfg.takerRate,
        makerRatePct: `${(cfg.makerRate * 100).toFixed(2)}%`,
        takerRatePct: `${(cfg.takerRate * 100).toFixed(2)}%`,
      }));

      return NextResponse.json({
        schedule,
        gcrmDiscount: `${(GCRM_FEE_DISCOUNT * 100).toFixed(0)}%`,
        note: "Rates shown are base rates. VIP discounts applied per-user at execution time.",
      });
    }

    // ── VIP TIERS ──
    if (action === "tiers") {
      return NextResponse.json({
        tiers: VIP_TIERS.map(t => ({
          level: t.level,
          name: t.name,
          minVolume30d: t.minVolume30d,
          minVolume30dFormatted: t.minVolume30d >= 1_000_000
            ? `$${(t.minVolume30d / 1_000_000).toFixed(0)}M`
            : `$${(t.minVolume30d / 1_000).toFixed(0)}K`,
          makerDiscount: `${(t.makerDiscount * 100).toFixed(0)}%`,
          takerDiscount: `${(t.takerDiscount * 100).toFixed(0)}%`,
          effectiveMaker: t.effectiveMaker,
          effectiveTaker: t.effectiveTaker,
        })),
        gcrmDiscount: `${(GCRM_FEE_DISCOUNT * 100).toFixed(0)}%`,
      });
    }

    // ── FEE HISTORY (requires auth) ──
    if (action === "history") {
      const token = req.cookies.get("gcrm_session")?.value;
      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      const user = await getMe(token);
      if (!user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }

      const wallet = user.email?.toLowerCase() || "";
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");

      const [records, total] = await Promise.all([
        prisma.feeRecord.findMany({
          where: { walletAddress: wallet },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.feeRecord.count({
          where: { walletAddress: wallet },
        }),
      ]);

      // Calculate totals
      const totalFees = records.reduce((sum, r) => sum + (r.feeAmount || 0), 0);

      return NextResponse.json({
        records: records.map(r => ({
          id: r.id,
          pair: r.pair,
          role: r.role,
          side: r.side,
          price: r.price,
          amount: r.amount,
          notional: r.notional,
          feeRate: r.feeRate,
          effectiveRate: r.effectiveRate,
          vipDiscount: r.vipDiscount,
          gcrmDiscount: r.gcrmDiscount,
          feeAmount: r.feeAmount,
          feeToken: r.feeToken,
          createdAt: r.createdAt,
        })),
        total,
        totalFees,
        limit,
        offset,
      });
    }

    // ── USER SCHEDULE (auth required, shows VIP-adjusted rates) ──
    if (action === "my-schedule") {
      const token = req.cookies.get("gcrm_session")?.value;
      if (!token) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const user = await getMe(token);
      if (!user) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }

      const wallet = user.email?.toLowerCase() || "";
      const schedule = await getUserFeeSchedule(wallet);

      return NextResponse.json({ schedule, wallet });
    }

    return NextResponse.json({ error: "Invalid action. Use: schedule, tiers, history, my-schedule" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Fees API] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
