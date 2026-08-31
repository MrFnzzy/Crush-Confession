import Navbar from "@/components/Navbar";
import HomeHero from "@/components/HomeHero";
import NoteStack from "@/components/NoteStack";
import QRCodeCard from "@/components/QRCodeCard";
import { prisma } from "@/lib/prisma";

async function getConfessionCount(): Promise<number | null> {
  try {
    return await prisma.confession.count();
  } catch (err) {
    // The homepage should still render beautifully even if the database
    // is unreachable — the live count is a nice-to-have, not load-bearing.
    console.error("Failed to load confession count:", err);
    return null;
  }
}

const STEPS = [
  {
    title: "Write it down",
    body: "No sign-up, no name required. Just what you want to say, and who it's for.",
  },
  {
    title: "It lands on the wall",
    body: "Your words are pinned anonymously alongside everyone else's, instantly.",
  },
  {
    title: "Maybe, they answer",
    body: "Anyone can reply or relate — including, someday, the person it was written for.",
  },
];

export default async function HomePage() {
  const count = await getConfessionCount();

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <HomeHero />

          <div className="flex flex-col items-center gap-8">
            <NoteStack liveCount={count} />
            <div className="w-full max-w-xs">
              <QRCodeCard />
            </div>
          </div>
        </div>

        <section className="mt-28 sm:mt-36">
          <h2 className="text-center font-display text-2xl text-paper sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="glass rounded-2xl p-6 transition hover:bg-paper/10"
              >
                <span className="font-display text-3xl text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg text-paper">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
          <p>Be kind. Nothing hateful, nothing that names or targets someone to harm them.</p>
        </footer>
      </main>
    </>
  );
}
