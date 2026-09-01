/*
  Pinboard After Dark reminder: editorial collage, tactile paper notes, asymmetric rails,
  warm oat surfaces, Signal Coral for emotion, Acid Chartreuse only for selected/matched states.
*/
import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  FileImage,
  Flame,
  Heart,
  ImagePlus,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

type Mood = "soft hours" | "plot twist" | "brave" | "chaotic good" | "lowkey";
type Filter = "fresh" | "most-loved" | "gif";

type Confession = {
  id: string;
  number: string;
  text: string;
  to: string;
  from: string;
  mood: Mood;
  createdAt: string;
  gifUrl?: string;
  gifLabel?: string;
  reactions: number;
  guesses: number;
};

type GuessState = {
  value: string;
  matched: boolean;
  attempts: number;
};

const BACKDROP = "/manus-storage/confession-wall-backdrop_b4e57b53.png";

const GIF_CHOICES = [
  { label: "tiny scream", url: "https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif" },
  { label: "typing feelings", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" },
  { label: "soft applause", url: "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif" },
  { label: "plot twist", url: "https://media.giphy.com/media/26tknCqiJrBQG6bxC/giphy.gif" },
];

const SEED_CONFESSIONS: Confession[] = [
  {
    id: "note-001",
    number: "001",
    text: "I take the long way home when I know you might be outside. This is getting embarrassing.",
    to: "Nino",
    from: "someone with a very obvious playlist",
    mood: "soft hours",
    createdAt: "12 min ago",
    reactions: 48,
    guesses: 23,
  },
  {
    id: "note-002",
    number: "002",
    text: "To the person who always saves the last seat: I notice. I just panic every time I try to say hi.",
    to: "Mika",
    from: "the quiet one near the window",
    mood: "brave",
    createdAt: "28 min ago",
    reactions: 31,
    guesses: 14,
    gifUrl: GIF_CHOICES[2].url,
    gifLabel: GIF_CHOICES[2].label,
  },
  {
    id: "note-003",
    number: "003",
    text: "You make group projects feel suspiciously fun. Please stop being so effortlessly good at everything.",
    to: "the one with the green tote",
    from: "definitely not your study partner",
    mood: "chaotic good",
    createdAt: "1 hr ago",
    reactions: 67,
    guesses: 36,
  },
  {
    id: "note-004",
    number: "004",
    text: "I saw your note last week. I kept it. I hope that is either sweet or at least interesting.",
    to: "a very lucky person",
    from: "anonymous, for real",
    mood: "lowkey",
    createdAt: "2 hrs ago",
    reactions: 22,
    guesses: 9,
    gifUrl: GIF_CHOICES[0].url,
    gifLabel: GIF_CHOICES[0].label,
  },
];

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function SparkleBurst() {
  return (
    <span className="sparkle-burst" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <span className="sparkle-ray" style={{ "--i": index } as CSSProperties} key={index}>
          {index % 2 === 0 ? "✦" : "·"}
        </span>
      ))}
    </span>
  );
}

function SignalLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand-lockup brand-lockup-compact" : "brand-lockup"}>
      <span className="signal-symbol" aria-hidden="true"><i /><i /><b /></span>
      {!compact && (
        <span className="brand-wordmark">
          confessions<span>.wall</span>
        </span>
      )}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <Sparkles size={15} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={14} />
      </button>
    </div>
  );
}

