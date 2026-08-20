import { NextRequest, NextResponse } from "next/server";
import { logout, getMe } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (token) await logout(token);
    const res = NextResponse.json({ success: true });
    res.cookies.set("gcrm_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
