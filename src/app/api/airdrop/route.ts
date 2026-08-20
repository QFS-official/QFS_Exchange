import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, wallet, completedTasks = [], referral } = body;

    if (!username || !email || !wallet) {
      return NextResponse.json({ error: "Faltan campos requeridos (username, email, wallet)" }, { status: 400 });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: "Dirección wallet ERC-20 inválida" }, { status: 400 });
    }

    // Check duplicate email or referral code
    const existing = await db.airdropRegistration.findFirst({
      where: { OR: [{ email }, { referralCode: username.toLowerCase().replace(/\s+/g, "") }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un registro con ese email o nombre de usuario" }, { status: 409 });
    }

    const taskList = JSON.stringify(completedTasks);
    const referralCode = username.toLowerCase().replace(/\s+/g, "");

    // Calculate earned GCRM from tasks
    const TASK_REWARDS: Record<string, number> = {
      twitter: 3, telegram: 2, facebook: 1, instagram: 1, tiktok: 1,
      youtube: 1, discord: 1, whatsapp: 1, reddit: 1, github: 1, medium: 1,
    };
    const gcrmEarned = (Array.isArray(completedTasks) ? completedTasks : []).reduce(
      (sum, id) => sum + (TASK_REWARDS[id] || 0), 0
    );

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    const registration = await db.airdropRegistration.create({
      data: {
        username,
        email,
        wallet,
        completedTasks: taskList,
        referralCode,
        referredBy: referral || null,
        gcrmEarned,
        ipAddress: ip,
      },
    });

    return NextResponse.json({ success: true, id: registration.id, gcrmEarned }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Airdrop registration error:", msg);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const total = await db.airdropRegistration.count();
    const pending = await db.airdropRegistration.count({ where: { status: "pending" } });
    const validated = await db.airdropRegistration.count({ where: { status: { startsWith: "validated" } } });
    const completed = await db.airdropRegistration.count({ where: { status: "completed" } });
    const totalGcrm = await db.airdropRegistration.aggregate({ _sum: { gcrmEarned: true } });

    return NextResponse.json({
      total,
      pending,
      validated,
      completed,
      totalGcrmDistributed: totalGcrm._sum.gcrmEarned || 0,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Airdrop stats error:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
