import { unstable_cache, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  MAX_POLL_OPTIONS,
  MAX_POLL_OPTION_LENGTH,
  MAX_POLL_QUESTION_LENGTH,
  MIN_POLL_OPTIONS,
  PollResponse,
  PollStatus,
  buildVoteCookieValue,
  parseVoteCookieValue,
} from "@/lib/poll";

const POLL_TAG = "poll";

// Cached the same way SiteSettings/BackgroundMusic are: reads come from
// Next's Data Cache and only actually hit Postgres again once something
// calls revalidateTag(POLL_TAG) below (a save, a status flip, a push, or
// a vote). That keeps every tab's ~4s poll-status check cheap even with
// several tabs open on the wall.
const getCachedPoll = unstable_cache(
  async () => {
    try {
      return await prisma.poll.findUnique({
        where: { id: 1 },
        include: { options: { orderBy: { id: "asc" } } },
      });
    } catch (err) {
      console.error("Failed to load poll:", err);
      return null;
    }
  },
  ["poll"],
  { tags: [POLL_TAG] }
);

function toStatus(record: Awaited<ReturnType<typeof getCachedPoll>>): PollStatus {
  if (!record || !record.question || record.options.length === 0) return null;
  const options = record.options.map((o: { id: number; text: string; votes: number }) => ({
    id: o.id,
    text: o.text,
    votes: o.votes,
  }));
  return {
    question: record.question,
    options,
    totalVotes: options.reduce((sum: number, o: { votes: number }) => sum + o.votes, 0),
    active: record.active,
    showOnShutdown: record.showOnShutdown,
    pushVersion: record.pushVersion,
  };
}

/** Builds the response shape every reader (wall banner, shutdown poll,
 * popup, the vote endpoint itself) needs: the current poll plus whether
 * *this* browser has already voted on it, derived from its vote cookie. */
export async function getPollResponse(voteCookieRaw: string | undefined): Promise<PollResponse> {
  const record = await getCachedPoll();
  const poll = toStatus(record);
  if (!poll || !record) return { poll, hasVoted: false, votedOptionId: null };

  const parsed = parseVoteCookieValue(voteCookieRaw);
  if (!parsed || parsed.revision !== record.revision) {
    return { poll, hasVoted: false, votedOptionId: null };
  }
  const stillExists = poll.options.some((o) => o.id === parsed.optionId);
  return { poll, hasVoted: stillExists, votedOptionId: stillExists ? parsed.optionId : null };
}

/** Full record (including revision, which visitor-facing code never
 * needs to see) for the admin editor. */
export async function getPollForAdmin() {
  const record = await getCachedPoll();
  return {
    question: record?.question ?? "",
    options:
      record?.options.map((o: { id: number; text: string; votes: number }) => ({ id: o.id, text: o.text, votes: o.votes })) ?? [],
    active: record?.active ?? false,
    showOnShutdown: record?.showOnShutdown ?? false,
    pushVersion: record?.pushVersion ?? 0,
    totalVotes: record?.options.reduce((sum: number, o: { votes: number }) => sum + o.votes, 0) ?? 0,
  };
}

export type SavePollResult = { ok: true } | { ok: false; error: string };

/** Replaces the question/options wholesale and bumps `revision`, which is
 * what invalidates everyone's existing vote cookies — a genuinely new
 * poll means everyone gets to vote again, not "still locked out from the
 * last one". Votes reset to zero as a natural consequence of recreating
 * the option rows. Leaves `active`/`showOnShutdown` untouched so editing
 * wording doesn't silently take a live poll down or vice versa. */
