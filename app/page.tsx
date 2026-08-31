import Navbar from "@/components/Navbar";
import HomeHero from "@/components/HomeHero";
import NoteStack from "@/components/NoteStack";
import QRCodeCard from "@/components/QRCodeCard";
import { prisma } from "@/lib/prisma";

async function getConfessionCount(): Promise<number | null> {
  try {
    return await prisma.confession.count();
  } catch {
    return null;
  }
}

const FEATURES = [
  ["01", "No receipts", "No account. No real name. No digital trail of your dramatic era."],
  ["02", "Big feelings", "Long messages, tiny crushes, chaotic late-night paragraphs welcome."],
  ["03", "Maybe a reply", "Put it out there. Sometimes the universe replies from a stranger."],
];

export default async function HomePage() {
  const count = await getConfessionCount();

  return (
    <>
      <Navbar />
      <main className="site-grid mx-auto min-h-screen max-w-7xl overflow-hidden px-4 pb-24 pt-14 sm:px-8 sm:pt-24">
        <section className="grid items-center gap-16 lg:grid-cols-[1.15fr_.85fr]">
          <HomeHero />
          <div className="relative flex min-h-[420px] items-center justify-center lg:min-h-[520px]">
            <div className="absolute right-4 top-5 hidden rotate-6 rounded-2xl border border-lime/40 bg-lime px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-night shadow-[8px_8px_0_#ff4d6d] sm:block">your secret is safe here</div>
            <div className="absolute left-2 top-16 h-56 w-56 rounded-full bg-coral/20 blur-3xl" />
            <div className="floaty relative z-10 w-full max-w-sm rounded-[2rem] border border-white/15 bg-[#f7f4ed] p-7 text-night shadow-[18px_20px_0_#8b5cf6] sm:p-9">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-night/50"><span>live note / 001</span><span>just now</span></div>
              <div className="mt-12 font-display text-4xl leading-[.95] tracking-tight sm:text-5xl">I still check if you viewed my story.</div>
              <div className="mt-10 flex items-end justify-between"><span className="font-mono text-xs text-night/50">— probably anonymous</span><span className="rounded-full bg-coral px-3 py-1 text-xs font-bold text-paper">♡ relate</span></div>
            </div>
            <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rotate-[-4deg] rounded-xl bg-night px-5 py-3 font-mono text-xs text-lime shadow-[6px_6px_0_#d9ff54]">{count ?? "∞"} feelings posted</div>
          </div>
        </section>

        <div className="-mx-4 mt-24 overflow-hidden border-y border-white/10 bg-coral py-3 text-night sm:-mx-8">
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[.2em]">
            {Array.from({ length: 2 }).map((_, group) => <span key={group}>anonymous thoughts ★ midnight honesty ★ unread drafts ★ one more thing ★ anonymous thoughts ★ midnight honesty ★ unread drafts ★ one more thing ★</span>)}
          </div>
        </div>

        <section className="mt-24 grid gap-5 sm:grid-cols-3">
          {FEATURES.map(([number, title, body]) => <div key={number} className="glass rounded-2xl p-6 transition hover:-translate-y-1 hover:border-coral/60"><span className="font-mono text-xs text-coral">{number} /</span><h2 className="mt-10 font-display text-3xl tracking-tight text-paper">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted">{body}</p></div>)}
        </section>

        <section className="mt-24 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="glass rounded-3xl p-7 sm:p-10"><p className="font-mono text-xs uppercase tracking-[.2em] text-lime">share the chaos</p><h2 className="mt-3 max-w-xl font-display text-4xl leading-none text-paper sm:text-5xl">Put the wall in your group chat.</h2><p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">Scan it. Send it. Let the brave, the delusional, and the hopeless romantics speak.</p><div className="mt-8 max-w-xs"><QRCodeCard /></div></div>
          <div className="rounded-3xl border border-coral/40 bg-coral p-7 text-night shadow-[10px_10px_0_#d9ff54]"><span className="font-mono text-xs uppercase tracking-[.2em]">house rules</span><p className="mt-12 font-display text-3xl leading-none">Be honest. Be kind. Don&apos;t be weird.</p><p className="mt-5 text-sm font-medium leading-relaxed text-night/70">No hate, no threats, no naming people to hurt them. Leave the world a little softer than you found it.</p></div>
        </section>
      </main>
    </>
  );
}
