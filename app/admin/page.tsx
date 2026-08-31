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

export default async function AdminPage() {
  const authed = isAdmin();

  if (!authed) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-6">
        <AdminLoginForm />
      </main>
    );
  }

  const confessions = await prisma.confession.findMany({
    orderBy: { id: "desc" },
    include: { replies: { orderBy: { id: "asc" } } },
  });

  return (
    <main className="corkboard min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="font-display text-sm italic text-gold">unspoken</span>
            <h1 className="mt-1 font-display text-3xl text-paper">Admin</h1>
            <p className="mt-1 text-sm text-slate-400">
              {confessions.length} confession{confessions.length === 1 ? "" : "s"} on the wall
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mb-10">
          <QRCodeCard />
        </div>

        {confessions.length === 0 ? (
          <p className="rounded-note bg-paper/10 p-8 text-center text-slate-300">
            Nothing to moderate yet.
          </p>
        ) : (
          <div className="note-tilt columns-1 gap-8 space-y-8 sm:columns-2 lg:columns-3">
            {confessions.map((c: ConfessionWithReplies) => (
              <div key={c.id} className="break-inside-avoid">
                <ConfessionCard
                  isAdmin
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
