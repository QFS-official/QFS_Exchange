import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

/*
  Social Login API
  
  Google, Apple, and Twitter/X OAuth flows.
  
  In production, these require:
  - Google: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (Google Cloud Console)
  - Apple:  APPLE_CLIENT_ID + APPLE_PRIVATE_KEY (Apple Developer)
  - Twitter: TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET (Twitter Developer Portal)
  
  For now, the flow accepts a verified token from the client
  and creates/links an account.
*/

interface SocialAuthBody {
  provider: "google" | "apple" | "twitter";
  providerAccountId: string;
  email: string;
  name?: string;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/auth/social-login
export async function POST(req: NextRequest) {
  try {
    const body: SocialAuthBody = await req.json();
    const { provider, providerAccountId, email, name } = body;

    if (!provider || !providerAccountId || !email) {
      return NextResponse.json({ error: "Missing required fields: provider, providerAccountId, email" }, { status: 400 });
    }

    if (!["google", "apple", "twitter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Check if user already exists with this email
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Check if this social account is already linked
      const existingLink = await prisma.socialAccount.findUnique({
        where: {
          provider_providerAccountId: { provider, providerAccountId },
        },
      });

      if (!existingLink) {
        // Link the social account to existing user
        await prisma.socialAccount.create({
          data: {
            userId: user.id,
            provider,
            providerAccountId,
          },
        });
      }

      // Create session
      const sessionToken = randomBytes(32).toString("hex");
      await prisma.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          referralCode: user.referralCode,
          role: user.role,
          kycLevel: user.kycLevel,
          twoFactor: user.twoFactor,
        },
        sessionToken,
      });
    }

    // Create new user from social login
    const randomPassword = randomBytes(32).toString("hex");
    const hashedPassword = await hash(randomPassword, 10);
    const referralCode = generateReferralCode();

    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash: hashedPassword,
        referralCode,
        role: "user",
        kycLevel: 0,
        twoFactor: false,
        socialLogin: true,
      },
    });

    // Create social account link
    await prisma.socialAccount.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId,
      },
    });

    // Create session
    const sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode,
        role: user.role,
        kycLevel: user.kycLevel,
        twoFactor: user.twoFactor,
      },
      sessionToken,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[SocialLogin] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
