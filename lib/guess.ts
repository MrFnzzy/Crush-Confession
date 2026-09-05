/**
 * "Guess who it is" mode: the sender can hide the crushName from the wall
 * and let readers try to guess it. To make that a real guessing game (not
 * just a CSS blur someone can inspect-element around), the real name must
 * never be sent to the browser for these confessions — only a length hint
 * for the underscores UI. The name only ever leaves the server via the
 * /guess endpoint's response, and only when the guess is correct.
 */

type ConfessionLike = {
  crushName: string;
  guessEnabled: boolean;
  [key: string]: unknown;
};

export function redactConfessionForGuessing<T extends ConfessionLike>(
  confession: T
): Omit<T, "crushName"> & { crushName: string | null; crushNameLength: number } {
  if (!confession.guessEnabled) {
    return { ...confession, crushNameLength: confession.crushName.length };
  }
  const { crushName, ...rest } = confession;
  return { ...(rest as T), crushName: null, crushNameLength: crushName.length };
}

/** Normalizes a name/guess for comparison: trims, lowercases, strips
 * accents/diacritics and punctuation, and collapses inner whitespace —
 * so "Niño", "nino", and " NINO " all match, but a wildly different
 * spelling still won't. */
export function normalizeGuess(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCorrectGuess(guess: string, crushName: string): boolean {
  const normalizedGuess = normalizeGuess(guess);
  if (!normalizedGuess) return false;
  return normalizedGuess === normalizeGuess(crushName);
}
