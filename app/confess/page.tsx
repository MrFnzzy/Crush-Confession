"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ConfessPage() {
  const router = useRouter();
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!fromName.trim() || !toName.trim() || !message.trim()) {
      setError("Fill in every field before sending it out.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName, toName, message }),
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
          No accounts — just you and what you want to say.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="fromName" className="mb-1 block text-sm text-slateInk">
              Your nickname
            </label>
            <input
              id="fromName"
              value={fromName}
              onChange={(event) => setFromName(event.target.value)}
              maxLength={100}
              placeholder="Secret admirer, a friend, someone anonymous..."
              className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 focus:border-rose"
            />
          </div>

          <div>
            <label htmlFor="toName" className="mb-1 block text-sm text-slateInk">
              Who&apos;s this for?
            </label>
            <input
              id="toName"
              value={toName}
              onChange={(event) => setToName(event.target.value)}
              maxLength={100}
              placeholder="A name, a nickname, or the guy from the bus..."
              className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 focus:border-rose"
            />
          </div>

          <div>
            <label htmlFor="message" className="mb-1 block text-sm text-slateInk">
              What do you want to say?
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={6}
              placeholder="Say it here. This is the one place you can."
              className="w-full resize-none rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 focus:border-rose"
            />
            <span className="mt-1 block text-right text-xs text-slateInk/60">
              {message.length}/2000
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
