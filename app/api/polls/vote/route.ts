import { NextRequest, NextResponse } from "next/server";
import { POLL_VOTE_COOKIE } from "@/lib/poll";
import { castPollVote } from "@/lib/pollServer";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`poll-vote:${getClientKey(req)}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Slow down a little and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const optionId = Number(body?.optionId);
  if (!Number.isFinite(optionId)) {
    return NextResponse.json({ error: "Pick an option first." }, { status: 400 });
  }

  const result = await castPollVote(optionId, req.cookies.get(POLL_VOTE_COOKIE)?.value);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const res = NextResponse.json(result.response);
  res.cookies.set(POLL_VOTE_COOKIE, result.cookieValue, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
