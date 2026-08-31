import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfessionCard from "@/components/ConfessionCard";
import SortToggle from "@/components/SortToggle";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";
type ConfessionWithReplies = Confession & { replies: Reply[] };

async function getConfessions(sortTop: boolean) {
  try {
    const confessions = await prisma.confession.findMany({
      orderBy: sortTop ? [{ relateCount: "desc" }, { id: "desc" }] : { id: "desc" },
      include: { replies: { orderBy: { id: "asc" } } },
    });
    return { confessions, failed: false as const };
  } catch (err) {
    console.error("Failed to load the wall:", err);
    return { confessions: [] as ConfessionWithReplies[], failed: true as const };
  }
}

export default async function WallPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sortTop = searchParams.sort === "top";
  const { confessions, failed } = await getConfessions(sortTop);
  const displayNumbers = new Map<number, number>([...confessions].sort((a, b) => a.id - b.id).map((confession, index) => [confession.id, index + 1]));

  return (
    <>
      <Navbar />
      <main className="site-grid min-h-screen px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">the archive / {confessions.length} signals</span><h1 className="mt-2 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">The Wall<span className="text-coral">.</span></h1></div>
            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center"><SortToggle /><Link href="/confess" className="neon-button rounded-xl bg-lime px-6 py-3 text-center text-sm font-extrabold text-night">Drop a secret</Link></div>
          </div>
          {failed ? <div className="glass rounded-3xl p-16 text-center"><span className="text-4xl text-coral">⚠</span><p className="mt-4 text-paper">The wall is offline.</p><p className="mt-1 text-sm text-muted">Refresh in a moment to try again.</p></div> : confessions.length === 0 ? <div className="glass rounded-3xl p-16 text-center"><span className="text-4xl text-coral">♡</span><p className="mt-4 font-display text-3xl text-paper">Silence.</p><p className="mt-1 text-sm text-muted">Nobody has said anything yet. Be the first.</p><Link href="/confess" className="mt-8 inline-block rounded-full bg-coral px-8 py-3 text-sm font-bold text-paper">Confess now</Link></div> : <div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 sm:gap-8 sm:space-y-8 lg:columns-3">{confessions.map((confession, index) => <div key={confession.id} className="break-inside-avoid"><ConfessionCard index={index} displayNumber={displayNumbers.get(confession.id)} confession={{ ...confession, createdAt: confession.createdAt.toISOString(), replies: confession.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })) }} /></div>)}</div>}
        </div>
      </main>
    </>
  );
}
