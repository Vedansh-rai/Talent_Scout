import type { RankedCandidate } from "../types";
import { ArrowLeft, Download, Trash2 } from "lucide-react";

interface ShortlistTableProps {
  shortlist: RankedCandidate[];
  onSelect: (c: RankedCandidate) => void;
  onRemove: (c: RankedCandidate) => void;
  onBack: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--cyan)";
  if (score >= 60) return "var(--accent)";
  return "var(--danger)";
}

function recTag(score: number) {
  if (score >= 85) return { text: "Hot Lead", cls: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20" };
  if (score >= 75) return { text: "Strong Fit", cls: "text-[var(--cyan)] bg-[var(--cyan)]/10 border-[var(--cyan)]/20" };
  if (score >= 60) return { text: "Explore", cls: "text-white/80 bg-white/10 border-white/20" };
  return { text: "Pass", cls: "text-red-400 bg-red-400/10 border-red-400/20" };
}

export function ShortlistTable({ shortlist, onSelect, onRemove, onBack }: ShortlistTableProps) {
  const sorted = [...shortlist].sort((a, b) => b.final_score - a.final_score);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sorted, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talent_scout_shortlist.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white font-mono text-sm mb-3 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>
          <h2 className="font-display text-4xl mb-1 text-white">Shortlist</h2>
          <p className="text-white/50">
            {sorted.length} candidate{sorted.length !== 1 ? "s" : ""} shortlisted
          </p>
        </div>
        {sorted.length > 0 && (
          <button
            onClick={exportJSON}
            className="bg-white/10 hover:bg-white/20 text-white font-mono text-sm border border-white/20 px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/40 border-b border-white/10 font-mono text-xs uppercase text-white/50">
            <tr>
              <th className="p-4 font-normal">#</th>
              <th className="p-4 font-normal">Candidate</th>
              <th className="p-4 font-normal text-right">Match</th>
              <th className="p-4 font-normal text-right">Interest</th>
              <th className="p-4 font-normal text-right">Final</th>
              <th className="p-4 font-normal">Verdict</th>
              <th className="p-4 font-normal w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/40 font-mono">
                  No candidates shortlisted yet. Go back and star the ones you like.
                </td>
              </tr>
            ) : (
              sorted.map((c, idx) => {
                const tag = recTag(c.final_score);
                return (
                  <tr
                    key={c.rank}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onSelect(c)}
                  >
                    <td className="p-4 font-display text-lg text-white/50">{idx + 1}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-white/50 font-mono">{c.title}</p>
                    </td>
                    <td className="p-4 font-mono text-right" style={{ color: scoreColor(c.match_score) }}>
                      {c.match_score.toFixed(1)}
                    </td>
                    <td className="p-4 font-mono text-right" style={{ color: scoreColor(c.interest_score) }}>
                      {c.interest_score.toFixed(1)}
                    </td>
                    <td className="p-4 font-mono text-right font-bold text-white">
                      {c.final_score.toFixed(1)}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded text-xs font-mono border ${tag.cls}`}>
                        {tag.text}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(c);
                        }}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        title="Remove from shortlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
