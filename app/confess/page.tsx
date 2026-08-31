"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConfessPage() {
  const router = useRouter();
  const [crushName, setCrushName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!crushName.trim() || !message.trim()) {
      setError("Fill in both fields before sending it out.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crushName, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Try again.");
      }

      router.push("/wall");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm text-slate-400 hover:text-paper">
        ← back
      </Link>

      <div className="w-full rounded-note bg-paper p-8 text-ink shadow-[0_14px_0_rgba(0,0,0,0.25)]">
        <h1 className="font-display text-3xl">Write it down</h1>
        <p className="mt-2 text-sm text-slateInk">
          No names, no accounts — just you and what you want to say.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label
              htmlFor="crushName"
              className="mb-1 block text-sm text-slateInk"
            >
              Who's this for?
            </label>
            <input
              id="crushName"
              value={crushName}
              onChange={(e) => setCrushName(e.target.value)}
              maxLength={80}
              placeholder="A name, a nickname, 'the guy from the bus'..."
              className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 focus:border-rose"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-sm text-slateInk"
            >
              What do you want to say?
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={6}
              placeholder="Say it here. This is the one place you can."
              className="w-full resize-none rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 focus:border-rose"
            />
            <span className="mt-1 block text-right text-xs text-slateInk/60">
              {message.length}/1000
            </span>
          </div>

          {error && <p className="text-sm text-roseDeep">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-full bg-rose px-6 py-3 font-medium text-paper transition hover:bg-roseDeep disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Post it anonymously"}
          </button>
        </form>
      </div>
    </main>
  );
}
