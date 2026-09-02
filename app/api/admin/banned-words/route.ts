import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";

const MAX_WORD_LENGTH = 60;

function requireAdmin(req: NextRequest) {
  const cookieValue = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return isAdminFromCookieValue(cookieValue);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const words = await prisma.bannedWord.findMany({ orderBy: { word: "asc" } });
  return NextResponse.json(words);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const wordRaw = typeof body?.word === "string" ? body.word.trim().toLowerCase() : "";

  if (!wordRaw) {
    return NextResponse.json({ error: "Enter a word or phrase to block." }, { status: 400 });
  }
  if (wordRaw.length > MAX_WORD_LENGTH) {
    return NextResponse.json({ error: `Keep it under ${MAX_WORD_LENGTH} characters.` }, { status: 400 });
  }

  try {
    const created = await prisma.bannedWord.create({ data: { word: wordRaw } });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "That word is already on the list." }, { status: 409 });
    }
    console.error("Failed to add banned word:", err);
    return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
  }
}
