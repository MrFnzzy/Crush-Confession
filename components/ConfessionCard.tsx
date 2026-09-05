"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/Toast";
import GifPicker, { PickedGif } from "@/components/GifPicker";
import NotifyBell from "@/components/NotifyBell";

type Reply = { id: number; message: string; senderNickname: string | null; gifUrl?: string | null; createdAt: string };
type Confession = {
  id: number;
  crushName: string | null;
  crushNameLength?: number;
  message: string;
  senderNickname: string | null;
  gifUrl?: string | null;
  guessEnabled?: boolean;
  relateCount: number;
  viewCount?: number;
  createdAt: string;
  replies: Reply[];
};

function timeAgo(dateString: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  for (const [secs, label] of [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]] as [number, string][]) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
}

const RELATED_KEY = "unspoken_related_ids";
const GUESSED_KEY = "unspoken_guessed_names";
const VIEWED_KEY = "unspoken_viewed_ids";
const MAX_REPLY_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;
const MAX_GUESS_LENGTH = 80;

function getRelatedIds(): number[] { try { const raw = window.localStorage.getItem(RELATED_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function saveRelatedId(id: number) { try { window.localStorage.setItem(RELATED_KEY, JSON.stringify([...getRelatedIds(), id])); } catch {} }

function getViewedIds(): number[] { try { const raw = window.localStorage.getItem(VIEWED_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function saveViewedId(id: number) { try { window.localStorage.setItem(VIEWED_KEY, JSON.stringify([...getViewedIds(), id])); } catch {} }

function getGuessedNames(): Record<string, string> { try { const raw = window.localStorage.getItem(GUESSED_KEY); const parsed = raw ? JSON.parse(raw) : {}; return parsed && typeof parsed === "object" ? parsed : {}; } catch { return {}; } }
function saveGuessedName(id: number, name: string) { try { window.localStorage.setItem(GUESSED_KEY, JSON.stringify({ ...getGuessedNames(), [id]: name })); } catch {} }

/** Turns a hidden name's length into a run of blanks, grouped so a
 * multi-word name (e.g. length hint for "Juan Dela Cruz") still reads as
 * separate words rather than one long dash. We don't know word breaks
 * server-side without leaking the name, so we render one steady group. */
function blanksForLength(length: number) {
  const count = Math.max(1, Math.min(length, 24));
  return Array.from({ length: count }, () => "_").join(" ");
}

const SPARKLE_POSITIONS = [
  { top: "-10%", left: "4%", delay: 0 },
  { top: "-18%", left: "28%", delay: 0.06 },
  { top: "-14%", left: "55%", delay: 0.03 },
  { top: "-8%", left: "78%", delay: 0.09 },
  { top: "40%", left: "-8%", delay: 0.12 },
  { top: "35%", left: "104%", delay: 0.05 },
  { top: "90%", left: "18%", delay: 0.15 },
  { top: "85%", left: "68%", delay: 0.08 },
];

function GuessWhoGame({ confessionId, crushNameLength, revealedName, onRevealed }: { confessionId: number; crushNameLength: number; revealedName: string | null; onRevealed: (name: string) => void }) {
  const toast = useToast();
  const [guess, setGuess] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrongShake, setWrongShake] = useState(0);
  const [justSolved, setJustSolved] = useState(false);

  async function submitGuess() {
    const trimmed = guess.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/confessions/${confessionId}/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.push(data.error || "Couldn't check that guess.", "error");
        return;
      }
      if (data.correct) {
        saveGuessedName(confessionId, data.crushName);
        setJustSolved(true);
        onRevealed(data.crushName);
      } else {
        setWrongShake((n) => n + 1);
        setGuess("");
      }
    } catch {
      toast.push("Couldn't check that guess — try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (revealedName) {
    return (
      <div className="relative mt-1 flex flex-wrap items-baseline gap-2 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-night/45">to:</span>
        <motion.span
          key={justSolved ? "solved" : "loaded"}
          initial={justSolved ? { scale: 0.6, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 14 }}
          className="relative font-display text-2xl text-coral"
        >
          {revealedName}
          {justSolved && (
            <AnimatePresence>
              {SPARKLE_POSITIONS.map((pos, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.2, 1.15, 0.6], rotate: 90 }}
                  transition={{ duration: 0.85, delay: pos.delay, ease: "easeOut" }}
                  style={{ position: "absolute", top: pos.top, left: pos.left, pointerEvents: "none" }}
                  className="text-lime"
                  aria-hidden
                >
                  ✨
                </motion.span>
              ))}
            </AnimatePresence>
          )}
        </motion.span>
        <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-night">cracked it</span>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-baseline gap-2 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-night/45">to:</span>
        <span className="font-display text-2xl tracking-[.2em] text-violet">{blanksForLength(crushNameLength)}</span>
        <span className="rounded-full bg-violet/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-violet">guess who 🕵️</span>
      </div>
      <motion.div
        animate={wrongShake > 0 ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        key={wrongShake}
        className="mt-2 flex items-center gap-2"
      >
        <input
          value={guess}
          onChange={(event) => setGuess(event.target.value.slice(0, MAX_GUESS_LENGTH))}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitGuess(); } }}
          placeholder="type a name..."
          className="w-full max-w-[12rem] rounded-full border border-violet/30 bg-violet/5 px-3 py-1.5 text-sm text-night placeholder:text-night/35 focus:border-violet focus:outline-none"
        />
        <button
          onClick={submitGuess}
          disabled={busy || !guess.trim()}
          className="rounded-full bg-violet px-3 py-1.5 text-xs font-bold text-paper transition hover:bg-violet/85 disabled:opacity-50"
        >
          {busy ? "checking..." : "guess"}
        </button>
      </motion.div>
    </div>
  );
}

export default function ConfessionCard({ confession, isAdmin = false, index = 0, displayNumber }: { confession: Confession; isAdmin?: boolean; index?: number; displayNumber?: number }) {
  const router = useRouter();
  const toast = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [replyGif, setReplyGif] = useState<PickedGif | null>(null);
  const [replyGifPickerOpen, setReplyGifPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [hasRelated, setHasRelated] = useState(false);
  const [relateCount, setRelateCount] = useState(confession.relateCount);
  const [revealedName, setRevealedName] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setHasRelated(getRelatedIds().includes(confession.id)); }, [confession.id]);

  useEffect(() => {
    if (confession.guessEnabled && confession.crushName === null) {
      const stored = getGuessedNames()[String(confession.id)];
      if (stored) setRevealedName(stored);
    }
  }, [confession.id, confession.guessEnabled, confession.crushName]);

  // Impression tracking: count a "view" once this card actually scrolls
  // into the visitor's viewport (not just when it's rendered off-screen
  // in a long masonry column), and only once per browser. Admins moderating
  // their own dashboard shouldn't inflate the count.
  useEffect(() => {
    if (isAdmin) return;
    if (getViewedIds().includes(confession.id)) return;
    const node = articleRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            saveViewedId(confession.id);
            void fetch(`/api/confessions/${confession.id}/view`, { method: "POST", keepalive: true }).catch(() => {});
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [confession.id, isAdmin]);

  async function submitReply() {
    const trimmed = replyText.trim();
    if ((!trimmed && !replyGif) || busy) return;
    if (trimmed.length > MAX_REPLY_LENGTH) { setError(`Keep it under ${MAX_REPLY_LENGTH} characters.`); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/confessions/${confession.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed, senderNickname: replyNickname.trim() || undefined, gifUrl: replyGif?.url }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.reason === "blocked_word") {
          toast.push(data.error || "That reply contains language we don't allow here.", "error");
          window.setTimeout(() => window.location.reload(), 1400);
          return;
        }
        throw new Error(data.error || "Couldn't post that reply.");
      }
      setReplyText(""); setReplyNickname(""); setReplyGif(null); setShowReplyForm(false); router.refresh();
    } catch (err) { const message = err instanceof Error ? err.message : "Couldn't post that reply."; setError(message); toast.push(message, "error"); setBusy(false); }
  }

  async function toggleRelate() {
    if (hasRelated || busy) return;
    setHasRelated(true); setRelateCount((value) => value + 1); saveRelatedId(confession.id);
    try { const res = await fetch(`/api/confessions/${confession.id}/react`, { method: "POST" }); if (!res.ok) throw new Error(); } catch { setRelateCount((value) => Math.max(0, value - 1)); toast.push("Couldn't save that — try again.", "error"); }
  }

  async function deleteConfession() {
    if (!confirm(`Delete Confession #${confession.id}? This can't be undone.`)) return;
    setDeleting(true);
    try { const res = await fetch(`/api/confessions/${confession.id}`, { method: "DELETE" }); if (!res.ok) throw new Error(); router.refresh(); } catch { setDeleting(false); toast.push("Couldn't delete that confession.", "error"); }
  }

  async function deleteReply(replyId: number) {
    if (!confirm("Delete this reply?")) return;
    setBusy(true);
    try { const res = await fetch(`/api/replies/${replyId}`, { method: "DELETE" }); if (!res.ok) throw new Error(); router.refresh(); } catch { setBusy(false); toast.push("Couldn't delete that reply.", "error"); }
  }

  const isMystery = !isAdmin && Boolean(confession.guessEnabled) && confession.crushName === null;

  return (
    <motion.article ref={articleRef} initial={{ opacity: 0, y: 16 }} animate={{ opacity: deleting ? .4 : 1, y: 0, scale: deleting ? .98 : 1 }} transition={{ duration: .35, delay: Math.min(index, 8) * .04 }} className="relative overflow-hidden rounded-2xl border border-night/10 bg-paper p-5 text-night shadow-[8px_8px_0_#ff4d6d] sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-night px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-lime">signal #{String(displayNumber ?? confession.id).padStart(3, "0")}</span><div className="flex items-center gap-2">{isAdmin && <span className="rounded-full bg-night/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-night/55" title="views">👁 {(confession.viewCount ?? 0).toLocaleString()}</span>}<span className="font-mono text-[10px] uppercase tracking-wider text-night/45">{timeAgo(confession.createdAt)}</span></div></div>

      <div className="mt-7">
        {isMystery ? (
          <GuessWhoGame confessionId={confession.id} crushNameLength={confession.crushNameLength ?? 8} revealedName={revealedName} onRevealed={setRevealedName} />
        ) : (
          <div className="flex flex-wrap items-baseline gap-2 text-sm"><span className="font-mono text-[10px] uppercase tracking-widest text-night/45">to:</span><span className="font-display text-2xl text-coral">{revealedName ?? confession.crushName}</span></div>
        )}
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words font-display text-[1.7rem] leading-[1.02] tracking-tight sm:text-3xl">{confession.message}</p>
      {confession.gifUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={confession.gifUrl} alt="attached gif" loading="lazy" className="mt-4 max-h-64 w-auto rounded-xl border border-night/10 object-cover" />
      )}
      <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-night/45">— {confession.senderNickname || "anonymous"}</p>

      {confession.replies.length > 0 && <ul className="mt-6 space-y-3 border-l-2 border-coral/35 pl-4">{confession.replies.map((reply) => <li key={reply.id} className="text-sm"><div className="flex items-start justify-between gap-2"><div className="min-w-0">{reply.message && <p className="whitespace-pre-wrap break-words">{reply.message}</p>}{reply.gifUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reply.gifUrl} alt="reply gif" loading="lazy" className="mt-2 max-h-40 w-auto rounded-lg border border-night/10 object-cover" />
      )}</div>{isAdmin && <button onClick={() => deleteReply(reply.id)} disabled={busy} className="shrink-0 font-mono text-[10px] uppercase text-coral hover:underline">remove</button>}</div><span className="font-mono text-[10px] uppercase tracking-wide text-night/40">— {reply.senderNickname || "anonymous"} · {timeAgo(reply.createdAt)}</span></li>)}</ul>}

      <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-night/10 pt-4"><button onClick={toggleRelate} disabled={hasRelated} aria-pressed={hasRelated} className={`rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 ${hasRelated ? "bg-coral text-paper" : "bg-night/5 hover:bg-coral hover:text-paper"}`}>{hasRelated ? "♥" : "♡"} {relateCount > 0 ? relateCount : ""} relate</button><button onClick={() => setShowReplyForm((value) => !value)} className="rounded-full px-3 py-2 text-sm font-bold text-coral transition hover:bg-coral/10">{showReplyForm ? "cancel" : "reply →"}</button><NotifyBell confessionId={confession.id} />{isAdmin && <button onClick={deleteConfession} disabled={deleting} className="rounded-full px-3 py-2 text-sm text-night/45 hover:bg-night/5">{deleting ? "deleting..." : "delete"}</button>}</div>

      {showReplyForm && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex flex-col gap-2 overflow-hidden rounded-xl bg-night/5 p-3"><textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={MAX_REPLY_LENGTH} rows={2} placeholder="Say something back..." className="w-full resize-none rounded-lg border border-night/10 bg-white px-3 py-2 text-sm text-night placeholder:text-night/35 focus:border-coral" /><input value={replyNickname} onChange={(event) => setReplyNickname(event.target.value)} maxLength={MAX_NICKNAME_LENGTH} placeholder="Nickname (optional)" className="w-full rounded-lg border border-night/10 bg-white px-3 py-2 text-sm text-night placeholder:text-night/35 focus:border-coral" />{replyGif ? (<div className="relative w-fit"><img src={replyGif.previewUrl} alt={replyGif.alt} className="h-24 w-auto rounded-lg border border-night/10 object-cover" /><button onClick={() => setReplyGif(null)} aria-label="Remove gif" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-night text-xs text-lime shadow">✕</button></div>) : (<button onClick={() => setReplyGifPickerOpen(true)} className="w-fit rounded-full bg-night/10 px-3 py-1.5 text-xs font-bold text-night/70 transition hover:bg-coral hover:text-paper"><span aria-hidden>🎬</span> add a gif</button>)}<div className="flex items-center justify-between gap-2">{error ? <p className="text-xs text-coral" role="alert">{error}</p> : <span className="font-mono text-[10px] text-night/40">{replyText.length}/{MAX_REPLY_LENGTH}</span>}<button onClick={submitReply} disabled={busy || (!replyText.trim() && !replyGif)} className="rounded-full bg-night px-4 py-2 text-xs font-bold text-lime transition hover:bg-coral hover:text-paper disabled:opacity-50">{busy ? "posting..." : "post reply"}</button></div></motion.div>}
      <GifPicker open={replyGifPickerOpen} onClose={() => setReplyGifPickerOpen(false)} onPick={setReplyGif} />
    </motion.article>
  );
}
