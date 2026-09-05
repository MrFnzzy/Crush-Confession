import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";
import { getPollForAdmin, savePollQuestion } from "@/lib/pollServer";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const poll = await getPollForAdmin();
  return NextResponse.json(poll);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question : "";
  const options = Array.isArray(body?.options) ? body.options.filter((o: unknown) => typeof o === "string") : [];

  const result = await savePollQuestion(question, options);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const poll = await getPollForAdmin();
  return NextResponse.json(poll);
}
