export default function ShutdownScreen({ message }: { message: string }) {
  return (
    <main className="site-grid flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="font-mono text-[10px] uppercase tracking-[.22em] text-coral">closed for now</span>
      <h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-paper sm:text-6xl">
        {message}
      </h1>
      <p className="mt-8 font-mono text-[10px] uppercase tracking-widest text-muted">check back again soon</p>
    </main>
  );
}
