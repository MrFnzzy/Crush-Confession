import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 2000;

export async function GET() {
  const confessions = await prisma.confession.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      replies: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(
    confessions.map((confession) => ({
      ...confession,
      number: confession.id,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fromName = typeof body?.fromName === "string" ? body.fromName.trim() : "";
  const toName = typeof body?.toName === "string" ? body.toName.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!fromName || !toName || !message) {
    return NextResponse.json(
      { error: "Your nickname, your crush's name, and a message are required." },
      { status: 400 }
    );
  }

  if (
    fromName.length > MAX_NAME_LENGTH ||
    toName.length > MAX_NAME_LENGTH ||
    message.length > MAX_MESSAGE_LENGTH
  ) {
    return NextResponse.json({ error: "That's a bit too long." }, { status: 400 });
  }

  const confession = await prisma.confession.create({
    data: { fromName, toName, message },
  });

  return NextResponse.json(
    { ...confession, number: confession.id },
    { status: 201 }
  );
}
