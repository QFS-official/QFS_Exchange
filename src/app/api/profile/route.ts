import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMe } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const user = await getMe(token);
    if (!user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

    // Fetch full profile from DB
    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Get session count
    const sessionCount = await db.session.count({ where: { userId: user.id } });

    return NextResponse.json({
      profile: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        phone: fullUser.phone,
        country: fullUser.country,
        avatar: fullUser.avatar,
        role: fullUser.role,
        kycLevel: fullUser.kycLevel,
        referralCode: fullUser.referralCode,
        antiPhishingCode: fullUser.antiPhishingCode,
        createdAt: fullUser.createdAt,
        activeSessions: sessionCount,
      },
    });
  } catch (e) {
    console.error("[Profile GET]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const user = await getMe(token);
    if (!user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

    const body = await req.json();
    const { name, phone, country, avatar } = body;

    // Build update data - only include provided fields
    const data: Record<string, string | null> = {};
    if (typeof name === "string") data.name = name.trim() || null;
    if (typeof phone === "string") data.phone = phone.trim() || null;
    if (typeof country === "string") data.country = country.trim() || null;
    if (typeof avatar === "string") data.avatar = avatar.trim() || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
    });

    return NextResponse.json({
      success: true,
      profile: {
        name: updated.name,
        phone: updated.phone,
        country: updated.country,
        avatar: updated.avatar,
      },
    });
  } catch (e) {
    console.error("[Profile PUT]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
