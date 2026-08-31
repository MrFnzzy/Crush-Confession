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
          <h1 className="mt-1 font-display text-3xl text-paper">
            Admin — {confessions.length} confession{confessions.length === 1 ? "" : "s"}
          </h1>
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
        <div className="space-y-6">
          {confessions.map((confession: ConfessionWithReplies) => (
            <ConfessionCard
              key={confession.id}
              isAdmin
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
        <Link href="/wall" className="text-xs text-slate-500 hover:text-slate-300">
          view public wall
        </Link>
      </footer>
    </main>
  );
}
