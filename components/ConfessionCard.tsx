"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/Toast";

type Reply = { id: number; message: string; senderNickname: string | null; createdAt: string };
type Confession = { id: number; crushName: string; message: string; senderNickname: string | null; relateCount: number; createdAt: string; replies: Reply[] };

function timeAgo(dateString: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
  for (const [secs, label] of [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]] as [number, string][]) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return "just now";
}

const RELATED_KEY = "unspoken_related_ids";
const MAX_REPLY_LENGTH = 500;
const MAX_NICKNAME_LENGTH = 40;
function getRelatedIds(): number[] { try { const raw = window.localStorage.getItem(RELATED_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function saveRelatedId(id: number) { try { window.localStorage.setItem(RELATED_KEY, JSON.stringify([...getRelatedIds(), id])); } catch {} }

export default function ConfessionCard({ confession, isAdmin = false, index = 0, displayNumber }: { confession: Confession; isAdmin?: boolean; index?: number; displayNumber?: number }) {
  const router = useRouter();
  const toast = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [hasRelated, setHasRelated] = useState(false);
  const [relateCount, setRelateCount] = useState(confession.relateCount);

  useEffect(() => { setHasRelated(getRelatedIds().includes(confession.id)); }, [confession.id]);

  async function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed || busy) return;
    if (trimmed.length > MAX_REPLY_LENGTH) { setError(`Keep it under ${MAX_REPLY_LENGTH} characters.`); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/confessions/${confession.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed, senderNickname: replyNickname.trim() || undefined }) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Couldn't post that reply."); }
      setReplyText(""); setReplyNickname(""); setShowReplyForm(false); router.refresh();
    } catch (err) { const message = err instanceof Error ? err.message : "Couldn't post that reply."; setError(message); toast.push(message, "error"); } finally { setBusy(false); }
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

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: deleting ? .4 : 1, y: 0, scale: deleting ? .98 : 1 }} transition={{ duration: .35, delay: Math.min(index, 8) * .04 }} className="relative overflow-hidden rounded-2xl border border-night/10 bg-paper p-5 text-night shadow-[8px_8px_0_#ff4d6d] sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-night px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-lime">signal #{String(displayNumber ?? confession.id).padStart(3, "0")}</span><span className="font-mono text-[10px] uppercase tracking-wider text-night/45">{timeAgo(confession.createdAt)}</span></div>
      <div className="mt-7 flex flex-wrap items-baseline gap-2 text-sm"><span className="font-mono text-[10px] uppercase tracking-widest text-night/45">to:</span><span className="font-display text-2xl text-coral">{confession.crushName}</span></div>
      <p className="mt-4 whitespace-pre-wrap break-words font-display text-[1.7rem] leading-[1.02] tracking-tight sm:text-3xl">{confession.message}</p>
      <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-night/45">— {confession.senderNickname || "anonymous"}</p>

      {confession.replies.length > 0 && <ul className="mt-6 space-y-3 border-l-2 border-coral/35 pl-4">{confession.replies.map((reply) => <li key={reply.id} className="text-sm"><div className="flex items-start justify-between gap-2"><p className="whitespace-pre-wrap break-words">{reply.message}</p>{isAdmin && <button onClick={() => deleteReply(reply.id)} disabled={busy} className="shrink-0 font-mono text-[10px] uppercase text-coral hover:underline">remove</button>}</div><span className="font-mono text-[10px] uppercase tracking-wide text-night/40">— {reply.senderNickname || "anonymous"} · {timeAgo(reply.createdAt)}</span></li>)}</ul>}

      <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-night/10 pt-4"><button onClick={toggleRelate} disabled={hasRelated} aria-pressed={hasRelated} className={`rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 ${hasRelated ? "bg-coral text-paper" : "bg-night/5 hover:bg-coral hover:text-paper"}`}>{hasRelated ? "♥" : "♡"} {relateCount > 0 ? relateCount : ""} relate</button><button onClick={() => setShowReplyForm((value) => !value)} className="rounded-full px-3 py-2 text-sm font-bold text-coral transition hover:bg-coral/10">{showReplyForm ? "cancel" : "reply →"}</button>{isAdmin && <button onClick={deleteConfession} disabled={deleting} className="rounded-full px-3 py-2 text-sm text-night/45 hover:bg-night/5">{deleting ? "deleting..." : "delete"}</button>}</div>

      {showReplyForm && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex flex-col gap-2 overflow-hidden rounded-xl bg-night/5 p-3"><textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={MAX_REPLY_LENGTH} rows={2} placeholder="Say something back..." className="w-full resize-none rounded-lg border border-night/10 bg-white px-3 py-2 text-sm text-night placeholder:text-night/35 focus:border-coral" /><input value={replyNickname} onChange={(event) => setReplyNickname(event.target.value)} maxLength={MAX_NICKNAME_LENGTH} placeholder="Nickname (optional)" className="w-full rounded-lg border border-night/10 bg-white px-3 py-2 text-sm text-night placeholder:text-night/35 focus:border-coral" /><div className="flex items-center justify-between gap-2">{error ? <p className="text-xs text-coral" role="alert">{error}</p> : <span className="font-mono text-[10px] text-night/40">{replyText.length}/{MAX_REPLY_LENGTH}</span>}<button onClick={submitReply} disabled={busy || !replyText.trim()} className="rounded-full bg-night px-4 py-2 text-xs font-bold text-lime transition hover:bg-coral hover:text-paper disabled:opacity-50">{busy ? "posting..." : "post reply"}</button></div></motion.div>}
    </motion.article>
  );
}
