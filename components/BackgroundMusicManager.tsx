"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

export default function BackgroundMusicManager() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState("");

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSavedName(data?.music?.fileName || ""))
      .catch(() => undefined);
  }, []);

  async function saveMusic(event: React.FormEvent) {
    event.preventDefault();
    if (!file || saving) return;
    if (!file.type.startsWith("audio/")) {
      setError("Choose an audio file.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Keep the track under 3MB for reliable Vercel uploads.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("audio", file);
      const response = await fetch("/api/music", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save that track.");
      setSavedName(data.fileName || file.name);
      setFile(null);
      const input = document.getElementById("background-music-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.push("Background music is live for visitors.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save that track.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeMusic() {
    if (removing) return;
    setRemoving(true);
    setError("");
    try {
      const response = await fetch("/api/music", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't remove that track.");
      setSavedName("");
      toast.push("Background music removed.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't remove that track.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Upload one small background track for the public site. Visitors receive it on their next page load, and open tabs check for updates automatically. Browsers may block unmuted autoplay until the visitor taps the sound control once.
        </p>
      </div>

      <form onSubmit={saveMusic} className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">live background music</span>
        <label htmlFor="background-music-file" className="mt-4 block cursor-pointer rounded-xl border border-dashed border-white/20 bg-night/35 p-5 transition hover:border-lime">
          <span className="block text-sm font-bold text-paper">{file ? file.name : "Choose an audio file"}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted">MP3, WAV, OGG, M4A, AAC, or WebM · max 3MB</span>
        </label>
        <input id="background-music-file" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac,audio/webm" onChange={(event) => { setFile(event.target.files?.[0] || null); setError(""); }} className="sr-only" />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!file || saving} className="rounded-xl bg-lime px-5 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Uploading..." : savedName ? "Replace live track" : "Make it live"}</button>
          {savedName && <button type="button" onClick={removeMusic} disabled={removing} className="rounded-xl border border-coral/50 px-5 py-3 text-sm font-bold text-coral transition hover:bg-coral hover:text-paper disabled:opacity-50">{removing ? "Removing..." : "Remove track"}</button>}
        </div>
        {savedName && <p className="mt-4 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3 text-sm text-paper/80">Live now: <span className="font-semibold text-lime">{savedName}</span></p>}
        {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
      </form>
    </div>
  );
}
