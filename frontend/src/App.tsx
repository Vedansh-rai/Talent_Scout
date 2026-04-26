import { useState } from "react";
import type { ScoutResponse, RankedCandidate } from "./types";
import { scoutCandidates } from "./api";
import { Header } from "./components/Header";
import { JDInput } from "./components/JDInput";
import { CandidateGrid } from "./components/CandidateGrid";
import { CandidateModal } from "./components/CandidateModal";
import { ShortlistTable } from "./components/ShortlistTable";

type Step = 1 | 2 | 3 | 4;

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScoutResponse | null>(null);
  const [selected, setSelected] = useState<RankedCandidate | null>(null);
  const [shortlist, setShortlist] = useState<RankedCandidate[]>([]);

  const handleScout = async (jdText: string, topN: number, skipOutreach: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scoutCandidates({ jd_text: jdText, top_n: topN, skip_outreach: skipOutreach });
      setData(result);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const toggleShortlist = (candidate: RankedCandidate) => {
    setShortlist((prev) =>
      prev.find((c) => c.rank === candidate.rank)
        ? prev.filter((c) => c.rank !== candidate.rank)
        : [...prev, candidate],
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text)] font-sans overflow-x-hidden selection:bg-[var(--accent)] selection:text-black">
      <Header step={step} />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {/* ── Step 1: JD Input ──────────────────── */}
        {step === 1 && (
          <JDInput
            onSubmit={handleScout}
            isLoading={loading}
            error={error}
          />
        )}

        {/* ── Step 2: Discovery ─────────────────── */}
        {step === 2 && data && (
          <CandidateGrid
            data={data}
            shortlist={shortlist}
            onSelect={setSelected}
            onToggleShortlist={toggleShortlist}
            onViewShortlist={() => setStep(4)}
            onBack={() => setStep(1)}
          />
        )}

        {/* ── Step 4: Shortlist ─────────────────── */}
        {step === 4 && (
          <ShortlistTable
            shortlist={shortlist}
            onSelect={setSelected}
            onRemove={(c) => setShortlist((prev) => prev.filter((x) => x.rank !== c.rank))}
            onBack={() => setStep(2)}
          />
        )}
      </main>

      {/* ── Candidate Detail Modal ──────────────── */}
      {selected && (
        <CandidateModal
          candidate={selected}
          isShortlisted={shortlist.some((c) => c.rank === selected.rank)}
          onToggleShortlist={() => toggleShortlist(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
