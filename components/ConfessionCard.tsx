"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

function getRelatedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(RELATED_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function ConfessionCard({
  confession,
  isAdmin = false,
}: {
  confession: Confession;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasRelated, setHasRelated] = useState(false);
  const [relateCount, setRelateCount] = useState(confession.relateCount);
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    setHasRelated(getRelatedIds().includes(confession.id));
  }, [confession.id]);

  async function submitReply() {
    if (!replyText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/confessions/${confession.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: replyText,
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
      setError(err instanceof Error ? err.message : "Couldn't post that reply.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRelate() {
    if (hasRelated || busy) return;
    setHasRelated(true);
    setRelateCount((c) => c + 1);
    const ids = getRelatedIds();
    window.localStorage.setItem(
      RELATED_KEY,
      JSON.stringify([...ids, confession.id])
    );
    await fetch(`/api/confessions/${confession.id}/react`, { method: "POST" }).catch(
      () => null
    );
  }

  async function deleteConfession() {
    if (!confirm(`Delete Confession #${confession.id}? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/confessions/${confession.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function deleteReply(replyId: number) {
    if (!confirm("Delete this reply?")) return;
    setBusy(true);
    await fetch(`/api/replies/${replyId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <article
      className={`relative rounded-note bg-paper p-6 text-ink shadow-[0_10px_0_rgba(0,0,0,0.2)] transition ${
        justPosted ? "ring-2 ring-gold" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block rounded-full bg-ink px-3 py-1 font-display text-xs text-paper">
          Confession #{confession.id}
        </span>
        <span className="text-xs text-slateInk/60">{timeAgo(confession.createdAt)}</span>
      </div>

      <p className="mt-4 text-sm text-slateInk">
        To <span className="font-medium text-roseDeep">{confession.crushName}</span>
      </p>
      <p className="mt-2 whitespace-pre-wrap font-display text-lg leading-snug text-ink">
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
                <p className="whitespace-pre-wrap">{reply.message}</p>
                {isAdmin && (
                  <button
                    onClick={() => deleteReply(reply.id)}
                    className="shrink-0 text-xs text-roseDeep/70 hover:text-roseDeep"
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

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={toggleRelate}
          disabled={hasRelated}
          className={`flex items-center gap-1.5 text-sm transition ${
            hasRelated ? "text-roseDeep" : "text-slateInk/70 hover:text-roseDeep"
          }`}
        >
          <span className={hasRelated ? "scale-110" : ""}>{hasRelated ? "♥" : "♡"}</span>
          {relateCount > 0 ? relateCount : ""} relate
        </button>
        <button
          onClick={() => setShowReplyForm((v) => !v)}
          className="text-sm text-roseDeep hover:underline"
        >
          {showReplyForm ? "cancel" : "reply"}
        </button>
        {isAdmin && (
          <button
            onClick={deleteConfession}
            disabled={busy}
            className="text-sm text-slateInk/60 hover:text-roseDeep"
          >
            delete confession
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-paperDim/60 p-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Say something back..."
            className="w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slateInk/50 focus:border-rose"
          />
          <input
            value={replyNickname}
            onChange={(e) => setReplyNickname(e.target.value)}
            maxLength={40}
            placeholder="Nickname (optional)"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slateInk/50 focus:border-rose"
          />
          {error && <p className="text-xs text-roseDeep">{error}</p>}
          <button
            onClick={submitReply}
            disabled={busy}
            className="self-start rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:bg-inkLight disabled:opacity-60"
          >
            Post reply
          </button>
        </div>
      )}
    </article>
  );
}
