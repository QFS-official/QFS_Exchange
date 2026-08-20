import { NextRequest, NextResponse } from "next/server";
import { getMe } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("gcrm_session")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });
    const user = await getMe(token);
    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.cookies.set("gcrm_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return res;
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
