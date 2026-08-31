"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";

type Reply = {
  id: number;
  message: string;
  senderNickname: string | null;
  createdAt: string;
};

type Confession = {
  id: number;
  crushName: string;
  message: string;
  senderNickname: string | null;
  relateCount: number;
  createdAt: string;
  replies: Reply[];
};

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [secs, label] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
}

const RELATED_KEY = "unspoken_related_ids";
const MAX_REPLY_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;

function getRelatedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RELATED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Private browsing, storage disabled, corrupted value — any of these
    // should degrade gracefully rather than break the button.
    return [];
  }
}

function saveRelatedId(id: number) {
  if (typeof window === "undefined") return;
  try {
    const ids = getRelatedIds();
    window.localStorage.setItem(RELATED_KEY, JSON.stringify([...ids, id]));
  } catch {
    // Ignore — the like still counted server-side even if we can't
    // remember it locally for next time.
  }
}

export default function ConfessionCard({
  confession,
  isAdmin = false,
  index = 0,
}: {
  confession: Confession;
  isAdmin?: boolean;
  index?: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [hasRelated, setHasRelated] = useState(false);
  const [relateCount, setRelateCount] = useState(confession.relateCount);
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    setHasRelated(getRelatedIds().includes(confession.id));
  }, [confession.id]);

  async function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed || busy) return;
    if (trimmed.length > MAX_REPLY_LENGTH) {
      setError(`Keep it under ${MAX_REPLY_LENGTH} characters.`);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/confessions/${confession.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          senderNickname: replyNickname.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't post that reply.");
      }
      setReplyText("");
      setReplyNickname("");
      setShowReplyForm(false);
      setJustPosted(true);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't post that reply. Check your connection.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRelate() {
    if (hasRelated || busy) return;
    // Optimistic update — instant feedback, rolled back on failure.
    setHasRelated(true);
    setRelateCount((c) => c + 1);
    saveRelatedId(confession.id);
    try {
      const res = await fetch(`/api/confessions/${confession.id}/react`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      setRelateCount((c) => Math.max(0, c - 1));
      toast.push("Couldn't save that — check your connection and try again.", "error");
    }
  }

  async function deleteConfession() {
    if (!confirm(`Delete Confession #${confession.id}? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/confessions/${confession.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setDeleting(false);
      toast.push("Couldn't delete that confession. Try again.", "error");
    }
  }

  async function deleteReply(replyId: number) {
    if (!confirm("Delete this reply?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/replies/${replyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setBusy(false);
      toast.push("Couldn't delete that reply. Try again.", "error");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: deleting ? 0.4 : 1, y: 0, scale: deleting ? 0.98 : 1 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
      className={`pin relative rounded-note bg-paper p-5 text-ink shadow-note transition sm:p-6 ${
        justPosted ? "ring-2 ring-gold" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block rounded-full bg-ink px-3 py-1 font-mono text-xs text-paper">
          #{String(confession.id).padStart(3, "0")}
        </span>
        <span className="text-xs text-slateInk/60">{timeAgo(confession.createdAt)}</span>
      </div>

      <p className="mt-4 text-sm text-slateInk">
        To <span className="font-medium text-roseDeep">{confession.crushName}</span>
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words font-display text-lg leading-snug text-ink">
        {confession.message}
      </p>
      <p className="mt-3 text-xs text-slateInk/60">
        — {confession.senderNickname || "Anonymous"}
      </p>

      {confession.replies.length > 0 && (
        <ul className="mt-4 space-y-3 border-l-2 border-ink/10 pl-4">
          {confession.replies.map((reply) => (
            <li key={reply.id} className="text-sm text-slateInk">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap break-words">{reply.message}</p>
                {isAdmin && (
                  <button
                    onClick={() => deleteReply(reply.id)}
                    disabled={busy}
                    className="shrink-0 text-xs text-roseDeep/70 transition hover:text-roseDeep disabled:opacity-50"
                  >
                    remove
                  </button>
                )}
              </div>
              <span className="text-xs text-slateInk/50">
                — {reply.senderNickname || "Anonymous"} · {timeAgo(reply.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleRelate}
          disabled={hasRelated}
          aria-pressed={hasRelated}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition active:scale-95 ${
            hasRelated
              ? "bg-roseDeep/10 text-roseDeep"
              : "text-slateInk/70 hover:bg-ink/5 hover:text-roseDeep"
          }`}
        >
          <span className={hasRelated ? "scale-110" : ""}>{hasRelated ? "♥" : "♡"}</span>
          {relateCount > 0 ? relateCount : ""} relate
        </button>
        <button
          onClick={() => setShowReplyForm((v) => !v)}
          className="rounded-full px-3 py-1.5 text-sm text-roseDeep transition hover:bg-roseDeep/10 active:scale-95"
        >
          {showReplyForm ? "cancel" : "reply"}
        </button>
        {isAdmin && (
          <button
            onClick={deleteConfession}
            disabled={deleting}
            className="rounded-full px-3 py-1.5 text-sm text-slateInk/60 transition hover:bg-ink/5 hover:text-roseDeep disabled:opacity-50"
          >
            {deleting ? "deleting..." : "delete"}
          </button>
        )}
      </div>

      {showReplyForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mt-3 flex flex-col gap-2 overflow-hidden rounded-lg bg-paperDim/60 p-3"
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={MAX_REPLY_LENGTH}
            rows={2}
            placeholder="Say something back..."
            aria-label="Your reply"
            className="w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slateInk/50 focus:border-rose"
          />
          <input
            value={replyNickname}
            onChange={(e) => setReplyNickname(e.target.value)}
            maxLength={MAX_NICKNAME_LENGTH}
            placeholder="Nickname (optional)"
            aria-label="Nickname (optional)"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slateInk/50 focus:border-rose"
          />
          <div className="flex items-center justify-between gap-2">
            {error ? (
              <p className="text-xs text-roseDeep" role="alert">
                {error}
              </p>
            ) : (
              <span className="text-xs text-slateInk/50">
                {replyText.length}/{MAX_REPLY_LENGTH}
              </span>
            )}
            <button
              onClick={submitReply}
              disabled={busy || !replyText.trim()}
              className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:bg-inkLight disabled:opacity-60"
            >
              {busy ? "Posting..." : "Post reply"}
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}
