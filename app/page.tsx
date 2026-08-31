import Link from "next/link";
import QRCodeCard from "@/components/QRCodeCard";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="font-display text-sm italic text-gold">unspoken</span>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper sm:text-6xl">
            Say the thing
            <br />
            you never said.
          </h1>
          <p className="mt-6 max-w-md text-slate-300">
            Write it down, leave your name out of it, and let it land on the
            wall for everyone to read — and maybe, to answer.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/confess"
              className="rounded-full bg-rose px-8 py-3 font-medium text-paper transition hover:bg-roseDeep"
            >
              Write a confession
            </Link>
            <Link
              href="/wall"
              className="rounded-full border border-paper/25 px-8 py-3 font-medium text-paper transition hover:border-paper/60"
            >
              Read the wall
            </Link>
          </div>

          <Link
            href="/admin"
            className="mt-16 inline-block text-xs text-slate-500 transition hover:text-slate-300"
          >
            admin
          </Link>
        </div>

        <div className="flex flex-col items-center gap-10">
          <article
            aria-hidden="true"
            className="pin relative w-full max-w-xs -rotate-2 rounded-note bg-paper p-6 text-ink shadow-[0_14px_0_rgba(0,0,0,0.28)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-block rounded-full bg-ink px-3 py-1 font-mono text-xs text-paper">
                #014
              </span>
              <span className="text-xs text-slateInk/60">2h ago</span>
            </div>
            <p className="mt-4 text-sm text-slateInk">
              To <span className="font-medium text-roseDeep">the guy from the bus</span>
            </p>
            <p className="mt-2 font-display text-lg leading-snug text-ink">
              I moved seats twice just to sit closer. You never noticed. I
              hope you read this someday.
            </p>
            <p className="mt-3 text-xs text-slateInk/60">— Anonymous</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-slateInk/70">
              <span>♡ 23 relate</span>
              <span className="text-roseDeep">reply</span>
            </div>
          </article>

          <QRCodeCard />
        </div>
      </div>
    </main>
  );
}
