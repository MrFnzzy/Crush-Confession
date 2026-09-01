"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

type BannedWord = { id: number; word: string };

export default function BannedWordsManager({
  defaultWords,
  customWords,
}: {
  defaultWords: string[];
  customWords: BannedWord[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [newWord, setNewWord] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function addWord(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const word = newWord.trim();
    if (!word) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/banned-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't add that word.");
      }
      setNewWord("");
      toast.push(`"${word}" added to the filter.`, "success");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't add that word.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeWord(id: number, word: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/banned-words/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.push(`"${word}" removed from the filter.`, "info");
      router.refresh();
    } catch {
      toast.push("Couldn't remove that word.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Every confession and reply is checked against this list before it's allowed to post — in English, Tagalog, and
          Bisaya. If someone tries to post something on this list, they get a warning and the page refreshes, clearing
          what they wrote. Matching ignores capitalization and most punctuation.
        </p>
      </div>

      <form onSubmit={addWord} className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">add a word or phrase</span>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="e.g. a slang word you're seeing show up"
            maxLength={60}
            className="w-full rounded-xl border border-white/15 bg-night/40 px-4 py-3 text-sm text-paper placeholder:text-muted/60 focus:border-lime focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !newWord.trim()}
            className="shrink-0 rounded-xl bg-lime px-6 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add to filter"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-coral" role="alert">{error}</p>}
      </form>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">
            built-in defaults ({defaultWords.length})
          </span>
          <p className="mt-2 text-xs text-muted/80">
            Always active — this baseline can't be removed from here, so the filter can't be accidentally turned off.
          </p>
          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl bg-night/30 p-3">
            <div className="flex flex-wrap gap-1.5">
              {defaultWords.map((w) => (
                <span key={w} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-paper/70">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">
            added by you ({customWords.length})
          </span>
          <p className="mt-2 text-xs text-muted/80">Words and phrases you've added on top of the defaults.</p>
          <div className="mt-4 max-h-64 overflow-y-auto">
            {customWords.length === 0 ? (
              <p className="mt-4 text-sm text-muted/60">None added yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {customWords.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-night/30 px-3 py-2 text-sm text-paper"
                  >
                    <span className="break-all">{w.word}</span>
                    <button
                      onClick={() => removeWord(w.id, w.word)}
                      disabled={deletingId === w.id}
                      className="shrink-0 font-mono text-[10px] uppercase text-coral hover:underline disabled:opacity-50"
                    >
                      {deletingId === w.id ? "..." : "remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
