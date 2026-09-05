import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";
import { getPollForAdmin, setPollStatus } from "@/lib/pollServer";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const active = body?.active === true;
  const showOnShutdown = body?.showOnShutdown === true;

  const result = await setPollStatus(active, showOnShutdown);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const poll = await getPollForAdmin();
  return NextResponse.json(poll);
}
