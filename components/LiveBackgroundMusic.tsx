"use client";

import { useEffect, useRef, useState } from "react";

const MUSIC_POLL_MS = 10_000;
const DEFAULT_VOLUME = 0.22;

type Track = { id: number; fileName: string; mimeType: string; createdAt: string };

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
  const manuallyPausedRef = useRef(false);

  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  // Poll the playlist. Only replaces state when something actually
  // changed, and clamps the current index if the track we were on got
  // removed — the per-track effect below only re-fires when the *id* at
  // that index changes, so an unrelated poll tick never restarts
  // whatever's currently playing.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`/api/music?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const nextTracks: Track[] = Array.isArray(data?.tracks) ? data.tracks : [];
        const nextVolume = typeof data?.volume === "number" ? data.volume : DEFAULT_VOLUME;

        setTracks((prev) => {
          const prevIds = (prev ?? []).map((t) => t.id).join(",");
          const nextIds = nextTracks.map((t) => t.id).join(",");
          return prevIds === nextIds ? prev : nextTracks;
        });
        setVolume((prev) => (prev === nextVolume ? prev : nextVolume));
      } catch {
        // Music is optional and should never interfere with the site.
      }
    };
    load();
    const interval = window.setInterval(load, MUSIC_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Keep currentIndex valid whenever the playlist shrinks or reorders.
  useEffect(() => {
    if (!tracks || tracks.length === 0) return;
    if (currentIndex >= tracks.length) setCurrentIndex(0);
  }, [tracks, currentIndex]);

  // Sets up the Web Audio graph exactly once per audio element — a
  // MediaElementSourceNode can only ever be created a single time for a
  // given element, so this must not re-run on every track/volume change.
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

  const currentTrackId = tracks && tracks.length > 0 ? tracks[Math.min(currentIndex, tracks.length - 1)]?.id : undefined;

  // Loads whichever track is current and attempts to play it. This only
  // depends on the *id*, not the array reference, so a poll tick that
  // returns the same playlist never interrupts playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrackId) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPlaying(false);
      setNeedsGesture(false);
      return;
    }

    audio.src = `/api/music/file/${currentTrackId}`;
    audio.load();

    const gain = ensureAudioGraph();
    if (gain) {
      gain.gain.value = volume;
      audio.volume = 1; // full pass-through — actual loudness is the gain node's job
    } else {
      audio.volume = Math.min(1, volume);
    }

    if (manuallyPausedRef.current) return; // respect an explicit pause across track changes

    let cancelled = false;
    audio
      .play()
      .then(() => {
        if (!cancelled) {
          audioCtxRef.current?.resume().catch(() => undefined);
          setPlaying(true);
          setNeedsGesture(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlaying(false);
          setNeedsGesture(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackId]);

  // Volume changes (from the admin) shouldn't restart the track — just
  // retune the gain node in place.
  useEffect(() => {
    const gain = gainNodeRef.current;
    const audio = audioRef.current;
    if (gain) {
      gain.gain.value = volume;
    } else if (audio) {
      audio.volume = Math.min(1, volume);
    }
  }, [volume]);

  // Advance to the next track when one finishes, looping back to the
  // start of the playlist at the end.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function handleEnded() {
      setCurrentIndex((i) => {
        const count = tracks?.length ?? 0;
        return count > 0 ? (i + 1) % count : i;
      });
    }
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [tracks]);

  function startPlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrackId) return;
    manuallyPausedRef.current = false;
    // IMPORTANT: audio.play() is called as the very first, fully
    // synchronous statement of this gesture handler. Some browsers
    // (notably Safari/iOS) drop "this call came from a real tap" the
    // moment an `await` runs first — that was the bug: the previous
    // version awaited AudioContext.resume() before calling play(), which
    // silently lost the gesture and made every tap on "tap for music" a
    // no-op. Resuming the context now happens in parallel instead of
    // blocking the play() call.
    const playPromise = audio.play();
    audioCtxRef.current?.resume().catch(() => undefined);
    playPromise
      .then(() => {
        setPlaying(true);
        setNeedsGesture(false);
      })
      .catch(() => {
        setNeedsGesture(true);
      });
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio || !currentTrackId) return;
    if (audio.paused) {
      startPlayback();
    } else {
      manuallyPausedRef.current = true;
      audio.pause();
      setPlaying(false);
    }
  }

  // Extra safety net: browsers that block the very first autoplay
  // attempt will usually allow playback the moment the visitor does
  // *anything* on the page, not only the dedicated music button. This
  // makes the "tap for music" fallback effectively page-wide instead of
  // relying on a visitor spotting a small corner button.
  useEffect(() => {
    function unlock() {
      const audio = audioRef.current;
      if (!audio || manuallyPausedRef.current || !audio.paused) return;
      startPlayback();
    }
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackId]);

  if (!tracks || tracks.length === 0) return null;

  return (
    <>
      <audio ref={audioRef} aria-hidden="true" />
      <button
        type="button"
        onClick={toggleMusic}
        aria-label={playing ? "Pause background music" : "Play background music"}
        className="fixed bottom-4 right-4 z-[120] rounded-full border border-white/15 bg-night/90 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-paper shadow-[4px_4px_0_#ff4d6d] backdrop-blur transition hover:border-lime hover:text-lime active:scale-95"
      >
        <span aria-hidden="true" className="mr-2 text-lime">♪</span>
        {playing ? "music on" : needsGesture ? "tap for music" : "music off"}
      </button>
    </>
  );
}
