import type { Confession, Reply } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import WallLive from "@/components/WallLive";
import ShutdownScreen from "@/components/ShutdownScreen";
import { redactConfessionForGuessing } from "@/lib/guess";
import { getSiteSettings } from "@/lib/siteSettings";

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

export default async function WallPage({ searchParams }: { searchParams: { sort?: string } }) {
  const { shutdown, shutdownMessage } = await getSiteSettings();
  if (shutdown) return <ShutdownScreen message={shutdownMessage} />;

  const sortTop = searchParams.sort === "top";
  const { confessions, failed } = await getConfessions(sortTop);
  const serialized = confessions.map((confession) =>
    redactConfessionForGuessing({
      ...confession,
      createdAt: confession.createdAt.toISOString(),
      replies: confession.replies.map((reply) => ({ ...reply, createdAt: reply.createdAt.toISOString() })),
    })
  );

  return (
    <>
      <Navbar />
      <main className="site-grid min-h-screen px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <WallLive initialConfessions={serialized} initialFailed={failed} sortTop={sortTop} />
        </div>
      </main>
    </>
  );
}
