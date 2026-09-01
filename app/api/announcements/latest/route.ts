import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ANNOUNCEMENT_FRESH_WINDOW_MS } from "@/lib/announcer";

// Public + unauthenticated on purpose: this is what every visitor's tab
// polls to know whether to pop up a banner. Only ever returns an
// announcement created within the freshness window — once that window
// passes, this goes back to returning null, same as if nothing was ever
// sent. There's no history here and nothing is marked "read"; each tab
// tracks what it's already shown on its own (see LiveAnnouncer.tsx).
export async function GET() {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { createdAt: { gt: new Date(Date.now() - ANNOUNCEMENT_FRESH_WINDOW_MS) } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcement });
  } catch (err) {
    console.error("Failed to load latest announcement:", err);
    return NextResponse.json({ announcement: null });
  }
}