export async function savePollQuestion(question: string, optionTexts: string[]): Promise<SavePollResult> {
  const trimmedQuestion = question.trim();
  const trimmedOptions = optionTexts.map((o) => o.trim()).filter(Boolean);

  if (!trimmedQuestion) return { ok: false, error: "Write a question first." };
  if (trimmedQuestion.length > MAX_POLL_QUESTION_LENGTH) {
    return { ok: false, error: `Keep the question under ${MAX_POLL_QUESTION_LENGTH} characters.` };
  }
  if (trimmedOptions.length < MIN_POLL_OPTIONS) {
    return { ok: false, error: `Add at least ${MIN_POLL_OPTIONS} options.` };
  }
  if (trimmedOptions.length > MAX_POLL_OPTIONS) {
    return { ok: false, error: `Keep it to ${MAX_POLL_OPTIONS} options or fewer.` };
  }
  if (trimmedOptions.some((o) => o.length > MAX_POLL_OPTION_LENGTH)) {
    return { ok: false, error: `Keep each option under ${MAX_POLL_OPTION_LENGTH} characters.` };
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.poll.findUnique({ where: { id: 1 } });
      await tx.poll.upsert({
        where: { id: 1 },
        create: { id: 1, question: trimmedQuestion, revision: 1 },
        update: { question: trimmedQuestion, revision: (existing?.revision ?? 0) + 1 },
      });
      await tx.pollOption.deleteMany({ where: { pollId: 1 } });
      await tx.pollOption.createMany({ data: trimmedOptions.map((text) => ({ pollId: 1, text })) });
    });
    revalidateTag(POLL_TAG);
    return { ok: true };
  } catch (err) {
    console.error("Failed to save poll:", err);
    return { ok: false, error: "Couldn't save that. Please try again." };
  }
}

export async function setPollStatus(active: boolean, showOnShutdown: boolean): Promise<SavePollResult> {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: 1 } });
    if (!existing || !existing.question) {
      return { ok: false, error: "Write a question and options before opening the poll." };
    }
    await prisma.poll.update({ where: { id: 1 }, data: { active, showOnShutdown } });
    revalidateTag(POLL_TAG);
    return { ok: true };
  } catch (err) {
    console.error("Failed to update poll status:", err);
    return { ok: false, error: "Couldn't save that. Please try again." };
  }
}

/** Bumps pushVersion so every open tab's popup check (comparing against
 * the version it last dismissed) fires again — including tabs that had
 * already closed a previous push of the same poll. */
export async function pushPollPopup(): Promise<SavePollResult> {
  try {
    const existing = await prisma.poll.findUnique({ where: { id: 1 } });
    if (!existing || !existing.question || !existing.active) {
      return { ok: false, error: "Open the poll for voting before pushing it." };
    }
    await prisma.poll.update({ where: { id: 1 }, data: { pushVersion: { increment: 1 } } });
    revalidateTag(POLL_TAG);
    return { ok: true };
  } catch (err) {
    console.error("Failed to push poll:", err);
    return { ok: false, error: "Couldn't push that. Please try again." };
  }
}

export type CastVoteResult =
  | { ok: true; response: PollResponse; cookieValue: string }
  | { ok: false; error: string; status: number };

export async function castPollVote(optionId: number, voteCookieRaw: string | undefined): Promise<CastVoteResult> {
  const record = await prisma.poll.findUnique({ where: { id: 1 }, include: { options: true } });
  if (!record || !record.question || !record.active) {
    return { ok: false, error: "This poll isn't open for voting.", status: 400 };
  }
  const option = record.options.find((o: { id: number }) => o.id === optionId);
  if (!option) return { ok: false, error: "That option doesn't exist.", status: 400 };

  const parsed = parseVoteCookieValue(voteCookieRaw);
  if (parsed && parsed.revision === record.revision) {
    // Already voted on this exact poll — don't double count, just hand
    // back current results as if the vote had "worked".
    const response = await getPollResponse(voteCookieRaw);
    return { ok: true, response, cookieValue: voteCookieRaw ?? "" };
  }

  try {
    await prisma.pollOption.update({ where: { id: optionId }, data: { votes: { increment: 1 } } });
    revalidateTag(POLL_TAG);
    const cookieValue = buildVoteCookieValue(record.revision, optionId);
    const response = await getPollResponse(cookieValue);
    return { ok: true, response, cookieValue };
  } catch (err) {
    console.error("Failed to cast poll vote:", err);
    return { ok: false, error: "Couldn't record that vote. Please try again.", status: 500 };
  }
}
