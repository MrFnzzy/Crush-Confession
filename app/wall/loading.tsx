export default function WallLoading() {
  return (
    <main className="corkboard min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-display text-sm italic text-gold">unspoken</span>
            <h1 className="mt-1 font-display text-3xl text-paper">The wall</h1>
          </div>
          <div className="h-10 w-28 animate-pulse-soft rounded-full bg-paper/10" />
        </div>

        <div className="mb-10 h-9 w-48 animate-pulse-soft rounded-full bg-paper/10" />

        <div className="columns-1 gap-8 space-y-8 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse-soft break-inside-avoid rounded-note bg-paper/10 p-6"
              style={{ height: 160 + (i % 3) * 40 }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
