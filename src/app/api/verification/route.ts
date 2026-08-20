import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMe } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const user = await getMe(token);
    if (!user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

    // Get user's current KYC level
    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Get all submissions for this user
    const submissions = await db.kycSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Build level-specific status
    const levels = [
      {
        level: 1,
        name: "Verificación de Email",
        description: "Confirma tu dirección de email",
        status: fullUser.kycLevel >= 1 ? "approved" : "none",
        currentLevel: fullUser.kycLevel >= 1,
      },
      {
        level: 2,
        name: "Verificación de Identidad",
        description: "Sube tu documento de identidad y una selfie",
        status: "none",
        currentLevel: fullUser.kycLevel >= 2,
      },
      {
        level: 3,
        name: "Verificación de Dirección",
        description: "Confirma tu dirección con un comprobante",
        status: "none",
        currentLevel: fullUser.kycLevel >= 3,
      },
    ];

    for (const sub of submissions) {
      const lvl = levels.find((l) => l.level === sub.level);
      if (lvl && sub.level > fullUser.kycLevel) {
        lvl.status = sub.status;
        lvl.documentType = sub.documentType;
        lvl.rejectReason = sub.rejectReason;
      }
    }

    return NextResponse.json({
      kycLevel: fullUser.kycLevel,
      levels,
      submissions: submissions.map((s) => ({
        id: s.id,
        level: s.level,
        status: s.status,
        documentType: s.documentType,
        documentNumber: s.documentNumber,
        fullName: s.fullName,
        createdAt: s.createdAt,
        reviewedAt: s.reviewedAt,
        rejectReason: s.rejectReason,
      })),
    });
  } catch (e) {
    console.error("[Verification GET]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const user = await getMe(token);
    if (!user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

    const body = await req.json();
    const { level, documentType, documentNumber, documentFront, documentBack, selfieWithId, fullName, dob, address, city, addressProof } = body;

    if (!level || level < 1 || level > 3) {
      return NextResponse.json({ error: "Nivel de verificación inválido" }, { status: 400 });
    }

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Level 1: Verify email (auto-approve since email is already verified at registration)
    if (level === 1) {
      if (fullUser.kycLevel >= 1) {
        return NextResponse.json({ error: "Email ya verificado" }, { status: 400 });
      }
      await db.user.update({ where: { id: user.id }, data: { kycLevel: 1 } });
      await db.kycSubmission.create({
        data: { userId: user.id, level: 1, status: "approved", reviewedBy: "system", reviewedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "Email verificado exitosamente", newKycLevel: 1 });
    }

    // Level 2: ID Verification
    if (level === 2) {
      if (fullUser.kycLevel < 1) {
        return NextResponse.json({ error: "Completa la verificación de email primero" }, { status: 400 });
      }
      if (fullUser.kycLevel >= 2) {
        return NextResponse.json({ error: "Identidad ya verificada" }, { status: 400 });
      }
      // Check for pending submission
      const pending = await db.kycSubmission.findFirst({ where: { userId: user.id, level: 2, status: "pending" } });
      if (pending) {
        return NextResponse.json({ error: "Ya tienes una verificación de identidad en proceso" }, { status: 400 });
      }
      if (!documentType || !documentNumber || !fullName || !dob || !documentFront || !selfieWithId) {
        return NextResponse.json({ error: "Todos los campos requeridos deben ser completados" }, { status: 400 });
      }
      const submission = await db.kycSubmission.create({
        data: {
          userId: user.id, level: 2, status: "review",
          documentType, documentNumber, documentFront, documentBack, selfieWithId,
          fullName, dob,
        },
      });
      // Auto-approve for demo purposes (in production, this would go to admin review)
      await db.kycSubmission.update({
        where: { id: submission.id },
        data: { status: "approved", reviewedBy: "system", reviewedAt: new Date() },
      });
      await db.user.update({ where: { id: user.id }, data: { kycLevel: 2 } });
      return NextResponse.json({ success: true, message: "Identidad verificada exitosamente", newKycLevel: 2 });
    }

    // Level 3: Address Verification
    if (level === 3) {
      if (fullUser.kycLevel < 2) {
        return NextResponse.json({ error: "Completa la verificación de identidad primero" }, { status: 400 });
      }
      if (fullUser.kycLevel >= 3) {
        return NextResponse.json({ error: "Dirección ya verificada" }, { status: 400 });
      }
      if (!address || !city || !addressProof) {
        return NextResponse.json({ error: "Todos los campos requeridos deben ser completados" }, { status: 400 });
      }
      const submission = await db.kycSubmission.create({
        data: { userId: user.id, level: 3, status: "review", address, city, addressProof },
      });
      // Auto-approve for demo
      await db.kycSubmission.update({
        where: { id: submission.id },
        data: { status: "approved", reviewedBy: "system", reviewedAt: new Date() },
      });
      await db.user.update({ where: { id: user.id }, data: { kycLevel: 3 } });
      return NextResponse.json({ success: true, message: "Dirección verificada exitosamente", newKycLevel: 3 });
    }

    return NextResponse.json({ error: "Nivel no válido" }, { status: 400 });
  } catch (e) {
    console.error("[Verification POST]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
