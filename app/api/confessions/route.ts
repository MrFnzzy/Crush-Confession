import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;

export async function GET() {
  const confessions = await prisma.confession.findMany({
    orderBy: { id: "asc" },
    include: {
      replies: { orderBy: { id: "asc" } },
    },
  });
  return NextResponse.json(confessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const crushName = typeof body?.crushName === "string" ? body.crushName.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!crushName || !message) {
    return NextResponse.json(
      { error: "Both a name and a message are required." },
      { status: 400 }
    );
  }
  if (crushName.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }

  const confession = await prisma.confession.create({
    data: { crushName, message },
  });

  return NextResponse.json(confession, { status: 201 });
}
