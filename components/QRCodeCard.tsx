"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useToast } from "@/components/Toast";

export default function QRCodeCard() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");
  const toast = useToast();

  useEffect(() => {
    // Built client-side so it always points at wherever the site is actually
    // hosted (localhost while developing, your real domain once deployed).
    setUrl(`${window.location.origin}/confess`);
  }, []);

  function download() {
    try {
      const canvas = canvasWrapRef.current?.querySelector("canvas");
      if (!canvas) throw new Error();
      const link = document.createElement("a");
      link.download = "unspoken-qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      toast.push("Couldn't generate the download. Try a screenshot instead.", "error");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.push("Link copied.", "success");
    } catch {
      toast.push("Couldn't copy automatically — select and copy the link below.", "error");
    }
  }

  if (!url) {
    return (
      <div className="pin relative rotate-1 rounded-note bg-paper p-6 shadow-note">
        <div className="h-4 w-52 animate-pulse-soft rounded-full bg-ink/10" />
        <div className="mt-4 h-[168px] w-[168px] animate-pulse-soft rounded bg-ink/10" />
        <div className="mt-4 h-9 w-full animate-pulse-soft rounded-full bg-ink/10" />
      </div>
    );
  }

  return (
    <div className="pin relative rotate-1 rounded-note bg-paper p-6 text-ink shadow-note">
      <p className="mb-4 text-sm text-slateInk">
        Scan to leave a confession from your phone
      </p>
      <div ref={canvasWrapRef} className="inline-block rounded bg-white p-3">
        <QRCodeCanvas value={url} size={168} fgColor="#1B1029" level="M" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={download}
            className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-inkLight active:scale-95"
          >
            Download QR
          </button>
          <button
            onClick={copyLink}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink transition hover:bg-ink/5 active:scale-95"
          >
            Copy link
          </button>
        </div>
        <span className="break-all text-xs text-slateInk">{url}</span>
      </div>
    </div>
  );
}
