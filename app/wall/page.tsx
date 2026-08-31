import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfessionCard from "@/components/ConfessionCard";
import SortToggle from "@/components/SortToggle";

export const dynamic = "force-dynamic";

type ConfessionWithReplies = Confession & { replies: Reply[] };

export default async function WallPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sortTop = searchParams.sort === "top";

  const confessions = await prisma.confession.findMany({
    orderBy: sortTop ? [{ relateCount: "desc" }, { id: "desc" }] : { id: "desc" },
    include: { replies: { orderBy: { id: "asc" } } },
  });

  return (
    <main className="corkboard min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-display text-sm italic text-gold">unspoken</span>
            <h1 className="mt-1 font-display text-3xl text-paper">The wall</h1>
          </div>
          <Link
            href="/confess"
            className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-paper transition hover:bg-roseDeep"
          >
            Write one
          </Link>
        </div>

        {confessions.length > 0 && (
          <div className="mb-10">
            <SortToggle />
          </div>
        )}

        {confessions.length === 0 ? (
          <p className="rounded-note bg-paper/10 p-8 text-center text-slate-300">
            Nothing here yet. Be the first to say it.
          </p>
        ) : (
          <div className="note-tilt columns-1 gap-8 space-y-8 sm:columns-2 lg:columns-3">
            {confessions.map((c: ConfessionWithReplies) => (
              <div key={c.id} className="break-inside-avoid">
                <ConfessionCard
                  confession={{
                    ...c,
                    createdAt: c.createdAt.toISOString(),
                    replies: c.replies.map((r: Reply) => ({
                      ...r,
                      createdAt: r.createdAt.toISOString(),
                    })),
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
            back home
          </Link>
        </footer>
      </div>
    </main>
  );
}
