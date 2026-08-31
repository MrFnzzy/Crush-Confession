import Link from "next/link";
import QRCodeCard from "@/components/QRCodeCard";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-20 text-center">
      <span className="font-display text-sm tracking-wide text-gold">
        unspoken
      </span>
      <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight text-paper sm:text-6xl">
        Say the thing you never said.
      </h1>
      <p className="mt-6 max-w-md text-slate-300">
        Write it down, leave your name out of it, and let it land on the
        wall for everyone to read — and maybe, to answer.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/confess"
          className="rounded-full bg-rose px-8 py-3 font-medium text-paper transition hover:bg-roseDeep"
        >
          Write a confession
        </Link>
        <Link
          href="/wall"
          className="rounded-full border border-paper/30 px-8 py-3 font-medium text-paper transition hover:border-paper/60"
        >
          Read the wall
        </Link>
      </div>

      <div className="mt-20">
        <QRCodeCard />
      </div>

      <footer className="mt-24 text-xs text-slate-500">
        <Link href="/admin" className="hover:text-slate-300">
          admin
        </Link>
      </footer>
    </main>
  );
}
