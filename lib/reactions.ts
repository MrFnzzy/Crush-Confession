export const REACTION_TYPES = ["like", "love", "haha", "wow", "sad", "angry", "crying"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export function isReactionType(value: unknown): value is ReactionType {
  return typeof value === "string" && (REACTION_TYPES as readonly string[]).includes(value);
}

/** Maps a reaction type to its column on the Confession model. */
export const REACTION_FIELD: Record<ReactionType, string> = {
  like: "reactionLike",
  love: "reactionLove",
  haha: "reactionHaha",
  wow: "reactionWow",
  sad: "reactionSad",
  angry: "reactionAngry",
  crying: "reactionCrying",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
  crying: "😭",
};

export const REACTION_LABEL: Record<ReactionType, string> = {
  like: "like",
  love: "love",
  haha: "haha",
  wow: "wow",
  sad: "sad",
  angry: "angry",
  crying: "crying",
};

export type ReactionCounts = Record<ReactionType, number>;

export function totalReactions(counts: ReactionCounts): number {
  return REACTION_TYPES.reduce((sum, type) => sum + (counts[type] || 0), 0);
}
