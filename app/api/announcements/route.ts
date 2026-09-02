import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isAdminFromCookieValue } from "@/lib/auth";
import { MAX_ANNOUNCEMENT_LENGTH } from "@/lib/announcer";

function requireAdmin(req: NextRequest) {
  return isAdminFromCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Write something to announce first." }, { status: 400 });
  }
  if (message.length > MAX_ANNOUNCEMENT_LENGTH) {
    return NextResponse.json(
      { error: `Keep it under ${MAX_ANNOUNCEMENT_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const announcement = await prisma.announcement.create({ data: { message } });
    return NextResponse.json(announcement, { status: 201 });
  } catch (err) {
    console.error("Failed to create announcement:", err);
    return NextResponse.json({ error: "Couldn't send that. Please try again." }, { status: 500 });
  }
}
