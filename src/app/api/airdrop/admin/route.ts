import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "GCRM2026Admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const queryPw = url.searchParams.get("pw");
    const pw = authHeader?.replace("Bearer ", "") || queryPw;

    if (pw !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = url;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { wallet: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const [registrations, total] = await Promise.all([
      db.airdropRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.airdropRegistration.count({ where }),
    ]);

    const stats = {
      total,
      pending: await db.airdropRegistration.count({ where: { status: "pending" } }),
      validated3h: await db.airdropRegistration.count({ where: { status: "validated-3h" } }),
      validated72h: await db.airdropRegistration.count({ where: { status: "validated-72h" } }),
      completed: await db.airdropRegistration.count({ where: { status: "completed" } }),
      totalGcrm: (await db.airdropRegistration.aggregate({ _sum: { gcrmEarned: true } }))._sum.gcrmEarned || 0,
    };

    const formatted = registrations.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      wallet: r.wallet,
      completedTasks: JSON.parse(r.completedTasks || "[]"),
      taskCount: (JSON.parse(r.completedTasks || "[]") as string[]).length,
      referralCode: r.referralCode,
      referredBy: r.referredBy,
      gcrmEarned: r.gcrmEarned,
      status: r.status,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
      validatedAt: r.validatedAt?.toISOString() || null,
    }));

    return NextResponse.json({ registrations: formatted, stats, page, totalPages: Math.ceil(total / limit) });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("Admin fetch error:", msg);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const pw = authHeader?.replace("Bearer ", "") || "";
    if (pw !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { action, registrationId, status: newStatus } = await req.json();

    if (action === "validate" && registrationId && newStatus) {
      const updated = await db.airdropRegistration.update({
        where: { id: registrationId },
        data: { status: newStatus, validatedAt: new Date() },
      });
      return NextResponse.json({ success: true, registration: updated });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
