"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="font-display text-sm italic text-gold">unspoken</span>
      <h1 className="mt-4 font-display text-3xl text-paper">
        Something tore at the edges.
      </h1>
      <p className="mt-3 text-sm text-slate-300">
        That wasn&apos;t supposed to happen. You can try again, or head back
        and pick up where you left off.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-rose px-6 py-3 text-sm font-medium text-paper transition hover:bg-roseDeep"
        >
          Try again
        </button>
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
