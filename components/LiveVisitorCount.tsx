"use client";

import { useEffect, useState } from "react";

const POLL_MS = 10_000;

/** Admin-only "how many people are on the site right now" stat. Polls
 * /api/presence/count, which only counts sessions with a recent
 * heartbeat (see lib/presence.ts) — nothing here is stored per-request,
 * it's just a live tally. */
export default function LiveVisitorCount({ initialCount }: { initialCount: number | null }) {
  const [count, setCount] = useState<number | null>(initialCount);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/presence/count", { cache: "no-store" });
        if (!res.ok) throw new Error("presence count failed");
        const data = await res.json();
        if (!cancelled) {
          setCount(typeof data.count === "number" ? data.count : null);
          setStalled(false);
        }
      } catch {
        if (!cancelled) setStalled(true);
      }
    };

    const interval = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-lime/30 bg-lime p-5 text-night shadow-[6px_6px_0_#ff4d6d]">
      <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em]">
        <span className="pulse-dot h-2 w-2 rounded-full bg-night" aria-hidden />
        live now
      </span>
      <p className="mt-5 font-display text-5xl leading-none">{count === null ? "—" : count.toLocaleString()}</p>
      <p className="mt-3 text-xs font-semibold text-night/60">
        {stalled ? "couldn't refresh — retrying" : "on the site in the last minute"}
      </p>
    </div>
  );
}
