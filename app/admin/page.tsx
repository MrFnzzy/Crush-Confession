import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import QRCodeCard from "@/components/QRCodeCard";
import ConfessionCard from "@/components/ConfessionCard";

export const dynamic = "force-dynamic";
type ConfessionWithReplies = Confession & { replies: Reply[] };

async function getConfessions() {
  try {
    const confessions = await prisma.confession.findMany({
      orderBy: { id: "desc" },
      include: { replies: { orderBy: { id: "asc" } } },
    });
    return { confessions, failed: false as const };
  } catch (err) {
    console.error("Admin: failed to load confessions:", err);
    return { confessions: [] as ConfessionWithReplies[], failed: true as const };
  }
}

export default async function AdminPage() {
  if (!isAdmin()) return <main className="flex min-h-screen items-center justify-center px-6"><AdminLoginForm /></main>;
  const { confessions, failed } = await getConfessions();
  const displayNumbers = new Map<number, number>([...confessions].sort((a, b) => a.id - b.id).map((confession, index) => [confession.id, index + 1]));

  return (
    <>
      <div className="border-b border-white/10 bg-night/80 px-4 py-3 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="font-display text-lg italic text-paper">unspoken<span className="text-coral">.</span></Link><AdminLogoutButton /></div></div>
      <main className="site-grid min-h-screen px-4 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-7xl"><div className="mb-12 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Moderate<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">{failed ? "Database unreachable." : `${confessions.length} active signal${confessions.length === 1 ? "" : "s"} on the wall.`}</p></div><Link href="/wall" className="rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-bold text-paper transition hover:border-lime hover:text-lime">View public wall ↗</Link></div><div className="mb-12 max-w-sm"><QRCodeCard /></div>{failed ? <div className="glass rounded-3xl p-16 text-center text-muted">Refresh to try again.</div> : confessions.length === 0 ? <div className="glass rounded-3xl p-16 text-center text-muted">Nothing to moderate yet.</div> : <div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">{confessions.map((confession, index) => <div key={confession.id} className="break-inside-avoid"><ConfessionCard isAdmin index={index} displayNumber={displayNumbers.get(confession.id)} confession={{ ...confession, createdAt: confession.createdAt.toISOString(), replies: confession.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })) }} /></div>)}</div>}</div></main>
    </>
  );
}
