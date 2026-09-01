import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="font-display text-sm italic text-gold">unspoken</span>
      <h1 className="mt-4 font-display text-4xl text-paper">
        Nothing pinned here.
      </h1>
      <p className="mt-3 text-sm text-slate-300">
        Whatever you were looking for isn&apos;t on this note. It might have
        been taken down, or the link might be off.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/wall"
          className="rounded-full bg-rose px-6 py-3 text-sm font-medium text-paper transition hover:bg-roseDeep"
        >
          Read the wall
        </Link>
        <Link
          href="/"
          className="rounded-full border border-paper/25 px-6 py-3 text-sm font-medium text-paper transition hover:border-paper/60"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
