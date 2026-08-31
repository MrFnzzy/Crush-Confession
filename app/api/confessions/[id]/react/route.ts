import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const confession = await prisma.confession
    .update({
      where: { id },
      data: { relateCount: { increment: 1 } },
    })
    .catch(() => null);

  if (!confession) {
    return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
  }

  return NextResponse.json({ relateCount: confession.relateCount });
}
