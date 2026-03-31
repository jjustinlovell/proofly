export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-4">
        {/* Green Circle Spinner */}
        <div className="relative w-16 h-16">
          {/* Base track */}
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border-primary)]"></div>
          {/* Spinning segment */}
          <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-green)] border-t-transparent animate-spin"></div>
          {/* Inner pulse */}
          <div className="absolute inset-4 rounded-full bg-[var(--accent-green)]/20 animate-pulse"></div>
        </div>
        <p className="font-mono text-sm tracking-widest text-[var(--accent-green)] uppercase animate-pulse">
          Verifying...
        </p>
      </div>
    </div>
  );
}
