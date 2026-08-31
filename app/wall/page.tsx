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

export default async function WallPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sortTop = searchParams.sort === "top";
  const { confessions, failed } = await getConfessions(sortTop);

  return (
    <>
      <Navbar />
      <main className="corkboard min-h-screen px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-display text-sm italic text-gold">unspoken</span>
              <h1 className="mt-1 font-display text-3xl text-paper">The wall</h1>
            </div>
            <Link
              href="/confess"
              className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-paper shadow-glow transition hover:bg-roseDeep active:scale-95"
            >
              Write one
            </Link>
          </div>

          {failed ? (
            <div className="rounded-note bg-paper/10 p-8 text-center">
              <p className="text-slate-200">
                The wall couldn&apos;t load right now — the database might be
                unreachable.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Refresh the page in a moment to try again.
              </p>
            </div>
          ) : (
            <>
              {confessions.length > 0 && (
                <div className="mb-10">
                  <SortToggle />
                </div>
              )}

              {confessions.length === 0 ? (
                <div className="rounded-note bg-paper/10 p-10 text-center">
                  <p className="text-slate-200">Nothing here yet.</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Be the first to say it.
                  </p>
                  <Link
                    href="/confess"
                    className="mt-6 inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-medium text-paper transition hover:bg-roseDeep"
                  >
                    Write a confession
                  </Link>
                </div>
              ) : (
                <div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 sm:gap-8 sm:space-y-8 lg:columns-3">
                  {confessions.map((c: ConfessionWithReplies, i: number) => (
                    <div key={c.id} className="break-inside-avoid">
                      <ConfessionCard
                        index={i}
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
            </>
          )}
        </div>
      </main>
    </>
  );
}
