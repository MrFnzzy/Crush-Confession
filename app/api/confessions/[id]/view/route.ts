import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

// Impression counter: fired once per card per browser (deduped client-side
// via localStorage, same pattern as the "relate" reaction) when the card
// actually scrolls into view. This is a soft/anonymous counter, not an
// analytics system — no IP or identity is stored, just a tally per
// confession, and it's shown to admins only.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { allowed } = rateLimit(`view:${getClientKey(req)}`, 120, 60_000);
  if (!allowed) {
    return NextResponse.json({ ok: false });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  try {
    const confession = await prisma.confession.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    return NextResponse.json({ viewCount: confession.viewCount });
  } catch {
    // A missing confession (e.g. deleted mid-scroll) isn't worth logging
    // loudly — just no-op.
    return NextResponse.json({ ok: false });
  }
}
