"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

const MAX_NAME_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NICKNAME_LENGTH = 40;
const MAX_GIF_BYTES = 2 * 1024 * 1024;
const GIF_DRAFT_KEY = "unspoken_gif_drafts";

const GIF_CHOICES = [
  { label: "tiny scream", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
  { label: "typing feelings", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
  { label: "soft applause", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
  { label: "plot twist", url: "https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif" },
];

function getDraftKey(crushName: string, message: string) {
  return `${crushName.trim().toLowerCase()}::${message.trim().toLowerCase()}`;
}

function saveGifDraft(crushName: string, message: string, gifUrl: string) {
  try {
    const current = JSON.parse(window.localStorage.getItem(GIF_DRAFT_KEY) || "{}");
    current[getDraftKey(crushName, message)] = gifUrl;
    window.localStorage.setItem(GIF_DRAFT_KEY, JSON.stringify(current));
  } catch {
    // The note still posts if local browser storage is unavailable.
  }
}

export default function ConfessPage() {
  const router = useRouter();
  const toast = useToast();
  const [crushName, setCrushName] = useState("");
  const [message, setMessage] = useState("");
  const [senderNickname, setSenderNickname] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [gifLabel, setGifLabel] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = crushName.trim().length > 0 && message.trim().length > 0 && !submitting;

  function chooseGif(url: string, label: string) {
    setGifUrl(url);
    setGifLabel(label);
  }

  function handleGifUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_GIF_BYTES) {
      setError("Choose an image/GIF under 2MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setGifUrl(reader.result);
        setGifLabel(file.name.replace(/\.[^/.]+$/, "") || "your GIF");
        setError("");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (typeof navigator !== "undefined" && !navigator.onLine) { setError("You are offline. Reconnect and try again."); return; }
    if (!crushName.trim() || !message.trim()) { setError("Give us a name and the feeling."); return; }
    if (crushName.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) { setError("One of those fields is too long."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/confessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crushName: crushName.trim(), message: message.trim(), senderNickname: senderNickname.trim() || undefined, gifUrl: gifUrl || undefined }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.reason === "blocked_word") {
          toast.push(data.error || "That message contains language we don't allow here.", "error");
          window.setTimeout(() => window.location.reload(), 1400);
          return;
        }
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      if (gifUrl) saveGifDraft(crushName, message, gifUrl);
      toast.push("Posted anonymously. It is on the wall now.", "success"); router.push("/wall");
    } catch (err) { const msg = err instanceof Error ? err.message : "Something went wrong — try again."; setError(msg); toast.push(msg, "error"); setSubmitting(false); }
  }

  return (
    <>
      <Navbar />
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
                  <div><label htmlFor="message" className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-night/55"><span>the transmission</span><span>{message.length}/{MAX_MESSAGE_LENGTH}</span></label><textarea id="message" value={message} onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))} maxLength={MAX_MESSAGE_LENGTH} rows={6} placeholder="Say the thing..." className="w-full resize-none rounded-xl border border-night/10 bg-night/5 px-4 py-3 text-base leading-relaxed text-night placeholder:text-night/25 focus:border-coral focus:outline-none" /></div>
                  <div><label htmlFor="senderNickname" className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-night/55">sign-off <span className="normal-case tracking-normal text-night/35">(optional)</span></label><input id="senderNickname" value={senderNickname} onChange={(e) => setSenderNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))} maxLength={MAX_NICKNAME_LENGTH} autoComplete="off" placeholder="anonymous is a valid answer" className="w-full border-b border-night/20 bg-transparent px-0 py-3 text-sm text-night placeholder:text-night/25 focus:border-coral focus:outline-none" /></div>

                  <fieldset className="rounded-xl border border-night/10 bg-night/[.03] p-3">
                    <legend className="px-1 font-mono text-[10px] uppercase tracking-widest text-night/55">add a GIF <span className="normal-case tracking-normal text-night/35">(optional)</span></legend>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {GIF_CHOICES.map((gif) => <button key={gif.label} type="button" onClick={() => chooseGif(gif.url, gif.label)} aria-pressed={gifUrl === gif.url} className={`gif-choice ${gifUrl === gif.url ? "ring-2 ring-coral" : ""}`}><img src={gif.url} alt="" /><span>{gif.label}</span></button>)}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <label htmlFor="gifUpload" className="cursor-pointer rounded-lg border border-night/15 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-night/65 transition hover:border-coral hover:text-coral">attach yours</label>
                      <input id="gifUpload" type="file" accept="image/gif,image/png,image/jpeg" onChange={handleGifUpload} className="sr-only" />
                      {gifUrl && <button type="button" onClick={() => { setGifUrl(""); setGifLabel(""); }} className="font-mono text-[10px] uppercase tracking-wider text-coral hover:underline">remove {gifLabel || "GIF"}</button>}
                    </div>
                    {gifUrl && <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/70 p-2"><img src={gifUrl} alt="Selected GIF preview" className="h-14 w-20 rounded object-cover" /><span className="font-mono text-[10px] uppercase tracking-wider text-night/55">{gifLabel || "selected GIF"}</span></div>}
                  </fieldset>

                  {error && <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral" role="alert">{error}</p>}
                  <button type="submit" disabled={!canSubmit} className="neon-button mt-2 rounded-xl bg-night px-6 py-4 text-sm font-extrabold text-lime disabled:cursor-not-allowed disabled:opacity-50">{submitting ? "transmitting..." : "release the feeling →"}</button>
                </div>
              </form>

              <div className="hidden md:block"><p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">live preview / unfiltered</p><div className="relative rounded-2xl border border-white/10 bg-violet p-6 text-paper shadow-[8px_8px_0_#d9ff54]"><span className="font-mono text-[10px] uppercase tracking-widest text-paper/60">signal #— / just now</span><p className="mt-14 font-mono text-[10px] uppercase tracking-widest text-lime">to: {crushName.trim() || "someone"}</p><p className="mt-4 min-h-[8rem] whitespace-pre-wrap break-words font-display text-3xl leading-[.95]">{message.trim() || "Your words will show up here."}</p>{gifUrl && <img src={gifUrl} alt="Selected GIF preview" className="mt-5 h-32 w-full rounded-xl object-cover" />}<p className="mt-10 font-mono text-[10px] uppercase tracking-widest text-paper/60">— {senderNickname.trim() || "anonymous"}</p></div></div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
