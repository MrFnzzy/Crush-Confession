"use client";

import { useEffect, useState } from "react";
import { POLL_POLL_MS, PollResponse } from "@/lib/poll";
import PollBallot from "@/components/PollBallot";

/** Renders the live poll where it belongs: pinned at the top of the wall
 * while it's open for voting, or under the shutdown message if the admin
 * has separately toggled "show on shutdown". Renders nothing at all when
 * there's no active poll for this context — no empty card, no layout
 * shift for visitors who never see a poll. */
export default function PollWidget({ context }: { context: "wall" | "shutdown" }) {
  const [data, setData] = useState<PollResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/polls/current", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as PollResponse;
        if (!cancelled) setData(json);
      } catch {
        // Live poll status is a nice-to-have, not core functionality.
      }
    };

    load();
    const interval = window.setInterval(load, POLL_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!data?.poll || !data.poll.active) return null;
  if (context === "shutdown" && !data.poll.showOnShutdown) return null;

  const { poll } = data;

  if (context === "shutdown") {
    return (
      <div className="glass mx-auto mt-10 w-full max-w-lg rounded-2xl p-6 text-left sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.22em] text-lime">quick poll, while we&apos;re closed</span>
        <div className="mt-4">
          <PollBallot
            question={poll.question}
            options={poll.options}
            totalVotes={poll.totalVotes}
            hasVoted={data.hasVoted}
            votedOptionId={data.votedOptionId}
            onVoted={setData}
            dense
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass relative mb-12 overflow-hidden rounded-2xl border-lime/30 p-6 shadow-[8px_8px_0_#8b5cf6] sm:p-8">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.24em] text-lime">
        <span className="pulse-dot h-2 w-2 rounded-full bg-lime" /> live poll
      </span>
      <div className="mt-4">
        <PollBallot
          question={poll.question}
          options={poll.options}
          totalVotes={poll.totalVotes}
          hasVoted={data.hasVoted}
          votedOptionId={data.votedOptionId}
          onVoted={setData}
        />
      </div>
    </div>
  );
}
