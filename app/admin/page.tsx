import Link from "next/link";
import type { Confession, Reply } from "@prisma/client";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import QRCodeCard from "@/components/QRCodeCard";
import ConfessionCard from "@/components/ConfessionCard";

type ConfessionWithReplies = Confession & { replies: Reply[] };

export const dynamic = "force-dynamic";

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
  const authed = isAdmin();

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6">
        <AdminLoginForm />
      </main>
    );
  }

  const { confessions, failed } = await getConfessions();

  return (
    <main className="corkboard min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-display text-sm italic text-gold">unspoken</span>
            <h1 className="mt-1 font-display text-3xl text-paper">Admin</h1>
            <p className="mt-1 text-sm text-slate-400">
              {failed
                ? "Couldn't reach the database."
                : `${confessions.length} confession${confessions.length === 1 ? "" : "s"} on the wall`}
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mb-10 max-w-xs">
          <QRCodeCard />
        </div>

        {failed ? (
          <div className="rounded-note bg-paper/10 p-8 text-center text-slate-300">
            The database looks unreachable right now. Refresh to try again.
          </div>
        ) : confessions.length === 0 ? (
          <p className="rounded-note bg-paper/10 p-8 text-center text-slate-300">
            Nothing to moderate yet.
          </p>
        ) : (
          <div className="note-tilt columns-1 gap-6 space-y-6 sm:columns-2 sm:gap-8 sm:space-y-8 lg:columns-3">
            {confessions.map((c: ConfessionWithReplies, i: number) => (
              <div key={c.id} className="break-inside-avoid">
                <ConfessionCard
                  isAdmin
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

        <footer className="mt-16 text-center">
          <Link href="/wall" className="text-xs text-slate-500 hover:text-slate-300">
            view public wall
          </Link>
        </footer>
      </div>
    </main>
  );
}
