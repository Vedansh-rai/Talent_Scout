import { Zap } from "lucide-react";

const STEP_LABELS = ["JD Input", "Discovery", "Outreach", "Shortlist"] as const;

interface HeaderProps {
  step: number;
}

export function Header({ step }: HeaderProps) {
  return (
    <header className="border-b border-white/10 px-4 sm:px-8 py-5 flex justify-between items-center bg-[var(--bg-primary)]/80 sticky top-0 z-50 backdrop-blur-md">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-[var(--accent)] to-[var(--cyan)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-black" />
        </div>
        <h1 className="font-display text-2xl tracking-wide text-white">
          TALENT<span className="text-[var(--accent)]">SCOUT</span>
        </h1>
      </div>

      {/* Step indicator */}
      <nav className="hidden sm:flex gap-6 text-sm font-mono text-white/50">
        {STEP_LABELS.map((label, idx) => {
          const num = idx + 1;
          return (
            <div
              key={num}
              className={`flex items-center gap-2 transition-colors duration-300 ${step >= num ? "text-[var(--cyan)]" : ""}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs ${
                  step >= num
                    ? "border-[var(--cyan)] bg-[var(--cyan)]/10"
                    : "border-white/20"
                }`}
              >
                {num}
              </div>
              <span>{label}</span>
            </div>
          );
        })}
      </nav>
    </header>
  );
}
