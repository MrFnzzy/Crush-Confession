"use client";

import { useState } from "react";
import { PollOptionData, PollResponse } from "@/lib/poll";

const BAR_COLORS = ["bg-lime", "bg-coral", "bg-violet", "bg-gold"];

export default function PollBallot({
  question,
  options,
  totalVotes,
  hasVoted,
  votedOptionId,
  onVoted,
  dense = false,
}: {
  question: string;
  options: PollOptionData[];
  totalVotes: number;
  hasVoted: boolean;
  votedOptionId: number | null;
  onVoted: (response: PollResponse) => void;
  dense?: boolean;
}) {
  const [voting, setVoting] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function vote(optionId: number) {
    if (voting !== null || hasVoted) return;
    setVoting(optionId);
    setError("");
    try {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = (await res.json().catch(() => ({}))) as PollResponse & { error?: string };
      if (!res.ok) throw new Error((data as { error?: string }).error || "Couldn't vote.");
      onVoted(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't vote.");
    } finally {
      setVoting(null);
    }
  }

  const showResults = hasVoted;

  return (
    <div>
      <p className={`font-display leading-tight text-paper ${dense ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
        {question}
      </p>

      <div className="mt-5 space-y-2.5">
        {options.map((option, i) => {
          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isMine = votedOptionId === option.id;
          if (showResults) {
            return (
              <div key={option.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-night/40 px-4 py-3">
                <div
                  className={`absolute inset-y-0 left-0 ${BAR_COLORS[i % BAR_COLORS.length]} opacity-25 transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${isMine ? "text-lime" : "text-paper"}`}>
                    {option.text}
                    {isMine && <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-lime/80">your vote</span>}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">{pct}%</span>
                </div>
              </div>
            );
          }
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => vote(option.id)}
              disabled={voting !== null}
              className="w-full rounded-xl border border-white/15 bg-night/30 px-4 py-3 text-left text-sm font-semibold text-paper transition hover:border-lime hover:bg-lime/10 disabled:opacity-60"
            >
              {voting === option.id ? "Voting..." : option.text}
            </button>
          );
        })}
      </div>

      <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-muted">
        {totalVotes} vote{totalVotes === 1 ? "" : "s"} so far{!showResults && " · tap one to vote, anonymously"}
      </p>
      {error && <p className="mt-2 text-sm text-coral" role="alert">{error}</p>}
    </div>
  );
}
