"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { POLL_POLL_MS, POLL_PUSH_DISMISSED_KEY, PollResponse } from "@/lib/poll";
import PollBallot from "@/components/PollBallot";

function getDismissedVersion(): number {
  try {
    const raw = window.sessionStorage.getItem(POLL_PUSH_DISMISSED_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveDismissedVersion(version: number) {
  try {
    window.sessionStorage.setItem(POLL_PUSH_DISMISSED_KEY, String(version));
  } catch {}
}

/** A poll the admin can force in front of everyone currently on the site,
 * on demand. Unlike the one-shot announcement popup, this stays open
 * until the visitor closes it — and because "closed" is tracked per
 * pushVersion (not "seen this poll ever"), the admin pushing the same
 * poll again brings it right back for everyone, even people who already
 * closed it the first time. */
export default function PollPopup() {
  const pathname = usePathname();
  const [data, setData] = useState<PollResponse | null>(null);
  const [dismissedVersion, setDismissedVersion] = useState(0);

  useEffect(() => {
    setDismissedVersion(getDismissedVersion());
  }, []);

  useEffect(() => {
    // Don't interrupt the admin while they're mid-edit in the control room.
    if (pathname?.startsWith("/admin")) return;

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/polls/current", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as PollResponse;
        if (!cancelled) setData(json);
      } catch {
        // Silent — this is a live nicety, not core functionality.
      }
    };
    load();
    const interval = window.setInterval(load, POLL_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  const poll = data?.poll ?? null;
  const visible = !!poll && poll.active && poll.pushVersion > 0 && poll.pushVersion !== dismissedVersion;

  function close() {
    if (poll) {
      saveDismissedVersion(poll.pushVersion);
      setDismissedVersion(poll.pushVersion);
    }
  }

  return (
    <AnimatePresence>
      {visible && poll && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center bg-night/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Poll"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="glass relative w-full max-w-md rounded-2xl border-lime/30 p-6 shadow-[10px_10px_0_#ff4d6d] sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close poll"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/15 text-paper transition hover:border-coral hover:text-coral"
            >
              ✕
            </button>
            <span className="flex items-center gap-2 pr-10 font-mono text-[10px] uppercase tracking-[.24em] text-lime">
              <span className="pulse-dot h-2 w-2 rounded-full bg-lime" /> the admin wants to know
            </span>
            <div className="mt-4">
              <PollBallot
                question={poll.question}
                options={poll.options}
                totalVotes={poll.totalVotes}
                hasVoted={data!.hasVoted}
                votedOptionId={data!.votedOptionId}
                onVoted={setData}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
