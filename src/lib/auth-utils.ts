import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const SALT_ROUNDS = 10;
const SESSION_DAYS = 30;

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function register(
  email: string,
  password: string,
  name?: string,
  referralCode?: string
) {
  if (!email || !password) throw new AuthError("MISSING_FIELDS", "Email and password are required");
  if (password.length < 8) throw new AuthError("WEAK_PASSWORD", "Password must be at least 8 characters");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError("INVALID_EMAIL", "Invalid email format");

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new AuthError("EMAIL_EXISTS", "Email already registered");

  let referredBy: string | undefined;
  if (referralCode) {
    const referrer = await db.user.findUnique({ where: { referralCode } });
    if (!referrer) throw new AuthError("INVALID_REFERRAL", "Invalid referral code");
    referredBy = referrer.id;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      referralCode: generateReferralCode(),
      referredBy,
    },
  });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId: user.id, token, userAgent: null, ip: null, expiresAt },
  });

  return { user: safeUser(user), token };
}

export async function login(email: string, password: string) {
  if (!email || !password) throw new AuthError("MISSING_FIELDS", "Email and password are required");

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AuthError("NOT_FOUND", "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AuthError("INVALID_PASSWORD", "Invalid email or password");

  // Clean old sessions (use raw query to avoid client cache issues)
  await db.$executeRawUnsafe(
    'DELETE FROM Session WHERE userId = ' + "'" + user.id.replace(/'/g, "''") + "'"
  );

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId: user.id, token, userAgent: null, ip: null, expiresAt },
  });

  return { user: safeUser(user), token };
}

export async function logout(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function getMe(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return safeUser(session.user);
}

function safeUser(user: { id: string; email: string; name: string | null; phone: string | null; country: string | null; referralCode: string | null; role: string; kycLevel: number; twoFactor: boolean; twoFactorSecret: string | null; antiPhishingCode: string | null; createdAt: Date; avatar: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    country: user.country,
    referralCode: user.referralCode,
    role: user.role,
    kycLevel: user.kycLevel,
    twoFactor: user.twoFactor,
    antiPhishingCode: user.antiPhishingCode,
    createdAt: user.createdAt,
    avatar: user.avatar,
  };
}

export { AuthError };

export async function requestPasswordReset(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError("INVALID_EMAIL", "Formato de email invalido");
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AuthError("NOT_FOUND", "No existe una cuenta con este email");

  // Invalidate previous unused codes for this user
  await db.passwordReset.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.passwordReset.create({
    data: {
      userId: user.id,
      email: email.toLowerCase(),
      code,
      expiresAt,
    },
  });

  // In production, send code via email. For now, return it so the UI can show it.
  return { code, email: email.toLowerCase() };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  if (!email || !code || !newPassword) {
    throw new AuthError("MISSING_FIELDS", "Email, codigo y nueva contrasena son requeridos");
  }
  if (newPassword.length < 8) {
    throw new AuthError("WEAK_PASSWORD", "La contrasena debe tener al menos 8 caracteres");
  }

  const reset = await db.passwordReset.findFirst({
    where: {
      email: email.toLowerCase(),
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!reset) throw new AuthError("INVALID_CODE", "Codigo invalido, expirado o ya utilizado");

  // Mark code as used
  await db.passwordReset.update({
    where: { id: reset.id },
    data: { used: true },
  });

  // Update password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.user.update({
    where: { id: reset.userId },
    data: { passwordHash },
  });

  // Delete all sessions for this user (force re-login)
  await db.session.deleteMany({ where: { userId: reset.userId } });

  return { success: true };
}
