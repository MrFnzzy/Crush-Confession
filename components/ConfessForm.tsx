"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import GifPicker, { PickedGif } from "@/components/GifPicker";
import { isPushSupported, saveNotifyId, subscribeToConfessionReplies } from "@/lib/pushClient";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NICKNAME_LENGTH = 40;

function maskName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/./g, "_ ").trim())
    .join("   ");
}

export default function ConfessForm() {
  const router = useRouter();
  const toast = useToast();
  const [crushName, setCrushName] = useState("");
  const [message, setMessage] = useState("");
  const [senderNickname, setSenderNickname] = useState("");
  const [gif, setGif] = useState<PickedGif | null>(null);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [guessEnabled, setGuessEnabled] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postedId, setPostedId] = useState<number | null>(null);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const canSubmit = crushName.trim().length > 0 && message.trim().length > 0 && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (typeof navigator !== "undefined" && !navigator.onLine) { setError("You are offline. Reconnect and try again."); return; }
    if (!crushName.trim() || !message.trim()) { setError("Give us a name and the feeling."); return; }
    if (crushName.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) { setError("One of those fields is too long."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crushName: crushName.trim(), message: message.trim(), senderNickname: senderNickname.trim() || undefined, gifUrl: gif?.url, guessEnabled }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.reason === "blocked_word") {
          toast.push(data.error || "That message contains language we don't allow here.", "error");
          window.setTimeout(() => window.location.reload(), 1400);
          return;
        }
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      const data = await res.json().catch(() => null);
      toast.push("Posted anonymously. It is on the wall now.", "success");
      // If push is supported, pause here and ask before heading to the
      // wall — this is the one moment we know which confession is "theirs",
      // since nothing after this is tied to an account.
      if (data?.id && isPushSupported()) {
        setPostedId(data.id);
        setSubmitting(false);
      } else {
        router.push("/wall");
      }
    } catch (err) { const msg = err instanceof Error ? err.message : "Something went wrong — try again."; setError(msg); toast.push(msg, "error"); setSubmitting(false); }
  }

  async function handleEnableNotifications() {
    if (postedId == null || notifyBusy) return;
    setNotifyBusy(true);
    const result = await subscribeToConfessionReplies(postedId);
    setNotifyBusy(false);
    if (result.ok) {
      saveNotifyId(postedId);
      toast.push("You'll get notified if someone replies.", "success");
    } else if (result.reason === "denied") {
      toast.push("Notifications blocked — you can turn them on later from the wall.", "error");
    } else {
      toast.push("Couldn't turn on notifications right now.", "error");
    }
    router.push("/wall");
  }

  function handleSkipNotifications() {
    router.push("/wall");
  }

  return (
    <>
      <Navbar />
      <GifPicker open={gifPickerOpen} onClose={() => setGifPickerOpen(false)} onPick={setGif} />
      <main className="site-grid min-h-screen px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[.22em] text-muted transition hover:text-lime">← abort / go home</Link>
          <div className="mt-10 grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl">
              <span className="font-mono text-[10px] uppercase tracking-[.22em] text-coral">private transmission / 001</span>
              <h1 className="mt-4 font-display text-6xl leading-[.82] tracking-tighter text-paper sm:text-8xl">Send it<br /><span className="text-stroke">anyway.</span></h1>
              <p className="mt-8 max-w-sm text-base leading-relaxed text-muted">This is your sign to stop drafting the message and release it into the wild.</p>
              <div className="mt-12 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-widest text-muted"><div className="rounded-xl border border-white/10 p-4"><span className="text-lime">01</span><p className="mt-7">write raw</p></div><div className="rounded-xl border border-white/10 p-4"><span className="text-coral">02</span><p className="mt-7">hit send</p></div></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }} className="grid gap-6 md:grid-cols-[1.05fr_.75fr]">
              <form onSubmit={handleSubmit} noValidate className="rounded-3xl border border-white/15 bg-paper p-6 text-night shadow-[12px_12px_0_#ff4d6d] sm:p-8">
                <div className="flex items-center justify-between border-b border-night/10 pb-4"><span className="font-mono text-[10px] uppercase tracking-widest text-night/50">compose mode</span><span className="h-2 w-2 rounded-full bg-coral" /></div>
                <div className="mt-6 flex flex-col gap-5">
                  <div><label htmlFor="crushName" className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-night/55"><span>who is this for?</span><span>{crushName.length}/{MAX_NAME_LENGTH}</span></label><input id="crushName" value={crushName} onChange={(e) => setCrushName(e.target.value.slice(0, MAX_NAME_LENGTH))} maxLength={MAX_NAME_LENGTH} autoComplete="off" placeholder="a name, a nickname, the barista..." className="w-full border-b border-night/20 bg-transparent px-0 py-3 font-display text-2xl text-night placeholder:text-night/25 focus:border-coral focus:outline-none" /></div>

                  <div className="flex items-start gap-3 rounded-xl border border-violet/25 bg-violet/10 px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={guessEnabled}
                      onClick={() => setGuessEnabled((v) => !v)}
                      className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${guessEnabled ? "bg-violet" : "bg-night/15"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition ${guessEnabled ? "left-5" : "left-0.5"}`} />
                    </button>
                    <label className="cursor-pointer text-sm leading-snug" onClick={() => setGuessEnabled((v) => !v)}>
                      <span className="font-bold text-night">Make people guess who it is 🕵️</span>
                      <span className="mt-1 block text-xs text-night/55">The name stays hidden on the wall. Readers type guesses — nailing it exactly triggers a little sparkle reveal.</span>
                    </label>
                  </div>

                  <div><label htmlFor="message" className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-night/55"><span>the transmission</span><span>{message.length}/{MAX_MESSAGE_LENGTH}</span></label><textarea id="message" value={message} onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))} maxLength={MAX_MESSAGE_LENGTH} rows={6} placeholder="Say the thing..." className="w-full resize-none rounded-xl border border-night/10 bg-night/5 px-4 py-3 text-base leading-relaxed text-night placeholder:text-night/25 focus:border-coral focus:outline-none" /></div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-night/55">attach a gif <span className="normal-case tracking-normal text-night/35">(optional)</span></label>
                    {gif ? (
                      <div className="relative inline-block overflow-hidden rounded-xl border border-night/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={gif.previewUrl} alt={gif.alt} className="h-28 w-auto rounded-xl object-cover" />
                        <button
                          type="button"
                          onClick={() => setGif(null)}
                          aria-label="Remove gif"
                          className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-night/80 text-xs text-paper hover:bg-coral"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setGifPickerOpen(true)}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-night/25 bg-night/5 px-4 py-3 text-sm font-bold text-night/60 transition hover:border-coral hover:text-coral"
                      >
                        <span aria-hidden>🎬</span> add a gif
                      </button>
                    )}
                  </div>

                  <div><label htmlFor="senderNickname" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-night/55">sign-off <span className="normal-case tracking-normal text-night/35">(optional)</span></label><input id="senderNickname" value={senderNickname} onChange={(e) => setSenderNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))} maxLength={MAX_NICKNAME_LENGTH} autoComplete="off" placeholder="anonymous is a valid answer" className="w-full border-b border-night/20 bg-transparent px-0 py-3 text-sm text-night placeholder:text-night/25 focus:border-coral focus:outline-none" /></div>
                  {error && <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">{error}</p>}
                  <button type="submit" disabled={!canSubmit} className="neon-button mt-2 rounded-xl bg-night px-6 py-4 text-sm font-extrabold text-lime disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "transmitting..." : "release the feeling →"}</button>
                </div>
              </form>

              <div className="hidden md:block">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">live preview / {guessEnabled ? "guess mode on" : "unfiltered"}</p>
                <div className="relative rounded-2xl border border-white/10 bg-violet p-6 text-paper shadow-[8px_8px_0_#d9ff54]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-paper/60">signal #— / just now</span>
                  {guessEnabled ? (
                    <p className="mt-14 font-mono text-[10px] uppercase tracking-widest text-lime">to: <span className="tracking-[.3em]">{maskName(crushName) || "_ _ _"}</span> · guess who 🕵️</p>
                  ) : (
                    <p className="mt-14 font-mono text-[10px] uppercase tracking-widest text-lime">to: {crushName.trim() || "someone"}</p>
                  )}
                  <p className="mt-4 min-h-[8rem] whitespace-pre-wrap break-words font-display text-3xl leading-[.95]">{message.trim() || "Your words will show up here."}</p>
                  {gif && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gif.previewUrl} alt={gif.alt} className="mt-4 max-h-40 w-auto rounded-xl border border-white/15 object-cover" />
                  )}
                  <p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-paper/60">— {senderNickname.trim() || "anonymous"}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {postedId != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-night/70 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/15 bg-paper p-6 text-night shadow-[10px_10px_0_#ff4d6d]"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-coral">🔔 one more thing</span>
            <h2 className="mt-3 font-display text-2xl leading-tight">Get notified if someone replies?</h2>
            <p className="mt-2 text-sm leading-relaxed text-night/60">
              It&apos;s tied to this browser, no account needed. You&apos;ll only get pinged when a reply lands on
              this confession.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleEnableNotifications}
                disabled={notifyBusy}
                className="neon-button rounded-xl bg-night px-5 py-3 text-sm font-extrabold text-lime disabled:opacity-60"
              >
                {notifyBusy ? "turning on..." : "yes, notify me"}
              </button>
              <button
                onClick={handleSkipNotifications}
                disabled={notifyBusy}
                className="rounded-xl px-5 py-3 text-sm font-bold text-night/50 hover:text-night"
              >
                not now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
