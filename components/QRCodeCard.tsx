"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeCard() {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    // Built client-side so it always points at wherever the site is actually
    // hosted (localhost while developing, your real domain once deployed).
    setUrl(`${window.location.origin}/confess`);
  }, []);

  function download() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "unspoken-qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (!url) return null;

  return (
    <div className="pin relative rotate-1 rounded-note bg-paper p-6 text-ink shadow-[0_12px_0_rgba(0,0,0,0.25)]">
      <p className="mb-4 text-sm text-slateInk">
        Scan to leave a confession from your phone
      </p>
      <div ref={canvasWrapRef} className="inline-block rounded bg-white p-3">
        <QRCodeCanvas value={url} size={168} fgColor="#1B1029" level="M" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={download}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-inkLight"
        >
          Download QR code
        </button>
        <span className="break-all text-xs text-slateInk">{url}</span>
      </div>
    </div>
  );
}
