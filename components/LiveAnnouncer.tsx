"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ANNOUNCEMENT_FRESH_WINDOW_MS, ANNOUNCEMENT_POLL_MS, announcementDisplayMs } from "@/lib/announcer";

const SEEN_KEY = "unspoken_last_announcement_id";

// sessionStorage on purpose, not localStorage: localStorage is shared
// across every tab in the browser, which would mean whichever tab polls
// first "claims" the announcement and every other open tab silently
// skips it. sessionStorage is isolated per tab, so each open tab shows
// the popup independently — while still not re-showing it to *that* tab
// if it keeps polling after the popup has already faded.

function getLastSeenId(): number {
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveLastSeenId(id: number) {
  try {
    window.sessionStorage.setItem(SEEN_KEY, String(id));
  } catch {}
}

/** A live, one-time popup: when an admin sends an announcement, every tab
 * currently on the site (polling every few seconds) pops it up in view
 * for a few seconds and then it's gone for good — nothing persists it as
 * a banner, and a tab that starts browsing after it's already faded
 * won't see it, same as anyone who missed a live broadcast. */
export default function LiveAnnouncer() {
  const [message, setMessage] = useState<string | null>(null);
  const hideTimeout = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/announcements/latest", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const announcement = data?.announcement as { id: number; message: string; createdAt: string } | null;
        if (cancelled || !announcement) return;

        if (announcement.id <= getLastSeenId()) return;
        saveLastSeenId(announcement.id);

        // Extra safety: even though the API already filters by
        // freshness, don't pop up something that's already effectively
        // expired by the time this response arrives (e.g. a slow poll
        // right at the edge of the window).
        const age = Date.now() - new Date(announcement.createdAt).getTime();
        if (age > ANNOUNCEMENT_FRESH_WINDOW_MS) return;

        if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
        setMessage(announcement.message);
        hideTimeout.current = window.setTimeout(() => setMessage(null), announcementDisplayMs(announcement.message));
      } catch {
        // Silent — this is a nice-to-have popup, not core functionality.
      }
    };

    poll();
    const interval = window.setInterval(poll, ANNOUNCEMENT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4 sm:top-6"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            role="status"
            className="pointer-events-auto flex max-w-lg items-start gap-3 rounded-2xl border border-night/10 bg-lime px-5 py-4 text-night shadow-[6px_6px_0_#ff4d6d]"
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-night text-xs text-lime" aria-hidden>
              📣
            </span>
            <p className="text-sm font-semibold leading-snug">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
