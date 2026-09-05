export const MAX_POLL_QUESTION_LENGTH = 140;
export const MAX_POLL_OPTION_LENGTH = 60;
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;

/** How often tabs check for poll changes (new votes, a push, a status
 * flip). Snappier than the presence heartbeat since results and the
 * push-popup are meant to feel live. */
export const POLL_POLL_MS = 4_000;

/** The cookie that remembers which option a browser voted for, scoped to
 * a poll `revision` (see schema.prisma) so editing the question/options
 * clears everyone's vote automatically instead of them being silently
 * locked out forever. Not httpOnly: the vote itself is still only ever
 * counted server-side, but the client reads this to disable the ballot
 * without an extra round trip on first paint. */
export const POLL_VOTE_COOKIE = "unspoken_poll_vote";

/** sessionStorage key (per-tab, like the announcer) tracking the last
 * `pushVersion` this tab has dismissed the popup for. A tab that hasn't
 * dismissed anything defaults to 0, which is always less than a real
 * push (pushVersion starts at 0 and only increments on an actual push,
 * so the first push is version 1). */
export const POLL_PUSH_DISMISSED_KEY = "unspoken_poll_dismissed_push";

export type PollOptionData = { id: number; text: string; votes: number };

export type PollStatus = {
  question: string;
  options: PollOptionData[];
  totalVotes: number;
  active: boolean;
  showOnShutdown: boolean;
  pushVersion: number;
} | null;

export type PollResponse = {
  poll: PollStatus;
  hasVoted: boolean;
  votedOptionId: number | null;
};

export function buildVoteCookieValue(revision: number, optionId: number): string {
  return `${revision}.${optionId}`;
}

export function parseVoteCookieValue(raw: string | undefined): { revision: number; optionId: number } | null {
  if (!raw) return null;
  const [revPart, optPart] = raw.split(".");
  const revision = Number(revPart);
  const optionId = Number(optPart);
  if (!Number.isFinite(revision) || !Number.isFinite(optionId)) return null;
  return { revision, optionId };
}
