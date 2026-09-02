"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfessionCard from "@/components/ConfessionCard";
import SortToggle from "@/components/SortToggle";

type Reply = { id: number; message: string; senderNickname: string | null; gifUrl?: string | null; createdAt: string };
type SerializedConfession = {
  id: number;
  crushName: string | null;
  crushNameLength?: number;
  message: string;
  senderNickname: string | null;
  gifUrl?: string | null;
  guessEnabled?: boolean;
  relateCount: number;
  viewCount?: number;
  createdAt: string;
  replies: Reply[];
};

function matchesQuery(confession: SerializedConfession, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    confession.crushName ?? "",
    confession.message,
    confession.senderNickname ?? "",
    ...confession.replies.map((reply) => reply.message),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function WallLive({ initialConfessions, initialFailed, sortTop }: { initialConfessions: SerializedConfession[]; initialFailed: boolean; sortTop: boolean }) {
  const [confessions, setConfessions] = useState(initialConfessions);
  const [failed, setFailed] = useState(initialFailed);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const refresh = async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const response = await fetch(`/api/confessions${sortTop ? "?sort=top" : ""}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Wall request failed");
        const next = (await response.json()) as SerializedConfession[];
        setConfessions(next);
        setFailed(false);
        setLastUpdated(new Date());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      }
    };

    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.clearInterval(interval);
      requestRef.current?.abort();
    };
  }, [sortTop]);

  const displayNumbers = useMemo(() => new Map<number, number>([...confessions].sort((a, b) => a.id - b.id).map((confession, index) => [confession.id, index + 1])), [confessions]);
  const filtered = useMemo(() => confessions.filter((confession) => matchesQuery(confession, search)), [confessions, search]);

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div><span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.24em] text-lime"><span className="pulse-dot h-2 w-2 rounded-full bg-lime" /> live archive / {confessions.length} signals</span><h1 className="mt-2 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">The Wall<span className="text-coral">.</span></h1>{lastUpdated && <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-muted">updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · auto-refresh 5s</p>}</div>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center"><SortToggle /><Link href="/confess" className="neon-button rounded-xl bg-lime px-6 py-3 text-center text-sm font-extrabold text-night">Drop a secret</Link></div>
      </div>

      <div className="glass mb-12 flex items-center gap-3 rounded-2xl px-4 py-3 transition focus-within:border-lime/60">
        <span className="text-lg text-lime" aria-hidden>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="search the wall — a name, a word, a feeling..."
          aria-label="Search confessions"
          className="w-full bg-transparent text-sm text-paper placeholder:text-muted focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted transition hover:text-coral">
            clear
          </button>
        )}
      </div>

      {failed && confessions.length === 0 ? <div className="glass rounded-3xl p-16 text-center"><span className="text-4xl text-coral">⚠</span><p className="mt-4 text-paper">The wall is offline.</p><p className="mt-1 text-sm text-muted">We&apos;ll keep trying every five seconds.</p></div> : confessions.length === 0 ? <div className="glass rounded-3xl p-16 text-center"><span className="text-4xl text-coral">♡</span><p className="mt-4 font-display text-3xl text-paper">Silence.</p><p className="mt-1 text-sm text-muted">Nobody has said anything yet. Be the first.</p><Link href="/confess" className="mt-8 inline-block rounded-full bg-coral px-8 py-3 text-sm font-bold text-paper">Confess now</Link></div> : filtered.length === 0 ? <div className="glass rounded-3xl p-16 text-center"><span className="text-4xl text-coral">⌕</span><p className="mt-4 font-display text-3xl text-paper">No matches.</p><p className="mt-1 text-sm text-muted">Nothing on the wall matches &ldquo;{search}&rdquo;.</p><button onClick={() => setSearch("")} className="mt-8 inline-block rounded-full bg-coral px-8 py-3 text-sm font-bold text-paper">Clear search</button></div> : <><div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 sm:gap-8 sm:space-y-8 lg:columns-3">{filtered.map((confession, index) => <div key={confession.id} className="break-inside-avoid"><ConfessionCard index={index} displayNumber={displayNumbers.get(confession.id)} confession={confession} /></div>)}</div>{failed && <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-coral">live refresh paused on this response · retrying in 5s</p>}</>}
    </>
  );
}
