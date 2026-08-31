"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NICKNAME_LENGTH = 40;

export default function ConfessPage() {
  const router = useRouter();
  const toast = useToast();
  const [crushName, setCrushName] = useState("");
  const [message, setMessage] = useState("");
  const [senderNickname, setSenderNickname] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nameLeft = MAX_NAME_LENGTH - crushName.length;
  const messageLeft = MAX_MESSAGE_LENGTH - message.length;
  const canSubmit = crushName.trim().length > 0 && message.trim().length > 0 && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Reconnect and try again.");
      return;
    }
    if (!crushName.trim() || !message.trim()) {
      setError("Fill in both fields before sending it out.");
      return;
    }
    if (crushName.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      setError("One of those fields is too long — trim it down a little.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crushName: crushName.trim(),
          message: message.trim(),
          senderNickname: senderNickname.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Try again.");
      }

      toast.push("Posted anonymously. It's on the wall now.", "success");
      router.push("/wall");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong — check your connection and try again.";
      setError(msg);
      toast.push(msg, "error");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-slate-400 transition hover:text-paper"
        >
          ← back
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="rounded-note bg-paper p-6 text-ink shadow-noteLg sm:p-8"
          >
            <h1 className="font-display text-3xl">Write it down</h1>
            <p className="mt-2 text-sm text-slateInk">
              No account, no name required — just you and what you want to say.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="crushName" className="block text-sm text-slateInk">
                    Who&apos;s this for?
                  </label>
                  <span
                    className={`text-xs ${
                      nameLeft < 10 ? "text-roseDeep" : "text-slateInk/50"
                    }`}
                  >
                    {crushName.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                <input
                  id="crushName"
                  value={crushName}
                  onChange={(e) => setCrushName(e.target.value.slice(0, MAX_NAME_LENGTH))}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="A name, a nickname, 'the guy from the bus'..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 transition focus:border-rose"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="message" className="block text-sm text-slateInk">
                    What do you want to say?
                  </label>
                  <span
                    className={`text-xs ${
                      messageLeft < 50 ? "text-roseDeep" : "text-slateInk/50"
                    }`}
                  >
                    {message.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={6}
                  placeholder="Say it here. This is the one place you can."
                  className="w-full resize-none rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 transition focus:border-rose"
                />
              </div>

              <div className="rounded-lg border border-dashed border-ink/15 bg-paperDim/50 p-4">
                <label htmlFor="senderNickname" className="mb-1 block text-sm text-slateInk">
                  Sign it with a nickname? <span className="text-slateInk/50">(optional)</span>
                </label>
                <input
                  id="senderNickname"
                  value={senderNickname}
                  onChange={(e) =>
                    setSenderNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))
                  }
                  maxLength={MAX_NICKNAME_LENGTH}
                  placeholder="e.g. 'a secret admirer', 'someone in your class'..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-ink/15 bg-white px-4 py-3 text-ink placeholder:text-slateInk/50 transition focus:border-rose"
                />
                <p className="mt-1 text-xs text-slateInk/60">
                  Leave it blank to post as fully anonymous.
                </p>
              </div>

              {error && (
                <p className="text-sm text-roseDeep" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 rounded-full bg-rose px-6 py-3 font-medium text-paper shadow-glow transition hover:bg-roseDeep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {submitting ? "Sending..." : "Post it anonymously"}
              </button>
            </form>
          </motion.div>

          <div className="hidden lg:block">
            <p className="mb-4 text-sm text-slate-400">How it&apos;ll look on the wall</p>
            <div className="pin relative rotate-1 rounded-note bg-paper p-6 text-ink shadow-note">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-block rounded-full bg-ink px-3 py-1 font-mono text-xs text-paper">
                  #—
                </span>
                <span className="text-xs text-slateInk/60">just now</span>
              </div>
              <p className="mt-4 text-sm text-slateInk">
                To{" "}
                <span className="font-medium text-roseDeep">
                  {crushName.trim() || "someone"}
                </span>
              </p>
              <p className="mt-2 min-h-[3em] whitespace-pre-wrap break-words font-display text-lg leading-snug text-ink">
                {message.trim() || "Your confession will show up here as you type."}
              </p>
              <p className="mt-3 text-xs text-slateInk/60">
                — {senderNickname.trim() || "Anonymous"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
