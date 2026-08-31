"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function HomeHero() {
  return (
    <div className="relative max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.24em] text-lime">
        <span className="h-px w-10 bg-lime" /> the internet&apos;s loudest quiet place
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="font-display text-[clamp(4.2rem,13vw,10.5rem)] font-medium leading-[.78] tracking-[-.08em] text-paper"
      >
        Say the
        <span className="block font-body font-extrabold tracking-[-0.11em] text-coral display-shadow">thing.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="mt-9 max-w-md text-base leading-relaxed text-muted sm:text-lg"
      >
        A tiny corner of the internet for the giant feelings you keep typing, deleting, and never sending.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-9 flex flex-wrap items-center gap-4">
        <Link href="/confess" className="neon-button rounded-full bg-lime px-7 py-4 text-sm font-extrabold text-night">Drop a secret →</Link>
        <Link href="/wall" className="rounded-full border border-white/20 px-7 py-4 text-sm font-bold text-paper transition hover:border-coral hover:bg-coral/10">Enter the wall</Link>
      </motion.div>

      <div className="mt-14 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[.16em] text-muted">
        <div className="flex -space-x-2">
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-night bg-coral text-night">♥</span>
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-night bg-violet text-paper">✦</span>
          <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-night bg-lime text-night">+</span>
        </div>
        <span>real people · zero names · no cringe</span>
      </div>
    </div>
  );
}
