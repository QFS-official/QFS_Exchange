import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "v25-i18n-themes-qr",
    staking: "fallback-ready",
    timestamp: new Date().toISOString(),
  });
}