"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_POLL_MS = 10_000;
const DEFAULT_VOLUME = 0.22;

type MusicMeta = { fileName: string; mimeType: string; updatedAt: string; volume: number };

export default function LiveBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Volume is applied through a Web Audio gain node rather than the plain
  // <audio>.volume property — a real <audio> element caps at 1.0 (100%),
  // so an admin-set boost above that (up to 300%) can only work by
  // amplifying the signal with Web Audio's GainNode. Once an element is
  // routed through a MediaElementSourceNode its normal output is always
  // redirected through the graph, so gain is used for every volume level,
  // not just boosted ones, to keep behavior consistent.
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [meta, setMeta] = useState<MusicMeta | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        // Metadata only — a few hundred bytes, safe to poll frequently and
        // safe to leave uncached since we need it fresh.
        const response = await fetch(`/api/music?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const nextMeta = (data?.music as MusicMeta | null) ?? null;
        setMeta((prev) =>
          prev?.updatedAt === nextMeta?.updatedAt && prev?.volume === nextMeta?.volume ? prev : nextMeta
        );
      } catch {
        // Music is optional and should never interfere with the site.
      }
    };

    loadMeta();
    const interval = window.setInterval(loadMeta, MUSIC_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Sets up the Web Audio graph exactly once per audio element — a
  // MediaElementSourceNode can only ever be created a single time for a
  // given element, so this must not re-run when the track/volume changes.
  function ensureAudioGraph(): GainNode | null {
    const audio = audioRef.current;
    if (!audio) return null;
    if (gainNodeRef.current) return gainNodeRef.current;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(audio);
      const gain = ctx.createGain();
      source.connect(gain).connect(ctx.destination);
      gainNodeRef.current = gain;
      return gain;
    } catch {
      // Web Audio unsupported/blocked — fall back to the element's own
      // volume, which still works fine up to 100%.
      return null;
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!meta) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      setNeedsGesture(false);
      return;
    }

    // The ?v= param ties this URL to the exact track version. Combined
    // with the immutable Cache-Control on /api/music/file, the browser
    // (and Vercel's edge) will only ever download these bytes once per
    // version — reloads, new tabs, and repeat visits reuse the cached
    // copy instead of re-transferring the whole file every time.
    audio.src = `/api/music/file?v=${encodeURIComponent(meta.updatedAt)}`;
    audio.loop = true;
    audio.load();

    const volume = meta.volume ?? DEFAULT_VOLUME;
    const gain = ensureAudioGraph();
    if (gain) {
      gain.gain.value = volume;
      audio.volume = 1; // full pass-through — actual loudness is the gain node's job
    } else {
      // Fallback path: no boost above 100%, but still respects the setting.
      audio.volume = Math.min(1, volume);
    }

    let cancelled = false;
    audio.play().then(() => {
      if (!cancelled) {
        audioCtxRef.current?.resume().catch(() => undefined);
        setPlaying(true);
        setNeedsGesture(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setPlaying(false);
        setNeedsGesture(true);
      }
    });

    return () => {
      cancelled = true;
      audio.pause();
    };
  }, [meta]);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !meta) return;
    if (audio.paused) {
      try {
        await audioCtxRef.current?.resume();
        await audio.play();
        setPlaying(true);
        setNeedsGesture(false);
      } catch {
        setNeedsGesture(true);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  if (!meta) return null;

  return (
    <>
      <audio ref={audioRef} aria-hidden="true" />
      <button type="button" onClick={toggleMusic} aria-label={playing ? "Pause background music" : "Play background music"} className="fixed bottom-4 right-4 z-[120] rounded-full border border-white/15 bg-night/90 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-paper shadow-[4px_4px_0_#ff4d6d] backdrop-blur transition hover:border-lime hover:text-lime active:scale-95">
        <span aria-hidden="true" className="mr-2 text-lime">♪</span>
        {playing ? "music on" : needsGesture ? "tap for music" : "music off"}
      </button>
    </>
  );
}
