import { NextRequest, NextResponse } from "next/server";
import { POLL_VOTE_COOKIE } from "@/lib/poll";
import { getPollResponse } from "@/lib/pollServer";

export const dynamic = "force-dynamic";

// Public + unauthenticated: this is what the wall banner, the shutdown
// screen, and the push-popup all poll every few seconds to know what the
// live poll is, whether it's open, and whether this browser already
// voted on it.
export async function GET(req: NextRequest) {
  const response = await getPollResponse(req.cookies.get(POLL_VOTE_COOKIE)?.value);
  return NextResponse.json(response);
}
