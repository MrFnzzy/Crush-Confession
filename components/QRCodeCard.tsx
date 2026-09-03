"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/components/Toast";

export default function QRCodeCard() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const toast = useToast();
  useEffect(() => { setUrl(`${window.location.origin}/confess`); }, []);

  function download() { try { const canvas = canvasWrapRef.current?.querySelector("canvas"); if (!canvas) throw new Error(); const link = document.createElement("a"); link.download = "unspoken-qr-code.png"; link.href = canvas.toDataURL("image/png"); link.click(); } catch { toast.push("Couldn’t generate the download. Try a screenshot instead.", "error"); } }
  async function copyLink() { try { await navigator.clipboard.writeText(url); toast.push("Link copied.", "success"); } catch { toast.push("Couldn’t copy automatically.", "error"); } }

  if (!url) return <div className="h-64 animate-pulse rounded-2xl bg-white/10" />;

  return <div className="rounded-2xl border border-white/15 bg-night p-5 text-paper"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-lime">broadcast channel</p><span className="pulse-dot h-2 w-2 rounded-full bg-coral" /></div><p className="mt-6 font-display text-2xl leading-none">Put it in the group chat.</p><div ref={canvasWrapRef} className="mt-5 inline-block rounded-xl bg-paper p-3"><QRCodeCanvas value={url} size={148} fgColor="#09090d" bgColor="#f7f4ed" level="M" /></div><div className="mt-5 flex gap-2"><button onClick={download} className="flex-1 rounded-lg bg-lime px-3 py-2 text-xs font-extrabold text-night transition hover:bg-white">download</button><button onClick={copyLink} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold text-paper transition hover:border-coral">copy link</button></div><span className="mt-3 block truncate font-mono text-[9px] text-muted">{url}</span></div>;
}
