import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

/*
  Google OAuth 2.0 - Callback Endpoint
  
  1. Receives the authorization code from Google
  2. Exchanges it for access_token + id_token
  3. Fetches the user's Google profile
  4. Creates or links the account
  5. Sets a session cookie and redirects to the app
*/

export const dynamic = "force-dynamic";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:3000"}/?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:3000"}/?auth_error=no_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${process.env.RAILWAY_PUBLIC_DOMAIN || "http://localhost:3000"}/?auth_error=not_configured`);
  }

  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  try {
    // Step 1: Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Google OAuth] Token exchange failed:", errBody);
      return NextResponse.redirect(`${baseUrl}/?auth_error=token_exchange_failed`);
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Step 2: Fetch user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      console.error("[Google OAuth] Failed to fetch user info");
      return NextResponse.redirect(`${baseUrl}/?auth_error=user_info_failed`);
    }

    const googleUser: GoogleUserInfo = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/?auth_error=no_email`);
    }

    // Step 3: Find or create user
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (user) {
      // Link Google account if not already linked
      const existingLink = await prisma.socialAccount.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: googleUser.id } },
      });
      if (!existingLink) {
        await prisma.socialAccount.create({
          data: { userId: user.id, provider: "google", providerAccountId: googleUser.id },
        });
      }
    } else {
      // Create new user
      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await hash(randomPassword, 10);
      const referralCode = generateReferralCode();

      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
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
        data: { userId: user.id, provider: "google", providerAccountId: googleUser.id },
      });
    }

    // Step 4: Create session
    const sessionToken = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Step 5: Set cookie and redirect to app
    const response = NextResponse.redirect(baseUrl);
    response.cookies.set("gcrm_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Google OAuth] Callback error:", msg);
    return NextResponse.redirect(`${baseUrl}/?auth_error=server_error`);
  }
}
