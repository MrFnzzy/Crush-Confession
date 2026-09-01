import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { allowed, retryAfterSeconds } = rateLimit(
    `react:${getClientKey(req)}`,
    30,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many taps — slow down a little." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  try {
    const confession = await prisma.confession.update({
      where: { id },
      data: { relateCount: { increment: 1 } },
    });
    return NextResponse.json({ relateCount: confession.relateCount });
  } catch (err) {
    console.error("Failed to react to confession:", err);
    return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
  }
}
