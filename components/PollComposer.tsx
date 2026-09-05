"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  MAX_POLL_OPTIONS,
  MAX_POLL_OPTION_LENGTH,
  MAX_POLL_QUESTION_LENGTH,
  MIN_POLL_OPTIONS,
  PollOptionData,
} from "@/lib/poll";

type AdminPoll = {
  question: string;
  options: PollOptionData[];
  active: boolean;
  showOnShutdown: boolean;
  pushVersion: number;
  totalVotes: number;
};

const EMPTY_OPTIONS = ["", ""];

export default function PollComposer() {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [poll, setPoll] = useState<AdminPoll | null>(null);
  const [question, setQuestion] = useState("");
  const [optionInputs, setOptionInputs] = useState<string[]>(EMPTY_OPTIONS);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/poll", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: AdminPoll) => {
        setPoll(data);
        if (data.question) setQuestion(data.question);
        if (data.options.length) setOptionInputs(data.options.map((o) => o.text));
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const hasPoll = !!poll?.question;

  function updateOption(index: number, value: string) {
    setOptionInputs((prev) => prev.map((o, i) => (i === index ? value : o)));
  }
  function addOption() {
    setOptionInputs((prev) => (prev.length >= MAX_POLL_OPTIONS ? prev : [...prev, ""]));
  }
  function removeOption(index: number) {
    setOptionInputs((prev) => (prev.length <= MIN_POLL_OPTIONS ? prev : prev.filter((_, i) => i !== index)));
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options: optionInputs }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save that.");
      setPoll(data);
      setOptionInputs(data.options.map((o: PollOptionData) => o.text));
      toast.push("Poll saved. Votes reset for the new version.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save that.";
      setError(msg);
      toast.push(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus(active: boolean, showOnShutdown: boolean) {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      const res = await fetch("/api/admin/poll/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active, showOnShutdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save that.");
      setPoll(data);
      toast.push(active ? "Poll is open for voting." : "Poll closed.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save that.";
      toast.push(msg, "error");
    } finally {
      setStatusSaving(false);
    }
  }

  async function push() {
    if (pushing) return;
    setPushing(true);
    try {
      const res = await fetch("/api/admin/poll/push", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't push that.");
      setPoll(data);
      toast.push("Pushed — it'll pop up for everyone on the site.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't push that.";
      toast.push(msg, "error");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Write a question and a few options, then open it for voting — it shows as a pinned card at the top of the
          wall. Turn on &ldquo;show during shutdown&rdquo; separately if you also want it under the shutdown message
          when the site is closed. &ldquo;Push popup&rdquo; forces it in front of everyone browsing right now; they
          can close it, and pushing again brings it right back for everyone, even people who already closed it.
        </p>
      </div>

      <form onSubmit={saveQuestion} className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">question</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={MAX_POLL_QUESTION_LENGTH}
          rows={2}
          placeholder="e.g. Should we do another wall for finals week?"
          className="mt-3 w-full resize-none rounded-xl border border-white/15 bg-night/40 px-4 py-3 text-sm text-paper placeholder:text-muted/60 focus:border-lime focus:outline-none"
        />

        <span className="mb-2 mt-6 block font-mono text-[10px] uppercase tracking-[.2em] text-muted">options</span>
        <div className="space-y-2.5">
          {optionInputs.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={value}
                onChange={(e) => updateOption(i, e.target.value)}
                maxLength={MAX_POLL_OPTION_LENGTH}
                placeholder={`Option ${i + 1}`}
                className="w-full rounded-xl border border-white/15 bg-night/40 px-4 py-2.5 text-sm text-paper placeholder:text-muted/60 focus:border-lime focus:outline-none"
              />
              {optionInputs.length > MIN_POLL_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  aria-label={`Remove option ${i + 1}`}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-2.5 text-muted transition hover:border-coral hover:text-coral"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {optionInputs.length < MAX_POLL_OPTIONS && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 font-mono text-[10px] uppercase tracking-widest text-lime transition hover:text-paper"
          >
            + add option
          </button>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-lime px-5 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:opacity-50"
          >
            {saving ? "Saving..." : hasPoll ? "Save changes (resets votes)" : "Create poll"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
      </form>

      <div className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">status</span>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={!!poll?.active}
            disabled={!loaded || !hasPoll || statusSaving}
            onClick={() => saveStatus(!poll?.active, !!poll?.showOnShutdown)}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
              poll?.active ? "bg-lime" : "bg-night/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition ${
                poll?.active ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <div className="text-sm leading-snug">
            <span className="font-bold text-paper">{poll?.active ? "Open for voting" : "Closed"}</span>
            <span className="mt-1 block text-xs text-muted">
              {hasPoll ? "Controls whether it shows on the wall at all." : "Write a question and options first."}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/10 bg-night/30 px-4 py-3">
          <button
            type="button"
            role="switch"
            aria-checked={!!poll?.showOnShutdown}
            disabled={!loaded || !hasPoll || statusSaving}
            onClick={() => saveStatus(!!poll?.active, !poll?.showOnShutdown)}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
              poll?.showOnShutdown ? "bg-violet" : "bg-night/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition ${
                poll?.showOnShutdown ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <div className="text-sm leading-snug">
            <span className="font-bold text-paper">Show during shutdown</span>
            <span className="mt-1 block text-xs text-muted">
              When the site is shut down, also show this poll under the shutdown message.
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={push}
            disabled={pushing || !hasPoll || !poll?.active}
            className="neon-button rounded-xl bg-coral px-5 py-3 text-sm font-bold text-paper transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pushing ? "Pushing..." : "Push popup to everyone"}
          </button>
          {!!poll?.pushVersion && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              pushed {poll.pushVersion} time{poll.pushVersion === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {!poll?.active && hasPoll && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">open the poll for voting to push it</p>
        )}

        {hasPoll && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">
              current results · {poll?.totalVotes ?? 0} total
            </span>
            <div className="mt-3 space-y-2">
              {poll?.options.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm text-paper/85">
                  <span>{o.text}</span>
                  <span className="font-mono text-xs text-muted">{o.votes}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
