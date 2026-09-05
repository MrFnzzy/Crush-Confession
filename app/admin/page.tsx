import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BANNED_WORDS } from "@/lib/wordFilter";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import QRCodeCard from "@/components/QRCodeCard";
import ConfessionCard from "@/components/ConfessionCard";
import AdminTabs from "@/components/AdminTabs";
import BannedWordsManager from "@/components/BannedWordsManager";
import AnnouncerComposer from "@/components/AnnouncerComposer";
import PollComposer from "@/components/PollComposer";
import BackgroundMusicManager from "@/components/BackgroundMusicManager";
import SiteStatusManager from "@/components/SiteStatusManager";
import LiveVisitorCount from "@/components/LiveVisitorCount";
import { PRESENCE_WINDOW_MS } from "@/lib/presence";

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

async function getVisitCount() {
  try {
    return await prisma.visit.count();
  } catch (err) {
    console.error("Admin: failed to load visit count:", err);
    return null;
  }
}

async function getCustomBannedWords() {
  try {
    return await prisma.bannedWord.findMany({ orderBy: { word: "asc" } });
  } catch (err) {
    console.error("Admin: failed to load banned words:", err);
    return [];
  }
}

async function getLiveVisitorCount() {
  try {
    return await prisma.presence.count({
      where: { lastSeen: { gt: new Date(Date.now() - PRESENCE_WINDOW_MS) } },
    });
  } catch (err) {
    console.error("Admin: failed to load live visitor count:", err);
    return null;
  }
}

export default async function AdminPage() {
  if (!isAdmin()) {
    return <main className="flex min-h-screen items-center justify-center px-6"><AdminLoginForm /></main>;
  }

  const [{ confessions, failed }, visitCount, customBannedWords, liveVisitorCount] = await Promise.all([
    getConfessions(),
    getVisitCount(),
    getCustomBannedWords(),
    getLiveVisitorCount(),
  ]);
  const displayNumbers = new Map<number, number>([...confessions].sort((a, b) => a.id - b.id).map((confession, index) => [confession.id, index + 1]));

  const moderatePanel = (
    <>
      <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Moderate<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">{failed ? "Database unreachable." : `${confessions.length} active signal${confessions.length === 1 ? "" : "s"} on the wall.`}</p></div><Link href="/wall" className="rounded-xl border border-white/15 px-5 py-3 text-center text-sm font-bold text-paper transition hover:border-lime hover:text-lime">View public wall ↗</Link></div>

      <section aria-label="Dashboard metrics" className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-lime/30 bg-lime p-5 text-night shadow-[6px_6px_0_#ff4d6d]"><span className="font-mono text-[10px] font-bold uppercase tracking-[.2em]">total visits</span><p className="mt-5 font-display text-5xl leading-none">{visitCount === null ? "—" : visitCount.toLocaleString()}</p><p className="mt-3 text-xs font-semibold text-night/60">anonymous browser sessions</p></div>
        <LiveVisitorCount initialCount={liveVisitorCount} />
        <div className="glass rounded-2xl p-5"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">live signals</span><p className="mt-5 font-display text-5xl leading-none text-paper">{confessions.length}</p><p className="mt-3 text-xs text-muted">confessions on the wall</p></div>
        <div className="glass rounded-2xl p-5"><span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">privacy mode</span><p className="mt-5 font-display text-3xl leading-none text-paper">on</p><p className="mt-3 text-xs text-muted">no IPs or identities stored</p></div>
      </section>

      <div className="mb-12 max-w-sm"><QRCodeCard /></div>
      {failed ? <div className="glass rounded-3xl p-16 text-center text-muted">Refresh to try again.</div> : confessions.length === 0 ? <div className="glass rounded-3xl p-16 text-center text-muted">Nothing to moderate yet.</div> : <div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">{confessions.map((confession, index) => <div key={confession.id} className="break-inside-avoid"><ConfessionCard isAdmin index={index} displayNumber={displayNumbers.get(confession.id)} confession={{ ...confession, createdAt: confession.createdAt.toISOString(), replies: confession.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })) }} /></div>)}</div>}
    </>
  );

  const filterPanel = (
    <>
      <div className="mb-10"><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Filter<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">Words that are blocked from confessions and replies, in English, Tagalog, and Bisaya.</p></div>
      <BannedWordsManager defaultWords={DEFAULT_BANNED_WORDS} customWords={customBannedWords} />
    </>
  );

  const announcePanel = (
    <>
      <div className="mb-10"><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Announce<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">Push a live, one-time popup to everyone currently browsing the site.</p></div>
      <AnnouncerComposer />
    </>
  );

  const pollPanel = (
    <>
      <div className="mb-10"><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Poll<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">Run a live vote on the wall, optionally during shutdown, and push it in front of everyone whenever you want.</p></div>
      <PollComposer />
    </>
  );

  const musicPanel = (
    <>
      <div className="mb-10"><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Music<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">Set the live background track visitors hear while they browse the wall.</p></div>
      <BackgroundMusicManager />
    </>
  );

  const statusPanel = (
    <>
      <div className="mb-10"><span className="font-mono text-[10px] uppercase tracking-[.24em] text-lime">control room / private</span><h1 className="mt-3 font-display text-6xl leading-none tracking-tighter text-paper sm:text-8xl">Shutdown<span className="text-coral">.</span></h1><p className="mt-4 text-sm text-muted">Temporarily replace the public site with a single message. You&apos;ll still be able to reach this admin panel.</p></div>
      <SiteStatusManager />
    </>
  );

  return (
    <>
      <div className="border-b border-white/10 bg-night/80 px-4 py-3 sm:px-8"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/" className="font-display text-lg italic text-paper">unspoken<span className="text-coral">.</span></Link><AdminLogoutButton /></div></div>
      <main className="site-grid min-h-screen px-4 py-10 sm:px-8 sm:py-16"><div className="mx-auto max-w-7xl">
        <AdminTabs moderatePanel={moderatePanel} filterPanel={filterPanel} announcePanel={announcePanel} pollPanel={pollPanel} musicPanel={musicPanel} statusPanel={statusPanel} />
      </div></main>
    </>
  );
}
