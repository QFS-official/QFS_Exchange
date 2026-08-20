import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { TOTP } from "otpauth";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getMe } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    const user = await getMe(token);
    if (!user) return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });

    const sessions = await db.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
      security: {
        twoFactor: fullUser.twoFactor,
        antiPhishingCode: fullUser.antiPhishingCode,
        email: fullUser.email,
        phone: fullUser.phone,
        kycLevel: fullUser.kycLevel,
        createdAt: fullUser.createdAt,
        sessions: sessions.map((s) => ({
          id: s.id,
          token: s.token === token ? s.token : "***",
          isCurrent: s.token === token,
          userAgent: s.userAgent,
          ip: s.ip,
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
      },
    });
  } catch (e) {
    console.error("[Security GET]", e);
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
    const { action } = body;

    if (action === "change_password") {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Contraseñas requeridas" }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
      }

      const fullUser = await db.user.findUnique({ where: { id: user.id } });
      if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
      if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

      const hash = await bcrypt.hash(newPassword, 10);
      await db.user.update({ where: { id: user.id }, data: { passwordHash: hash } });

      return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente" });
    }

    // Generate TOTP secret + QR code for Google Authenticator setup
    if (action === "setup_2fa") {
      const { currentPassword } = body;
      const fullUser = await db.user.findUnique({ where: { id: user.id } });
      if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
      if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });

      // Generate new TOTP secret
      const totp = new TOTP({
        issuer: "GCRM Exchange",
        label: fullUser.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: TOTP.generateSecret(),
      });

      const secretBase32 = totp.secret.base32;
      const otpauthUrl = totp.toString();

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
        width: 260,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      // Temporarily store secret (not enabled yet until verified)
      await db.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secretBase32 },
      });

      return NextResponse.json({
        success: true,
        qrCode: qrDataUrl,
        secret: secretBase32,
        message: "Escanea el código QR con Google Authenticator",
      });
    }

    // Verify TOTP code and enable 2FA
    if (action === "enable_2fa") {
      const { totpCode } = body;
      if (!totpCode || totpCode.length !== 6) {
        return NextResponse.json({ error: "Ingresa el código de 6 dígitos" }, { status: 400 });
      }

      const fullUser = await db.user.findUnique({ where: { id: user.id } });
      if (!fullUser || !fullUser.twoFactorSecret) {
        return NextResponse.json({ error: "Primero configura el secreto TOTP" }, { status: 400 });
      }

      // Verify the TOTP code
      const totp = new TOTP({
        issuer: "GCRM Exchange",
        label: fullUser.email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: fullUser.twoFactorSecret,
      });

      const delta = totp.validate({ token: totpCode, window: 1 });
      if (delta === null) {
        return NextResponse.json({ error: "Código inválido. Verifica que la hora de tu dispositivo sea correcta." }, { status: 400 });
      }

      // Code is valid, enable 2FA
      await db.user.update({
        where: { id: user.id },
        data: { twoFactor: true },
      });

      return NextResponse.json({
        success: true,
        message: "Google Authenticator activado correctamente",
        twoFactor: true,
      });
    }

    // Disable 2FA
    if (action === "disable_2fa") {
      const { currentPassword, totpCode } = body;
      const fullUser = await db.user.findUnique({ where: { id: user.id } });
      if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

      const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
      if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });

      // If 2FA is enabled, also require TOTP code
      if (fullUser.twoFactor && fullUser.twoFactorSecret) {
        if (!totpCode || totpCode.length !== 6) {
          return NextResponse.json({ error: "Ingresa el código de Google Authenticator" }, { status: 400 });
        }
        const totp = new TOTP({
          issuer: "GCRM Exchange",
          label: fullUser.email,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: fullUser.twoFactorSecret,
        });
        const delta = totp.validate({ token: totpCode, window: 1 });
        if (delta === null) {
          return NextResponse.json({ error: "Código TOTP inválido" }, { status: 400 });
        }
      }

      await db.user.update({
        where: { id: user.id },
        data: { twoFactor: false, twoFactorSecret: null },
      });

      return NextResponse.json({
        success: true,
        message: "Google Authenticator desactivado correctamente",
        twoFactor: false,
      });
    }

    // Legacy toggle (backward compat)
    if (action === "toggle_2fa") {
      const { enable, currentPassword } = body;
      if (typeof enable !== "boolean") {
        return NextResponse.json({ error: "Parámetro inválido" }, { status: 400 });
      }
      if (enable && currentPassword) {
        const fullUser = await db.user.findUnique({ where: { id: user.id } });
        if (!fullUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        const valid = await bcrypt.compare(currentPassword, fullUser.passwordHash);
        if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { twoFactor: enable, twoFactorSecret: enable ? "SIMULATED" : null },
      });
      return NextResponse.json({
        success: true,
        message: enable ? "2FA activado" : "2FA desactivado",
        twoFactor: enable,
      });
    }

    if (action === "set_anti_phishing") {
      const { code } = body;
      if (!code || code.length < 3 || code.length > 20) {
        return NextResponse.json({ error: "El código debe tener entre 3 y 20 caracteres" }, { status: 400 });
      }
      await db.user.update({
        where: { id: user.id },
        data: { antiPhishingCode: code.trim() },
      });
      return NextResponse.json({ success: true, message: "Código anti-phishing actualizado" });
    }

    if (action === "revoke_session") {
      const { sessionId } = body;
      if (!sessionId) return NextResponse.json({ error: "ID de sesión requerido" }, { status: 400 });
      const session = await db.session.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== user.id) {
        return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
      }
      if (session.token === token) {
        return NextResponse.json({ error: "No puedes cerrar la sesión actual aquí" }, { status: 400 });
      }
      await db.session.delete({ where: { id: sessionId } });
      return NextResponse.json({ success: true, message: "Sesión revocada" });
    }

    if (action === "revoke_all_sessions") {
      await db.session.deleteMany({
        where: { userId: user.id, token: { not: token } },
      });
      return NextResponse.json({ success: true, message: "Todas las demás sesiones han sido cerradas" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (e) {
    console.error("[Security PUT]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
