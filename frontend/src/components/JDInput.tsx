import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface JDInputProps {
  onSubmit: (jdText: string, topN: number, skipOutreach: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

export function JDInput({ onSubmit, isLoading, error }: JDInputProps) {
  const [jdText, setJdText] = useState("");
  const [topN, setTopN] = useState(5);
  const [skipOutreach, setSkipOutreach] = useState(false);

  const handleSubmit = () => {
    if (!jdText.trim() || isLoading) return;
    onSubmit(jdText, topN, skipOutreach);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h2 className="font-display text-4xl mb-2 text-white">Brief the Agent</h2>
      <p className="text-white/50 mb-8">
        Paste your job description and let the AI scout the best candidates.
      </p>

      <div className="glass-card p-6 mb-6">
        <textarea
          className="w-full bg-[var(--bg-input)] border border-white/10 rounded-lg p-4 text-white/90 font-mono text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none h-64"
          placeholder="Paste Job Description here…"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          disabled={isLoading}
        />

        {/* Settings row */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-mono text-white/40 uppercase mb-1">
              Top N Candidates
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Math.max(1, Math.min(50, Number(e.target.value))))}
              className="w-full bg-[var(--bg-input)] border border-white/10 rounded-lg px-3 py-2 text-white/90 font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
              disabled={isLoading}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer self-end pb-1">
            <input
              type="checkbox"
              checked={skipOutreach}
              onChange={(e) => setSkipOutreach(e.target.checked)}
              className="accent-[var(--accent)] w-4 h-4"
              disabled={isLoading}
            />
            <span className="text-sm text-white/60">Skip Outreach (faster)</span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-400/30 bg-red-400/10 text-red-300 text-sm font-mono">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm">
          <span className="text-white/40">Status: </span>
          <span className={isLoading ? "text-[var(--accent)] animate-pulse" : "text-white/70"}>
            {isLoading ? "Scouting in progress…" : "Ready"}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!jdText.trim() || isLoading}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:shadow-[0_0_25px_rgba(245,166,35,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
          {isLoading ? "Scouting…" : "Deploy Agent"}
        </button>
      </div>
    </div>
  );
}
