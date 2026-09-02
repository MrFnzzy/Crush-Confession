export const MAX_ANNOUNCEMENT_LENGTH = 200;

/** How often browsing tabs check for a new announcement. Kept snappy
 * (not as slow as the presence heartbeat) since this is meant to feel
 * "live" — a visitor shouldn't wait long after an admin sends one. */
export const ANNOUNCEMENT_POLL_MS = 3_000;

/** How long after being created an announcement is still handed out to
 * polling clients. This is what makes it "one-time and live" rather than
 * a persistent banner: a tab that starts polling after this window has
 * passed will simply never see it, the same as if it never happened. */
export const ANNOUNCEMENT_FRESH_WINDOW_MS = 20_000;

const MIN_DISPLAY_MS = 5_000;
const MAX_DISPLAY_MS = 12_000;
const MS_PER_CHARACTER = 70;

/** On-screen time for the popup once a client shows it: 5s minimum,
 * longer for longer messages (roughly reading speed), capped so a
 * near-max-length message doesn't sit around forever. */
export function announcementDisplayMs(message: string): number {
  const scaled = MIN_DISPLAY_MS + message.trim().length * MS_PER_CHARACTER;
  return Math.min(MAX_DISPLAY_MS, Math.max(MIN_DISPLAY_MS, scaled));
}
