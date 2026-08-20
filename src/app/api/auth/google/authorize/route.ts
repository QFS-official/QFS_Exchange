import { NextRequest, NextResponse } from "next/server";

/*
  Google OAuth 2.0 - Authorization Endpoint
  
  Redirects the user to Google's consent screen.
  After the user grants permission, Google redirects back to /api/auth/google/callback.
*/

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // Determine the base URL for the callback
  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Build Google's OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
