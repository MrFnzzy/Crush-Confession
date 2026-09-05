"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TRACKS = 10;
const DEFAULT_VOLUME = 0.22;
const MAX_VOLUME = 3; // 300%

type Track = { id: number; fileName: string; mimeType: string; createdAt: string };

export default function BackgroundMusicManager() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [volumeSaving, setVolumeSaving] = useState(false);
  const [volumeError, setVolumeError] = useState("");

  useEffect(() => {
    fetch("/api/music", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setTracks(Array.isArray(data?.tracks) ? data.tracks : []);
        if (typeof data?.volume === "number") setVolume(data.volume);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  const full = tracks.length >= MAX_TRACKS;

  async function addTrack(event: React.FormEvent) {
    event.preventDefault();
    if (!file || saving) return;
    if (!file.type.startsWith("audio/")) {
      setError("Choose an audio file.");
      return;
    }
    if (file.size > MAX_AUDIO_BYTES) {
      setError("Keep each track under 10MB for reliable Vercel uploads.");
      return;
    }
    if (full) {
      setError(`The playlist is full (max ${MAX_TRACKS} tracks) — remove one first.`);
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
      setTracks(Array.isArray(data.tracks) ? data.tracks : tracks);
      setFile(null);
      const input = document.getElementById("background-music-file") as HTMLInputElement | null;
      if (input) input.value = "";
      toast.push("Added to the live playlist.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save that track.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeTrack(id: number) {
    if (removingId !== null) return;
    setRemovingId(id);
    setError("");
    try {
      const response = await fetch(`/api/music?id=${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't remove that track.");
      setTracks(Array.isArray(data.tracks) ? data.tracks : tracks.filter((t) => t.id !== id));
      toast.push("Removed from the playlist.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't remove that track.";
      setError(message);
      toast.push(message, "error");
    } finally {
      setRemovingId(null);
    }
  }

  async function saveVolume(next: number) {
    if (volumeSaving) return;
    setVolumeSaving(true);
    setVolumeError("");
    try {
      const response = await fetch("/api/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save that volume.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't save that volume.";
      setVolumeError(message);
      toast.push(message, "error");
    } finally {
      setVolumeSaving(false);
    }
  }

  const volumePercent = Math.round(volume * 100);

  return (
    <div className="max-w-2xl">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">how this works</span>
        <p className="mt-3 text-sm leading-relaxed text-paper/80">
          Build a playlist of up to {MAX_TRACKS} tracks for the public site — they play in the order you add them
          and loop back to the start. Visitors receive changes on their next check (every few seconds), no redeploy
          needed. Browsers may block unmuted autoplay until the visitor taps the sound control once.
        </p>
      </div>

      <form onSubmit={addTrack} className="glass mt-6 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">live playlist</span>
          <span className="font-mono text-[10px] text-muted">{tracks.length}/{MAX_TRACKS}</span>
        </div>

        {tracks.length > 0 && (
          <ul className="mt-4 space-y-2">
            {tracks.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3"
              >
                <span className="min-w-0 text-sm text-paper/85">
                  <span className="mr-2 font-mono text-[10px] text-muted">{i + 1}.</span>
                  <span className="truncate">{t.fileName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeTrack(t.id)}
                  disabled={removingId !== null}
                  aria-label={`Remove ${t.fileName}`}
                  className="shrink-0 rounded-lg border border-coral/40 px-3 py-1.5 text-xs font-bold text-coral transition hover:bg-coral hover:text-paper disabled:opacity-50"
                >
                  {removingId === t.id ? "Removing..." : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {full ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">
            playlist full — remove a track to add another
          </p>
        ) : (
          <>
            <label
              htmlFor="background-music-file"
              className="mt-4 block cursor-pointer rounded-xl border border-dashed border-white/20 bg-night/35 p-5 transition hover:border-lime"
            >
              <span className="block text-sm font-bold text-paper">{file ? file.name : "Choose an audio file"}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">MP3, WAV, OGG, M4A, AAC, or WebM · max 10MB</span>
            </label>
            <input
              id="background-music-file"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/mp4,audio/aac,audio/webm"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setError("");
              }}
              className="sr-only"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!file || saving}
                className="rounded-xl bg-lime px-5 py-3 text-sm font-bold text-night transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Uploading..." : "Add to playlist"}
              </button>
            </div>
          </>
        )}
        {error && <p className="mt-3 text-sm text-coral" role="alert">{error}</p>}
      </form>

      {loaded && tracks.length > 0 && (
        <div className="glass mt-6 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[.2em] text-muted">volume</span>
            <span className="font-mono text-sm font-bold text-lime">{volumePercent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_VOLUME * 100}
            step={5}
            value={volumePercent}
            onChange={(event) => setVolume(Number(event.target.value) / 100)}
            onMouseUp={() => saveVolume(volume)}
            onTouchEnd={() => saveVolume(volume)}
            onKeyUp={() => saveVolume(volume)}
            className="mt-4 w-full accent-lime"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted">
            <span>0%</span>
            <span>100% (normal max)</span>
            <span>{MAX_VOLUME * 100}%</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Applies to the whole playlist. Past 100% every track is genuinely boosted louder than its normal
            maximum — useful for a quiet recording, but very high boosts can sound distorted.{" "}
            {volumeSaving && "Saving..."}
          </p>
          {volumeError && <p className="mt-2 text-sm text-coral" role="alert">{volumeError}</p>}
        </div>
      )}
    </div>
  );
}
