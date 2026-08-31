import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const confessionId = Number(params.id);
  if (!Number.isInteger(confessionId)) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const senderNicknameRaw =
    typeof body?.senderNickname === "string" ? body.senderNickname.trim() : "";
  const senderNickname = senderNicknameRaw ? senderNicknameRaw : null;

  if (!message) {
    return NextResponse.json({ error: "Write something first." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }
  if (senderNickname && senderNickname.length > MAX_NICKNAME_LENGTH) {
    return NextResponse.json({ error: "Nickname's a bit too long." }, { status: 400 });
  }

  const confession = await prisma.confession.findUnique({
    where: { id: confessionId },
  });
  if (!confession) {
    return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
  }

  const reply = await prisma.reply.create({
    data: { message, senderNickname, confessionId },
  });

  return NextResponse.json(reply, { status: 201 });
}
