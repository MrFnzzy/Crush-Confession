import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NICKNAME_LENGTH = 40;

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort");
  try {
    const confessions = await prisma.confession.findMany({
      orderBy:
        sort === "top" ? [{ relateCount: "desc" }, { id: "desc" }] : { id: "desc" },
      include: {
        replies: { orderBy: { id: "asc" } },
      },
    });
    return NextResponse.json(confessions);
  } catch (err) {
    console.error("Failed to fetch confessions:", err);
    return NextResponse.json(
      { error: "Couldn't load the wall. Check the server's database connection." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const crushName = typeof body?.crushName === "string" ? body.crushName.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const senderNicknameRaw =
    typeof body?.senderNickname === "string" ? body.senderNickname.trim() : "";
  const senderNickname = senderNicknameRaw ? senderNicknameRaw : null;

  if (!crushName || !message) {
    return NextResponse.json(
      { error: "Both a name and a message are required." },
      { status: 400 }
    );
  }
  if (crushName.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }
  if (senderNickname && senderNickname.length > MAX_NICKNAME_LENGTH) {
    return NextResponse.json({ error: "Nickname's a bit too long." }, { status: 400 });
  }

  try {
    const confession = await prisma.confession.create({
      data: { crushName, message, senderNickname },
    });
    return NextResponse.json(confession, { status: 201 });
  } catch (err) {
    console.error("Failed to create confession:", err);
    return NextResponse.json(
      { error: "Couldn't save that. Check the server's database connection." },
      { status: 500 }
    );
  }
}
