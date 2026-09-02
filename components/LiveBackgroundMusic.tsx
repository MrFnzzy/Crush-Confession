"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_POLL_MS = 10_000;

type MusicTrack = { src: string; fileName: string; updatedAt: string };
type MusicMeta = Omit<MusicTrack, "src">;

export default function LiveBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metaRef = useRef<MusicMeta | null>(null);
  const [track, setTrack] = useState<MusicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTrack = async () => {
      try {
        const metaResponse = await fetch(`/api/music?t=${Date.now()}`, { cache: "no-store" });
        if (!metaResponse.ok) return;
        const metaData = await metaResponse.json();
        const nextMeta = metaData?.music as MusicMeta | null;
        if (cancelled) return;

        if (!nextMeta) {
          metaRef.current = null;
          setTrack(null);
          return;
        }
        if (metaRef.current?.updatedAt === nextMeta.updatedAt) return;

        const audioResponse = await fetch(`/api/music?data=1&t=${Date.now()}`, { cache: "no-store" });
        if (!audioResponse.ok) return;
        const audioData = await audioResponse.json();
        if (!cancelled && audioData?.music?.src) {
          metaRef.current = nextMeta;
          setTrack(audioData.music as MusicTrack);
        }
      } catch {
        // Music is optional and should never interfere with the site.
      }
    };

    loadTrack();
    const interval = window.setInterval(loadTrack, MUSIC_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!track) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      setNeedsGesture(false);
      return;
    }

    audio.src = track.src;
    audio.volume = 0.22;
    audio.loop = true;
    audio.load();

    let cancelled = false;
    audio.play().then(() => {
      if (!cancelled) {
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
  }, [track]);

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      try {
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

  if (!track) return null;

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
