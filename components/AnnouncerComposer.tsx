"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { ANNOUNCEMENT_FRESH_WINDOW_MS, MAX_ANNOUNCEMENT_LENGTH, announcementDisplayMs } from "@/lib/announcer";

export default function AnnouncerComposer() {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const trimmed = message.trim();
  const previewSeconds = Math.round(announcementDisplayMs(trimmed || " ") / 1000);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't send that.");
      }
      setMessage("");
      toast.push("Sent — live on everyone's screen for a few seconds.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send that.";
      setError(msg);
      toast.push(msg, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Sends a one-time popup to everyone currently on the site — it appears in view on whatever page they&apos;re
          on, stays for a few seconds (longer for longer messages), then disappears. It&apos;s live only: nobody
          sees it after it fades, and visitors who arrive later won&apos;t see it either. Nothing is pinned or saved
          anywhere on the site.
        </p>
      </div>

      <form onSubmit={send} className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">announce something</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX_ANNOUNCEMENT_LENGTH}
          rows={3}
          placeholder="e.g. Wall closes in 10 minutes — get your confession in!"
          className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-night/40 px-4 py-3 text-sm text-paper placeholder:text-muted/60 focus:border-lime focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-muted/70">
            {message.length}/{MAX_ANNOUNCEMENT_LENGTH} · will show for ~{previewSeconds}s · reaches anyone active in
            the last {Math.round(ANNOUNCEMENT_FRESH_WINDOW_MS / 1000)}s
          </span>
          <button
            type="submit"
            disabled={sending || !trimmed}
            className="shrink-0 rounded-xl bg-lime px-6 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send live announcement"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-coral" role="alert">{error}</p>}
      </form>
    </div>
  );
}
