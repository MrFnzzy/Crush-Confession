import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";
import { getPollForAdmin, pushPollPopup } from "@/lib/pollServer";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const result = await pushPollPopup();
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const poll = await getPollForAdmin();
  return NextResponse.json(poll);
}
