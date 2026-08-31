"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reply = {
  id: number;
  message: string;
  createdAt: string;
};

type Confession = {
  id: number;
  number?: number;
  fromName: string;
  toName: string;
  message: string;
  createdAt: string;
  replies: Reply[];
};

function timeAgo(dateString: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitReply() {
    if (!replyText.trim()) return;

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/confessions/${confession.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't post that reply.");
      }

      setReplyText("");
      setShowReplyForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that reply.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteConfession() {
    if (!confirm(`Delete Confession #${confession.number ?? confession.id}?`)) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/confessions/${confession.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't delete that confession.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that confession.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReply(replyId: number) {
    if (!confirm("Delete this reply?")) return;

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/replies/${replyId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't delete that reply.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete that reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="relative rounded-note bg-paper p-6 text-ink shadow-[0_10px_0_rgba(0,0,0,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block rounded-full bg-ink px-3 py-1 font-display text-xs text-paper">
          Confession #{confession.number ?? confession.id}
        </span>
        <span className="text-xs text-slateInk/60">{timeAgo(confession.createdAt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-slateInk">
        <span>To</span>
        <span className="font-medium text-roseDeep">{confession.toName}</span>
        <span className="ml-auto text-xs text-slateInk/60">From</span>
        <span className="text-sm font-medium italic text-ink">{confession.fromName}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap font-display text-lg leading-snug text-ink">
        {confession.message}
      </p>

      {confession.replies.length > 0 && (
        <ul className="mt-4 space-y-2 border-l-2 border-ink/10 pl-4">
          {confession.replies.map((reply) => (
            <li key={reply.id} className="text-sm text-slateInk">
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap">{reply.message}</p>
                {isAdmin && (
                  <button
                    onClick={() => void deleteReply(reply.id)}
                    disabled={busy}
                    className="shrink-0 text-xs text-roseDeep/70 hover:text-roseDeep disabled:opacity-60"
                  >
                    remove
                  </button>
                )}
              </div>
              <span className="text-xs text-slateInk/50">{timeAgo(reply.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setShowReplyForm((value) => !value)}
          className="text-sm text-roseDeep hover:underline"
        >
          {showReplyForm ? "cancel" : "reply"}
        </button>
        {isAdmin && (
          <button
            onClick={() => void deleteConfession()}
            disabled={busy}
            className="text-sm text-slateInk/60 hover:text-roseDeep disabled:opacity-60"
          >
            delete confession
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={1000}
            rows={2}
            placeholder="Say something back..."
            className="w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slateInk/50 focus:border-rose"
          />
          {error && <p className="text-xs text-roseDeep">{error}</p>}
          <button
            onClick={() => void submitReply()}
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
