import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, checkAdminPassword, getAdminCookieValue } from "@/lib/auth";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Deliberately strict: this guards the only privileged endpoint in the
  // app, so a slow, obvious lockout is worth more here than convenience.
  const { allowed, retryAfterSeconds } = rateLimit(
    `admin-login:${getClientKey(req)}`,
    5,
    5 * 60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, getAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