function GuessBox({
  confession,
  state,
  onChange,
  onGuess,
}: {
  confession: Confession;
  state: GuessState;
  onChange: (value: string) => void;
  onGuess: () => void;
}) {
  return (
    <div className={state.matched ? "guess-box guess-box-matched" : "guess-box"}>
      {state.matched && <SparkleBurst />}
      <div className="guess-heading-row">
        <div className="guess-icon"><Zap size={14} /></div>
        <div>
          <p className="eyebrow eyebrow-lime">Guessing club</p>
          <p className="guess-title">{state.matched ? "You cracked the note" : "Guess who it is?"}</p>
        </div>
        {state.matched && <span className="match-stamp"><Check size={12} /> matched</span>}
      </div>
      {state.matched ? (
        <div className="match-copy">
          <p>That name hit the bullseye. The wall is sparkling for you.</p>
          <span className="match-count">{state.attempts} {state.attempts === 1 ? "guess" : "guesses"} · nice detective work</span>
        </div>
      ) : (
        <form
          className="guess-form"
          onSubmit={(event) => {
            event.preventDefault();
            onGuess();
          }}
        >
          <input
            aria-label={`Guess the name for confession ${confession.number}`}
            value={state.value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Type a name…"
            autoComplete="off"
          />
          <button type="submit" aria-label="Submit guess" disabled={!state.value.trim()}>
            <ArrowUpRight size={16} />
          </button>
        </form>
      )}
      {!state.matched && (
        <p className="guess-meta"><MessageCircle size={13} /> {confession.guesses + state.attempts} guesses so far · keep it kind</p>
      )}
    </div>
  );
}

function ConfessionCard({
  confession,
  index,
  guessState,
  onGuessChange,
  onGuess,
  onReact,
}: {
  confession: Confession;
  index: number;
  guessState: GuessState;
  onGuessChange: (value: string) => void;
  onGuess: () => void;
  onReact: (delta: number) => void;
}) {
  const [hearted, setHearted] = useState(false);
  return (
    <article className={`confession-card card-tilt-${index % 4} ${guessState.matched ? "card-is-matched" : ""}`}>
      <div className="tape" aria-hidden="true" />
      <div className="card-topline">
        <span className="card-number">{confession.number}</span>
        <span className="mood-chip">{confession.mood}</span>
        <span className="card-time">{confession.createdAt}</span>
      </div>
      <p className="confession-text">{confession.text}</p>
      {confession.gifUrl && (
        <div className="gif-in-note">
          <img src={confession.gifUrl} alt={`GIF: ${confession.gifLabel ?? "reaction"}`} />
          <span><FileImage size={12} /> {confession.gifLabel ?? "GIF attached"}</span>
        </div>
      )}
      <div className="card-footer">
        <span className="to-line"><span>to</span> someone on the wall</span>
        <button
          type="button"
          className={hearted ? "reaction-button is-hearted" : "reaction-button"}
          onClick={() => {
            onReact(hearted ? -1 : 1);
            setHearted((current) => !current);
          }}
          aria-label={hearted ? "Remove heart" : "Heart confession"}
        >
          <Heart size={15} fill={hearted ? "currentColor" : "none"} />
          <span>{confession.reactions}</span>
        </button>
      </div>
      <GuessBox confession={confession} state={guessState} onChange={onGuessChange} onGuess={onGuess} />
    </article>
  );
}

function GifPicker({
  selectedGif,
  selectedLabel,
  onSelect,
  onUpload,
  onClear,
}: {
  selectedGif?: string;
  selectedLabel?: string;
  onSelect: (url: string, label: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="gif-picker">
      <div className="picker-heading">
        <div>
          <p className="eyebrow">Add a little evidence</p>
          <h3>Pick the feeling</h3>
        </div>
        <span className="picker-count">{selectedGif ? "1 selected" : "optional"}</span>
      </div>
      {selectedGif && (
        <div className="selected-gif-preview">
          <img src={selectedGif} alt={`Selected GIF: ${selectedLabel ?? "custom GIF"}`} />
          <div>
            <span className="selected-label"><Check size={13} /> {selectedLabel ?? "custom GIF"}</span>
            <button type="button" onClick={onClear}>Remove GIF</button>
          </div>
        </div>
      )}
      <div className="gif-grid">
        {GIF_CHOICES.map((gif) => (
          <button
            className={selectedGif === gif.url ? "gif-option is-selected" : "gif-option"}
            key={gif.url}
            type="button"
            onClick={() => onSelect(gif.url, gif.label)}
          >
            <img src={gif.url} alt="" />
            <span>{gif.label}</span>
            {selectedGif === gif.url && <span className="gif-check"><Check size={12} /></span>}
          </button>
        ))}
        <label className="gif-upload-option">
          <input type="file" accept="image/gif,image/*" onChange={onUpload} />
          <span className="upload-icon"><Paperclip size={17} /></span>
          <span>Attach yours</span>
          <small>GIF, PNG, JPG</small>
        </label>
      </div>
      <p className="picker-note"><ImagePlus size={13} /> GIFs stay optional, and you can swap the mood before pinning.</p>
    </div>
  );
}

function Composer({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (confession: Omit<Confession, "id" | "number" | "createdAt" | "reactions" | "guesses">) => void;
}) {
  const [text, setText] = useState("");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [mood, setMood] = useState<Mood>("soft hours");
  const [selectedGif, setSelectedGif] = useState<string>();
  const [selectedLabel, setSelectedLabel] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File>();
  const [error, setError] = useState("");

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError("That file is too big — try a GIF under 6MB.");
      return;
    }
    setSelectedFile(file);
    setSelectedLabel(file.name);
    setSelectedGif(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (text.trim().length < 8) {
      setError("Give the note a little more to work with — 8 characters minimum.");
      return;
    }
    if (!to.trim()) {
      setError("Add who the note is for so the wall can start the guessing game.");
      return;
    }
    let gifUrl = selectedGif;
    if (selectedFile) gifUrl = await readFileAsDataUrl(selectedFile);
    onSubmit({ text: text.trim(), to: to.trim(), from: from.trim() || "a quiet observer", mood, gifUrl, gifLabel: selectedLabel });
  };

  return (
    <div className="composer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="composer-sheet" role="dialog" aria-modal="true" aria-labelledby="composer-title">
        <button className="close-composer" type="button" onClick={onClose} aria-label="Close composer"><X size={19} /></button>
        <div className="composer-intro">
          <span className="mini-signal"><span /><span /><i /></span>
          <p className="eyebrow">New note · stays anonymous</p>
          <h2 id="composer-title">Pin something <em>unreasonably honest.</em></h2>
          <p>Your note appears without your name. Add a GIF if words need a tiny sidekick.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="composer-grid">
            <div className="composer-fields">
              <label>
                <span>To <b>*</b></span>
                <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="A name, nickname, or clue" maxLength={80} />
              </label>
              <label>
                <span>Your note <b>*</b></span>
                <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="The thing you almost said out loud…" maxLength={420} rows={5} />
                <small>{text.length}/420 · keep it kind</small>
              </label>
              <label>
                <span>Signed</span>
                <input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="optional: ‘the one with the tote’" maxLength={80} />
              </label>
              <div className="mood-picker">
                <span>Note energy</span>
                <div>
                  {(["soft hours", "plot twist", "brave", "chaotic good", "lowkey"] as Mood[]).map((option) => (
                    <button type="button" key={option} className={mood === option ? "mood-option is-active" : "mood-option"} onClick={() => setMood(option)}>{option}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="composer-side">
              <div className="preview-note">
                <div className="preview-label"><span>live preview</span><span className="preview-dot" /></div>
                <span className="preview-number">new</span>
                <p>{text || "Your confession will land here, like a folded note."}</p>
                <span className="preview-to">to {to || "someone specific"}</span>
                {selectedGif && <img src={selectedGif} alt="GIF preview" className="preview-gif" />}
                <span className="preview-from">— {from || "a quiet observer"}</span>
              </div>
              <GifPicker selectedGif={selectedGif} selectedLabel={selectedLabel} onSelect={(url, label) => { setSelectedGif(url); setSelectedLabel(label); setSelectedFile(undefined); }} onUpload={handleUpload} onClear={() => { setSelectedGif(undefined); setSelectedLabel(undefined); setSelectedFile(undefined); }} />
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="composer-actions">
            <span><span className="privacy-dot" /> no names shown publicly</span>
            <button className="pin-button" type="submit"><Send size={16} /> Pin it to the wall <ChevronRight size={17} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [confessions, setConfessions] = useState<Confession[]>(SEED_CONFESSIONS);
  const [filter, setFilter] = useState<Filter>("fresh");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [guesses, setGuesses] = useState<Record<string, GuessState>>({});

  useEffect(() => {
    document.title = "confessions.wall — leave a note";
    const stored = window.localStorage.getItem("confession-wall-confessions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Confession[];
        if (Array.isArray(parsed) && parsed.length) setConfessions(parsed);
      } catch {
        window.localStorage.removeItem("confession-wall-confessions");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("confession-wall-confessions", JSON.stringify(confessions));
  }, [confessions]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const visibleConfessions = useMemo(() => {
    const filtered = confessions.filter((confession) => {
      const haystack = `${confession.text} ${confession.from} ${confession.mood}`.toLowerCase();
      const matchesSearch = !query.trim() || haystack.includes(query.toLowerCase().trim());
      const matchesFilter = filter === "fresh" || (filter === "gif" ? Boolean(confession.gifUrl) : true);
      return matchesSearch && matchesFilter;
    });
    if (filter === "most-loved") return [...filtered].sort((a, b) => b.reactions - a.reactions);
    return filtered;
  }, [confessions, filter, query]);

  const updateGuess = (id: string, value: string) => {
    setGuesses((current) => ({ ...current, [id]: { ...(current[id] ?? { matched: false, attempts: 0 }), value } }));
  };

  const submitGuess = (confession: Confession) => {
    const current = guesses[confession.id] ?? { value: "", matched: false, attempts: 0 };
    const nextAttempts = current.attempts + 1;
    const matched = normalizeName(current.value) === normalizeName(confession.to);
    setGuesses((existing) => ({ ...existing, [confession.id]: { ...current, attempts: nextAttempts, matched } }));
    setConfessions((existing) => existing.map((item) => item.id === confession.id ? { ...item, guesses: item.guesses + 1 } : item));
    if (matched) setToast("Exact match. The wall just sparkled for you.");
    else setToast("Not this time — keep sleuthing, but keep it kind.");
  };

  const addConfession = (draft: Omit<Confession, "id" | "number" | "createdAt" | "reactions" | "guesses">) => {
    const nextNumber = String(confessions.length + 1).padStart(3, "0");
    const nextConfession: Confession = { ...draft, id: `note-${Date.now()}`, number: nextNumber, createdAt: "just now", reactions: 0, guesses: 0 };
    setConfessions((current) => [nextConfession, ...current]);
    setComposerOpen(false);
    setToast("Pinned. The guessing club is on the case.");
  };

  return (
    <div className="app-shell" style={{ "--wall-backdrop": `url(${BACKDROP})` } as CSSProperties}>
      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="Confessions wall home"><SignalLogo /></a>
        <nav className={mobileMenuOpen ? "main-nav is-open" : "main-nav"} aria-label="Primary navigation">
          <a href="#wall" onClick={() => setMobileMenuOpen(false)}>the wall</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>how it works</a>
          <a href="#rules" onClick={() => setMobileMenuOpen(false)}>good energy rules</a>
        </nav>
        <div className="header-actions">
          <span className="live-status"><span /> wall is live</span>
          <button className="header-cta" type="button" onClick={() => setComposerOpen(true)}><Plus size={16} /> leave a note</button>
          <button className="mobile-menu" type="button" onClick={() => setMobileMenuOpen((current) => !current)} aria-label="Toggle menu"><Menu size={21} /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-line" /> a noticeboard for the almost-said</div>
            <h1>Say it here.<br /><em>Let them guess.</em></h1>
            <p className="hero-description">Drop an anonymous note for somebody specific. The wall keeps your name quiet — and lets the room have a little fun figuring it out.</p>
            <div className="hero-buttons">
              <button type="button" className="primary-button" onClick={() => setComposerOpen(true)}>pin a confession <ArrowUpRight size={17} /></button>
              <a className="text-link" href="#wall">read the wall <ChevronRight size={15} /></a>
            </div>
            <div className="hero-stats">
              <div><strong>{confessions.length + 28}</strong><span>notes pinned</span></div>
              <div><strong>86%</strong><span>still anonymous</span></div>
              <div><strong>∞</strong><span>plot twists</span></div>
            </div>
          </div>
          <div className="hero-art" aria-label="A stack of paper notes on a pinboard">
            <div className="hero-board-art" aria-hidden="true">
              <span className="board-pin pin-one" /><span className="board-pin pin-two" />
              <div className="board-note board-note-back"><small>somebody knows</small><b>maybe it’s you.</b></div>
              <div className="board-note board-note-front"><span className="board-note-top"><i>note</i><b>017</b></span><strong>you make the ordinary<br />feel like a sign.</strong><small>— left without a name</small></div>
              <span className="board-dash dash-one" /><span className="board-dash dash-two" />
              <span className="board-marginalia">read between<br />the lines</span>
            </div>
            <div className="hero-sticker"><Sparkles size={15} /><span>new<br /><b>energy</b></span></div>
            <div className="hero-note-label"><span>01</span> a note, in plain sight</div>
          </div>
        </section>

        <section className="wall-layout" id="wall">
          <div className="wall-main">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Fresh from the board</p>
                <h2>The wall <span>is listening.</span></h2>
              </div>
              <span className="wall-counter"><span className="counter-dot" /> {confessions.length} notes in the room</span>
            </div>
            <div className="wall-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filter confessions">
                <button type="button" role="tab" aria-selected={filter === "fresh"} className={filter === "fresh" ? "filter-tab is-active" : "filter-tab"} onClick={() => setFilter("fresh")}><Flame size={14} /> fresh</button>
                <button type="button" role="tab" aria-selected={filter === "most-loved"} className={filter === "most-loved" ? "filter-tab is-active" : "filter-tab"} onClick={() => setFilter("most-loved")}><Heart size={14} /> most loved</button>
                <button type="button" role="tab" aria-selected={filter === "gif"} className={filter === "gif" ? "filter-tab is-active" : "filter-tab"} onClick={() => setFilter("gif")}><FileImage size={14} /> with GIFs</button>
              </div>
              <label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search the vibe" aria-label="Search the wall" /></label>
            </div>
            <div className="confession-list">
              {visibleConfessions.map((confession, index) => (
                <ConfessionCard
                  key={confession.id}
                  confession={confession}
                  index={index}
                  guessState={guesses[confession.id] ?? { value: "", matched: false, attempts: 0 }}
                  onGuessChange={(value) => updateGuess(confession.id, value)}
                  onGuess={() => submitGuess(confession)}
                  onReact={(delta) => setConfessions((existing) => existing.map((item) => item.id === confession.id ? { ...item, reactions: Math.max(0, item.reactions + delta) } : item))}
                />
              ))}
            </div>
            {visibleConfessions.length === 0 && <div className="empty-state"><Search size={22} /><p>No notes match that vibe yet.</p><button type="button" onClick={() => { setQuery(""); setFilter("fresh"); }}>clear filters</button></div>}
          </div>

          <aside className="wall-aside">
            <div className="guessing-card" id="how-it-works">
              <div className="aside-card-top"><span className="aside-number">02</span><span className="aside-tag">the fun bit</span></div>
              <div className="aside-sticker-css" aria-hidden="true"><span>✦</span><b>guess<br />again</b><i>↗</i></div>
              <p className="eyebrow eyebrow-lime">Make a guess</p>
              <h3>Who is the note <em>really</em> for?</h3>
              <p>Every note has a hidden “to”. Type a name below it. When you hit the exact match, you’ll know — the note will sparkle.</p>
              <div className="guess-steps">
                <div><span>01</span><p>Read between the lines.</p></div>
                <div><span>02</span><p>Drop a name in the box.</p></div>
                <div><span>03</span><p>Watch for the match stamp.</p></div>
              </div>
              <div className="aside-cta"><span><span className="mini-live-dot" /> guesses are live</span><Zap size={15} /></div>
            </div>
            <div className="rules-card" id="rules">
              <div className="rules-title"><span>03</span><h3>Good energy rules</h3></div>
              <ul>
                <li><span>01</span> keep guesses playful, never invasive</li>
                <li><span>02</span> no private details, no pressure</li>
                <li><span>03</span> if it would hurt, don’t pin it</li>
              </ul>
              <button type="button" className="rule-link" onClick={() => setToast("The wall works best when everyone can breathe.")}>read the tiny print <ArrowUpRight size={14} /></button>
            </div>
          </aside>
        </section>

        <section className="marquee-section" aria-label="Wall motto">
          <div className="marquee-track"><span>say the almost-said</span><i>✦</i><span>leave a little mystery</span><i>✦</i><span>keep it kind</span><i>✦</i><span>say the almost-said</span><i>✦</i><span>leave a little mystery</span><i>✦</i><span>keep it kind</span><i>✦</i></div>
        </section>

        <section className="closing-section">
          <div><p className="eyebrow">Your turn, quietly</p><h2>There’s a note<br /><em>in your pocket.</em></h2></div>
          <div className="closing-action"><p>Make it anonymous. Make it weirdly specific. Add a GIF if the feeling needs backup.</p><button type="button" className="primary-button" onClick={() => setComposerOpen(true)}>pin yours <Send size={16} /></button></div>
        </section>
      </main>

      <footer className="site-footer"><SignalLogo compact /><span>made for the things we almost say</span><span>© 2026 confessions.wall</span></footer>

      {composerOpen && <Composer onClose={() => setComposerOpen(false)} onSubmit={addConfession} />}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
