import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { containsBannedWord, getActiveBannedWords } from "@/lib/wordFilter";
import { isAllowedGifUrl } from "@/lib/gif";
import { redactConfessionForGuessing } from "@/lib/guess";
import { getSiteSettings } from "@/lib/siteSettings";

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
    // "Guess who" confessions never send the real crushName to the client —
    // the name only ever leaves the server via the /guess endpoint, and
    // only once someone actually gets it right.
    return NextResponse.json(confessions.map(redactConfessionForGuessing));
  } catch (err) {
    console.error("Failed to fetch confessions:", err);
    return NextResponse.json(
      { error: "Couldn't load the wall right now. Please try again shortly." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Cheap: reads the cached flag from lib/siteSettings.ts, not the database
  // (see that file's comments) — so this check doesn't add DB load either.
  const { shutdown } = await getSiteSettings();
  if (shutdown) {
    return NextResponse.json({ error: "The wall is temporarily closed." }, { status: 503 });
  }

  const { allowed, retryAfterSeconds } = rateLimit(
    `post-confession:${getClientKey(req)}`,
    5,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "You're posting a bit fast — take a breath and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const crushName = typeof body.crushName === "string" ? body.crushName.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const senderNicknameRaw =
    typeof body.senderNickname === "string" ? body.senderNickname.trim() : "";
  const senderNickname = senderNicknameRaw ? senderNicknameRaw : null;
  const guessEnabled = body.guessEnabled === true;
  const gifUrlRaw = typeof body.gifUrl === "string" ? body.gifUrl.trim() : "";
  if (gifUrlRaw && !isAllowedGifUrl(gifUrlRaw)) {
    return NextResponse.json({ error: "That gif link isn't supported." }, { status: 400 });
  }
  const gifUrl = gifUrlRaw ? gifUrlRaw : null;

  if (!crushName || !message) {
    return NextResponse.json(
      { error: "Both a name and a message are required." },
      { status: 400 }
    );
  }
  if (crushName.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Keep the name under ${MAX_NAME_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Keep the message under ${MAX_MESSAGE_LENGTH} characters.` },
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
  if (containsBannedWord([crushName, message, senderNickname], bannedWords)) {
    return NextResponse.json(
      { error: "That message contains language we don't allow here. Please rewrite it.", reason: "blocked_word" },
      { status: 400 }
    );
  }

  try {
    const confession = await prisma.confession.create({
      data: { crushName, message, senderNickname, gifUrl, guessEnabled },
    });
    return NextResponse.json(redactConfessionForGuessing({ ...confession, replies: [] as never[] }), { status: 201 });
  } catch (err) {
    console.error("Failed to create confession:", err);
    return NextResponse.json(
      { error: "Couldn't save that. Please try again in a moment." },
      { status: 500 }
    );
  }
}
