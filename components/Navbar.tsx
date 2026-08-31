"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const LINKS = [
  { href: "/wall", label: "Read the wall" },
  { href: "/confess", label: "Drop a secret" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 px-4 pt-4 sm:px-8 sm:pt-6">
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
        <Link href="/" onClick={() => setOpen(false)} className="group flex items-center gap-3">
          <span className="grid h-9 w-9 rotate-3 place-items-center rounded-xl bg-coral text-lg font-black text-night transition group-hover:-rotate-6">✦</span>
          <span className="font-display text-xl italic tracking-tight text-paper">unspoken<span className="text-coral">.</span></span>
        </Link>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="mr-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-muted">
            <span className="pulse-dot h-2 w-2 rounded-full bg-lime" /> online / feelings loading
          </span>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${pathname === link.href ? "bg-coral text-paper" : "text-muted hover:bg-white/10 hover:text-paper"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-paper sm:hidden"
        >
          <span className="font-mono text-lg">{open ? "×" : "≡"}</span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-2 sm:hidden"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm font-bold ${pathname === link.href ? "bg-coral text-paper" : "text-muted hover:bg-white/10 hover:text-paper"}`}
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
