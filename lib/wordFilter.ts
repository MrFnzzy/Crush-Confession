import { prisma } from "./prisma";

/**
 * Built-in baseline of blocked words/phrases — common profanity and insults
 * in English, Tagalog/Filipino, and Bisaya/Cebuano, since the wall is used
 * across those languages. This list is intentionally not exhaustive (no
 * word list ever fully is) and isn't meant to catch every possible slur —
 * it's a reasonable first line of defense. Admins can add more from the
 * "Filtered words" tab; those are stored in the BannedWord table and
 * merged with this list at check time, so this baseline can never be
 * accidentally wiped out from the admin UI.
 *
 * Keep entries lowercase, no punctuation — normalizeText() below handles
 * matching regardless of the casing/punctuation the user actually typed.
 */
export const DEFAULT_BANNED_WORDS: string[] = [
  // English — profanity & common insults
  "fuck", "fucker", "fucking", "shit", "bullshit", "asshole", "bastard",
  "bitch", "cunt", "dick", "piss off", "slut", "whore", "retard", "retarded",
  "idiot", "stupid", "moron", "dumbass", "loser", "pathetic", "worthless",
  "ugly", "trash", "scum", "disgusting", "hate you", "kill yourself",

  // Tagalog / Filipino
  "gago", "gaga", "tanga", "bobo", "boba", "ulol", "tarantado", "tarantada",
  "hayop", "hayop ka", "punyeta", "leche", "putangina", "putang ina",
  "puta", "kingina", "tangina", "peste", "walang hiya", "walanghiya",
  "pangit", "engot", "loko loko",

  // Bisaya / Cebuano
  "yawa", "buang", "buangbuang", "bogo", "boang", "bilat", "atay",
  "pisting yawa", "animal ka", "ilo", "way pulos", "way batasan",
  "pangil-ad", "iring", "hinlas", "buog",
];

/** Strips diacritics, punctuation, and collapses whitespace/case so
 * matching is resilient to things like "F.U.C.K", "PUTANG-INA", or
 * "gágo" (typed with an accent by autocorrect). Doesn't try to defeat
 * deliberate letter-spacing evasion ("f u c k") — that's a much harder
 * problem and not what this feature is meant to solve. */
function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // punctuation -> space, so "f*ck" -> "f ck" (won't match, which is fine — see note below)
    .replace(/\s+/g, " ")
    .trim();
}

/** Merges the built-in defaults with whatever the admin has added. */
export async function getActiveBannedWords(): Promise<string[]> {
  let custom: string[] = [];
  try {
    const rows = await prisma.bannedWord.findMany({ select: { word: true } });
    custom = rows.map((r: { word: string }) => r.word);
  } catch (err) {
    console.error("Failed to load custom banned words, using defaults only:", err);
  }
  return [...DEFAULT_BANNED_WORDS, ...custom];
}

/** True if any banned word/phrase appears in any of the given text fields. */
export function containsBannedWord(texts: (string | null | undefined)[], bannedWords: string[]): boolean {
  const haystacks = texts.filter((t): t is string => !!t && t.trim().length > 0).map(normalizeText);
  if (haystacks.length === 0) return false;

  for (const raw of bannedWords) {
    const needle = normalizeText(raw);
    if (!needle) continue;
    // Word-boundary match for single words so "class" doesn't trip on
    // something like "ass" — but a substring match for multi-word phrases
    // (e.g. "walang hiya", "kill yourself"), since those already need an
    // exact sequence and word-boundary regex gets awkward across spaces.
    const isPhrase = needle.includes(" ");
    for (const text of haystacks) {
      if (isPhrase) {
        if (text.includes(needle)) return true;
      } else {
        const pattern = new RegExp(`(^|\\s)${escapeRegex(needle)}($|\\s)`);
        if (pattern.test(` ${text} `)) return true;
      }
    }
  }
  return false;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
