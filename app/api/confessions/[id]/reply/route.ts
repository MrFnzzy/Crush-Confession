import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { containsBannedWord, getActiveBannedWords } from "@/lib/wordFilter";
import { isAllowedGifUrl } from "@/lib/gif";

const MAX_MESSAGE_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { allowed, retryAfterSeconds } = rateLimit(
    `post-reply:${getClientKey(req)}`,
    10,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "You're replying a bit fast — try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const confessionId = Number(params.id);
  if (!Number.isInteger(confessionId) || confessionId <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const senderNicknameRaw =
    typeof body.senderNickname === "string" ? body.senderNickname.trim() : "";
  const senderNickname = senderNicknameRaw ? senderNicknameRaw : null;
  const gifUrlRaw = typeof body.gifUrl === "string" ? body.gifUrl.trim() : "";
  if (gifUrlRaw && !isAllowedGifUrl(gifUrlRaw)) {
    return NextResponse.json({ error: "That gif link isn't supported." }, { status: 400 });
  }
  const gifUrl = gifUrlRaw ? gifUrlRaw : null;

  if (!message && !gifUrl) {
    return NextResponse.json({ error: "Write something or attach a gif first." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Keep it under ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (senderNickname && senderNickname.length > MAX_NICKNAME_LENGTH) {
    return NextResponse.json(
      { error: `Keep the nickname under ${MAX_NICKNAME_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const bannedWords = await getActiveBannedWords();
  if (containsBannedWord([message, senderNickname], bannedWords)) {
    return NextResponse.json(
      { error: "That reply contains language we don't allow here. Please rewrite it.", reason: "blocked_word" },
      { status: 400 }
    );
  }

  try {
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    });
    if (!confession) {
      return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
    }

    const reply = await prisma.reply.create({
      data: { message, senderNickname, gifUrl, confessionId },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (err) {
    console.error("Failed to create reply:", err);
    return NextResponse.json(
      { error: "Couldn't save that. Please try again in a moment." },
      { status: 500 }
    );
  }
}
