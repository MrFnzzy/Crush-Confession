"use client";

import { motion } from "framer-motion";

type NoteStackProps = {
  liveCount: number | null;
};

const notes = [
  { rotate: -6, offset: 18, delay: 0.15, accent: "bg-rose" },
  { rotate: 4, offset: 8, delay: 0.05, accent: "bg-gold" },
  { rotate: -1.5, offset: 0, delay: 0, accent: "bg-roseDeep" },
];

export default function NoteStack({ liveCount }: NoteStackProps) {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="relative h-72">
        {notes.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24, rotate: note.rotate }}
            animate={{ opacity: 1, y: 0, rotate: note.rotate }}
            transition={{ duration: 0.6, delay: note.delay, ease: "easeOut" }}
            className="pin animate-floaty absolute inset-x-0 rounded-note bg-paper p-6 shadow-noteLg"
            style={{
              top: note.offset,
              zIndex: i,
              animationDelay: `${note.delay * 2}s`,
            }}
          >
            <div className={`h-2 w-10 rounded-full ${note.accent}`} />
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-4/5 rounded-full bg-ink/10" />
              <div className="h-2.5 w-full rounded-full bg-ink/10" />
              <div className="h-2.5 w-2/3 rounded-full bg-ink/10" />
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-ink/10" />
              <div className="h-2 w-16 rounded-full bg-ink/10" />
            </div>
          </motion.div>
        ))}
      </div>

      {liveCount !== null && liveCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="glass mx-auto mt-6 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs text-slate-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-soft" />
          {liveCount.toLocaleString()} confession{liveCount === 1 ? "" : "s"} on the
          wall so far
        </motion.div>
      )}
    </div>
  );
}
