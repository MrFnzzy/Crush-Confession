import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const confessionId = Number(params.id);
  if (!Number.isInteger(confessionId) || confessionId < 1) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }

  const confession = await prisma.confession.findFirst({
    where: { id: confessionId, isDeleted: false },
  });
  if (!confession) {
    return NextResponse.json({ error: "That confession is unavailable." }, { status: 404 });
  }

  const reply = await prisma.reply.create({
    data: { message, confessionId },
  });

  return NextResponse.json(reply, { status: 201 });
}
