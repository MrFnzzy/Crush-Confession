import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { isCorrectGuess } from "@/lib/guess";

const MAX_GUESS_LENGTH = 80;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Generous but real limit — enough for genuine guessing, not enough for
  // a script to brute-force short names.
  const { allowed, retryAfterSeconds } = rateLimit(
    `guess:${getClientKey(req)}`,
    20,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many guesses — take a breath and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const guess = typeof body?.guess === "string" ? body.guess.trim() : "";
  if (!guess) {
    return NextResponse.json({ error: "Type a guess first." }, { status: 400 });
  }
  if (guess.length > MAX_GUESS_LENGTH) {
    return NextResponse.json({ error: "That guess is way too long." }, { status: 400 });
  }

  const confession = await prisma.confession.findUnique({
    where: { id },
    select: { crushName: true, guessEnabled: true },
  });
  if (!confession) {
    return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
  }
  if (!confession.guessEnabled) {
    return NextResponse.json({ error: "This confession isn't a guessing game." }, { status: 400 });
  }

  const correct = isCorrectGuess(guess, confession.crushName);
  return NextResponse.json(
    correct ? { correct: true, crushName: confession.crushName } : { correct: false }
  );
}
