import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PRESENCE_COOKIE } from "@/lib/presence";

// Called via navigator.sendBeacon when a tab is closing, so the live
// count drops immediately instead of waiting out the staleness window.
// Best-effort only — if the beacon never makes it out, the heartbeat
// cleanup in /api/presence/heartbeat still expires the row eventually.
export async function POST() {
  const sessionId = cookies().get(PRESENCE_COOKIE)?.value;
  if (sessionId) {
    await prisma.presence.delete({ where: { sessionKey: sessionId } }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
