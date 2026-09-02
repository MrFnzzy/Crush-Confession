import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { PRESENCE_WINDOW_MS } from "@/lib/presence";

// isAdmin() reads a cookie, which already makes Next.js treat this route
// as dynamic — but that's an implicit side effect of an auth check, not
// a guarantee. Stated explicitly so this can't silently start being
// cached again if the auth check ever changes.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const count = await prisma.presence.count({
      where: { lastSeen: { gt: new Date(Date.now() - PRESENCE_WINDOW_MS) } },
    });
    return NextResponse.json({ count });
  } catch (err) {
    console.error("Failed to count live presence:", err);
    return NextResponse.json({ error: "Couldn't load live visitors." }, { status: 503 });
  }
}
