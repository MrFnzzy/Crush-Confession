"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function HomeHero() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10"
    >
      <motion.span
        variants={item}
        className="inline-flex items-center gap-2 rounded-full border border-paper/15 bg-paper/5 px-3 py-1 text-xs text-slate-300"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose animate-pulse-soft" />
        anonymous · no account needed
      </motion.span>

      <motion.h1
        variants={item}
        className="mt-5 font-display text-5xl leading-[1.05] text-paper sm:text-6xl lg:text-7xl"
      >
        Say the thing
        <br />
        you never{" "}
        <span className="text-gradient">said.</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-md text-base text-slate-300 sm:text-lg"
      >
        Write it down, leave your name out of it, and let it land on the
        wall for everyone to read — and maybe, to answer.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-10 flex flex-wrap items-center gap-4"
      >
        <Link
          href="/confess"
          className="group relative overflow-hidden rounded-full bg-rose px-8 py-3 font-medium text-paper shadow-glow transition hover:bg-roseDeep active:scale-[0.98]"
        >
          <span className="relative z-10">Write a confession</span>
        </Link>
        <Link
          href="/wall"
          className="rounded-full border border-paper/25 px-8 py-3 font-medium text-paper transition hover:border-paper/60 hover:bg-paper/5 active:scale-[0.98]"
        >
          Read the wall
        </Link>
      </motion.div>
    </motion.div>
  );
}
