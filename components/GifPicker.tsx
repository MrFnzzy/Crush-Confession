"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type PickedGif = { url: string; previewUrl: string; alt: string };

/** Normalized shape both providers get mapped into, so the rest of the
 * component doesn't need to care which API answered. */
type GifResult = { id: string; title: string; thumbUrl: string; fullUrl: string };

// Giphy's public "beta" developer key — fine for a small project, but it's
// shared and rate-limited. Set NEXT_PUBLIC_GIPHY_API_KEY in your own .env
// with a free key from developers.giphy.com for real traffic.
const GIPHY_FALLBACK_KEY = "dc6zaTOxFJmzC";
const GIPHY_KEY =
  process.env.NEXT_PUBLIC_GIPHY_API_KEY && process.env.NEXT_PUBLIC_GIPHY_API_KEY.length > 0
    ? process.env.NEXT_PUBLIC_GIPHY_API_KEY
    : GIPHY_FALLBACK_KEY;

// Tenor (Google) is the alternative provider — set NEXT_PUBLIC_TENOR_API_KEY
// to switch the picker over to it. Tenor has no public demo key, so it's
// only used when a real key is present.
const TENOR_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY?.trim() || "";
// Tenor requires a client_key identifying the app/integration, not a secret.
const TENOR_CLIENT_KEY = "unspoken_confession_wall";

const PROVIDER: "tenor" | "giphy" = TENOR_KEY ? "tenor" : "giphy";

async function fetchFromGiphy(term: string, signal: AbortSignal): Promise<GifResult[]> {
  const endpoint = term.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(
        term.trim()
      )}&limit=24&rating=pg-13`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error("giphy fetch failed");
  const data = await res.json();
  const items = Array.isArray(data?.data) ? data.data : [];
  return items.map((gif: any) => ({
    id: gif.id,
    title: gif.title || "gif",
    thumbUrl: gif.images?.fixed_width?.url || gif.images?.original?.url,
    fullUrl: gif.images?.downsized_medium?.url || gif.images?.original?.url,
  }));
}

async function fetchFromTenor(term: string, signal: AbortSignal): Promise<GifResult[]> {
  const endpoint = term.trim()
    ? `https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&client_key=${TENOR_CLIENT_KEY}&q=${encodeURIComponent(
        term.trim()
      )}&limit=24&contentfilter=medium`
    : `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&client_key=${TENOR_CLIENT_KEY}&limit=24&contentfilter=medium`;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error("tenor fetch failed");
  const data = await res.json();
  const items = Array.isArray(data?.results) ? data.results : [];
  return items.map((gif: any) => ({
    id: gif.id,
    title: gif.content_description || "gif",
    thumbUrl: gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url,
    fullUrl: gif.media_formats?.mediumgif?.url || gif.media_formats?.gif?.url,
  }));
}

export default function GifPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (gif: PickedGif) => void;
}) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reset to trending every time it's opened fresh.
    setQuery("");
    fetchGifs("");
    window.setTimeout(() => inputRef.current?.focus(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function fetchGifs(term: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrored(false);
    try {
      const results =
        PROVIDER === "tenor"
          ? await fetchFromTenor(term, controller.signal)
          : await fetchFromGiphy(term, controller.signal);
      setGifs(results.filter((g) => g.thumbUrl && g.fullUrl));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrored(true);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchGifs(value), 380);
  }

  function pick(gif: GifResult) {
    onPick({ url: gif.fullUrl, previewUrl: gif.thumbUrl, alt: gif.title });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-night/80 backdrop-blur-sm sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a GIF"
            className="glass max-h-[82vh] w-full max-w-lg overflow-hidden rounded-t-3xl border-white/15 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[.22em] text-lime">
                pick a gif <span className="text-muted">/ optional</span>
              </span>
              <button
                onClick={onClose}
                aria-label="Close gif picker"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-paper transition hover:bg-coral hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 focus-within:border-lime">
                <span className="text-sm text-muted">🔍</span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="search gifs — 'crying', 'shy', 'heart eyes'..."
                  className="w-full bg-transparent text-sm text-paper placeholder:text-muted focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => handleQueryChange("")}
                    className="text-xs text-muted hover:text-paper"
                    aria-label="Clear search"
                  >
                    clear
                  </button>
                )}
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted">
                powered by {PROVIDER === "tenor" ? "Tenor" : "GIPHY"}
              </p>
            </div>

            <div className="max-h-[52vh] overflow-y-auto px-5 pb-5 pt-3">
              {loading && (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-xl bg-white/10" />
                  ))}
                </div>
              )}

              {!loading && errored && (
                <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-6 text-center text-sm text-coral">
                  Couldn&apos;t load gifs right now. Try a different search or skip the gif.
                </div>
              )}

              {!loading && !errored && gifs.length === 0 && (
                <div className="rounded-xl border border-white/10 px-4 py-6 text-center text-sm text-muted">
                  No gifs found for that. Try something else.
                </div>
              )}

              {!loading && !errored && gifs.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => pick(gif)}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 transition hover:border-lime hover:shadow-[0_0_0_2px_rgba(217,255,84,.5)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={gif.thumbUrl}
                        alt={gif.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
