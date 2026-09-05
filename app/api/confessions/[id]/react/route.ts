import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientKey, rateLimit } from "@/lib/rateLimit";
import { isReactionType, REACTION_FIELD, type ReactionType } from "@/lib/reactions";

/**
 * A visitor can hold at most one reaction per confession at a time, same as
 * Facebook. The client tracks which type (if any) it previously picked in
 * localStorage and sends both the new type and the previous one so the
 * server can move one tally from the old bucket to the new one — there's
 * no per-visitor row here, just the same "trust the client's own local
 * state" pattern the rest of this anonymous wall already uses (see the old
 * relate button, guess-who, viewed-ids, etc).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { allowed, retryAfterSeconds } = rateLimit(
    `react:${getClientKey(req)}`,
    30,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many taps — slow down a little." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid confession." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const rawType = body?.type;
  const rawPrevious = body?.previousType;

  // type may be null (removing a reaction entirely); previousType may be
  // null (the visitor had no reaction before).
  const type: ReactionType | null = rawType === null ? null : isReactionType(rawType) ? rawType : undefined as never;
  const previousType: ReactionType | null =
    rawPrevious === null ? null : isReactionType(rawPrevious) ? rawPrevious : undefined as never;

  if (type === undefined || previousType === undefined) {
    return NextResponse.json({ error: "Invalid reaction type." }, { status: 400 });
  }
  if (type === previousType) {
    // No-op — nothing changed, just report current counts back.
    const current = await prisma.confession.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
    return NextResponse.json(toCounts(current));
  }

  const data: Record<string, { increment: number }> = {};
  if (previousType) {
    data[REACTION_FIELD[previousType]] = { increment: -1 };
  }
  if (type) {
    data[REACTION_FIELD[type]] = { increment: 1 };
  }
  const relateDelta = (type ? 1 : 0) - (previousType ? 1 : 0);
  if (relateDelta !== 0) {
    data.relateCount = { increment: relateDelta };
  }

  try {
    const confession = await prisma.confession.update({ where: { id }, data });
    return NextResponse.json(toCounts(confession));
  } catch (err) {
    console.error("Failed to react to confession:", err);
    return NextResponse.json({ error: "That confession is gone." }, { status: 404 });
  }
}

function toCounts(confession: {
  relateCount: number;
  reactionLike: number;
  reactionLove: number;
  reactionHaha: number;
  reactionWow: number;
  reactionSad: number;
  reactionAngry: number;
  reactionCrying: number;
}) {
  return {
    relateCount: confession.relateCount,
    like: confession.reactionLike,
    love: confession.reactionLove,
    haha: confession.reactionHaha,
    wow: confession.reactionWow,
    sad: confession.reactionSad,
    angry: confession.reactionAngry,
    crying: confession.reactionCrying,
  };
}
