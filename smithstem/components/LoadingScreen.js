// The one loading state for the whole app. Every screen that waits on a
// network call before it has anything to show uses this instead of an
// empty page or bare text, so "still working" always looks like it.
export default function LoadingScreen({ label = "Loading…" }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute -inset-1.5 animate-spin rounded-full border-2 border-accentSoft border-t-accent" />
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">Ω</span>
        </div>
        <p className="text-base text-muted">{label}</p>
      </div>
    </main>
  );
}
