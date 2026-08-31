import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ConfessionCard from "@/components/ConfessionCard";

type ConfessionWithReplies = Confession & { replies: Reply[] };

export const dynamic = "force-dynamic";

export default async function WallPage() {
  const confessions = await prisma.confession.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      replies: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <span className="font-display text-sm tracking-wide text-gold">unspoken</span>
          <h1 className="mt-1 font-display text-3xl text-paper">The wall</h1>
        </div>
        <Link
          href="/confess"
          className="rounded-full bg-rose px-5 py-2 text-sm font-medium text-paper transition hover:bg-roseDeep"
        >
          Write one
        </Link>
      </div>

      {confessions.length === 0 ? (
        <p className="rounded-note bg-paper/10 p-8 text-center text-slate-300">
          Nothing here yet. Be the first to say it.
        </p>
      ) : (
        <div className="space-y-6">
          {confessions.map((confession: ConfessionWithReplies) => (
            <ConfessionCard
              key={confession.id}
              confession={{
                ...confession,
                number: confession.id,
                createdAt: confession.createdAt.toISOString(),
                replies: confession.replies.map((reply: Reply) => ({
                  ...reply,
                  createdAt: reply.createdAt.toISOString(),
                })),
              }}
            />
          ))}
        </div>
      )}

      <footer className="mt-16 text-center">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
          back home
        </Link>
      </footer>
    </main>
  );
}
