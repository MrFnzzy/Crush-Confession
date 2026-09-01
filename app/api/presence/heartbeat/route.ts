import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { PRESENCE_COOKIE, PRESENCE_WINDOW_MS } from "@/lib/presence";
import { resolvePresenceSessionId } from "@/lib/presenceServer";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`presence-heartbeat:${getClientKey(req)}`, 20, 60_000);
  if (!allowed) {
    // Heartbeats are frequent and low-stakes; just skip this one silently
    // instead of surfacing an error to the tab that sent it.
    return NextResponse.json({ ok: false });
  }

  const cookieStore = cookies();
  const { sessionId, isNew } = resolvePresenceSessionId(cookieStore.get(PRESENCE_COOKIE)?.value);

  try {
    await prisma.presence.upsert({
      where: { sessionKey: sessionId },
      update: { lastSeen: new Date() },
      create: { sessionKey: sessionId },
    });

    // Opportunistic cleanup of long-stale rows (e.g. tabs that closed
    // without their "leave" beacon making it out). Cheap at this scale
    // and keeps the table from growing forever.
    await prisma.presence
      .deleteMany({ where: { lastSeen: { lt: new Date(Date.now() - PRESENCE_WINDOW_MS * 4) } } })
      .catch(() => {});

    const response = NextResponse.json({ ok: true });
    if (isNew) {
      response.cookies.set(PRESENCE_COOKIE, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err) {
    console.error("Presence heartbeat failed:", err);
    return NextResponse.json({ ok: false });
  }
}
