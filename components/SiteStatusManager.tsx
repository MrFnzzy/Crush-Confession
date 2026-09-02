"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

const MAX_MESSAGE_LENGTH = 200;
const DEFAULT_MESSAGE = "we're taking a quick break. back soon.";

export default function SiteStatusManager() {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (typeof data?.shutdown === "boolean") setShutdown(data.shutdown);
        if (typeof data?.shutdownMessage === "string" && data.shutdownMessage) setMessage(data.shutdownMessage);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  async function save(nextShutdown: boolean) {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/site-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shutdown: nextShutdown, shutdownMessage: message.trim() || DEFAULT_MESSAGE }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save that.");
      setShutdown(data.shutdown);
      setMessage(data.shutdownMessage);
      toast.push(
        data.shutdown ? "Site is now shut down for visitors." : "Site is live again.",
        "success"
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save that.";
      setError(msg);
      toast.push(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          When shut down, every visitor sees only the message below instead of the site — no wall, no
          confess form. You can still reach this admin panel while it&apos;s on. Reads use a cache that
          only refreshes when you flip the switch, so this doesn&apos;t add any extra database load for
          normal visitor traffic.
        </p>
      </div>

      <div className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">status</span>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-coral/25 bg-coral/10 px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={shutdown}
            disabled={!loaded || saving}
            onClick={() => save(!shutdown)}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
              shutdown ? "bg-coral" : "bg-night/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition ${
                shutdown ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <div className="text-sm leading-snug">
            <span className="font-bold text-paper">{shutdown ? "Site is shut down" : "Site is live"}</span>
            <span className="mt-1 block text-xs text-muted">
              {shutdown ? "Visitors only see the message below." : "Visitors can browse and post normally."}
            </span>
          </div>
        </div>

        <label htmlFor="shutdown-message" className="mb-2 mt-6 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted">
          <span>message visitors will see</span>
          <span>{message.length}/{MAX_MESSAGE_LENGTH}</span>
        </label>
        <textarea
          id="shutdown-message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          className="w-full resize-none rounded-xl border border-white/10 bg-night/35 px-4 py-3 text-base leading-relaxed text-paper placeholder:text-muted/50 focus:border-coral focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => save(shutdown)}
            disabled={saving}
            className="rounded-xl bg-lime px-5 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save message"}
          </button>
          {!shutdown ? (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving}
              className="rounded-xl border border-coral/50 px-5 py-3 text-sm font-bold text-coral transition hover:bg-coral hover:text-paper disabled:opacity-50"
            >
              Shut it down
            </button>
          ) : (
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-xl border border-lime/50 px-5 py-3 text-sm font-bold text-lime transition hover:bg-lime hover:text-night disabled:opacity-50"
            >
              Bring it back
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
      </div>
    </div>
  );
}
