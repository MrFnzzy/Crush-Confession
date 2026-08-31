"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINKS = [
  { href: "/wall", label: "The wall" },
  { href: "/confess", label: "Confess" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:mt-4 sm:rounded-full sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 font-display text-lg italic text-gold transition hover:opacity-80"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full bg-rose/20 text-sm not-italic text-rose"
          >
            ✦
          </span>
          unspoken
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-rose text-paper"
                    : "text-slate-300 hover:bg-paper/10 hover:text-paper"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid h-9 w-9 place-items-center rounded-full text-paper transition hover:bg-paper/10 sm:hidden"
        >
          <div className="relative h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 h-[2px] w-4 rounded bg-paper transition ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-[2px] w-4 rounded bg-paper transition ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-[2px] w-4 rounded bg-paper transition ${
                open ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="glass mx-4 mt-2 overflow-hidden rounded-2xl sm:hidden"
          >
            <div className="flex flex-col p-2">
              {LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-rose text-paper"
                        : "text-slate-300 hover:bg-paper/10 hover:text-paper"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
