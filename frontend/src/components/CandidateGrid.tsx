import type { ScoutResponse, RankedCandidate } from "../types";
import { ProgressRing } from "./ProgressRing";
import { ArrowLeft, MessageSquare, Star, StarOff } from "lucide-react";

interface CandidateGridProps {
  data: ScoutResponse;
  shortlist: RankedCandidate[];
  onSelect: (c: RankedCandidate) => void;
  onToggleShortlist: (c: RankedCandidate) => void;
  onViewShortlist: () => void;
  onBack: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--cyan)";
  if (score >= 60) return "var(--accent)";
  return "var(--danger)";
}

export function CandidateGrid({
  data,
  shortlist,
  onSelect,
  onToggleShortlist,
  onViewShortlist,
  onBack,
}: CandidateGridProps) {
  const jd = data.parsed_jd;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-white/50 hover:text-white font-mono text-sm mb-3 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> New Search
          </button>
          <h2 className="font-display text-4xl mb-1 text-white">Talent Radar</h2>
          <p className="text-white/50">
            <span className="text-[var(--accent)] font-semibold">{jd.title}</span>
            {" — "}
            {data.candidates.length} candidates ranked
          </p>
        </div>
        <button
          onClick={onViewShortlist}
          className="text-[var(--cyan)] hover:text-white font-mono text-sm border border-[var(--cyan)]/30 px-4 py-2 rounded hover:bg-[var(--cyan)]/10 transition-colors"
        >
          Shortlist ({shortlist.length}) →
        </button>
      </div>

      {/* JD Summary */}
      <div className="glass-card p-5 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
        {jd.location_preference && (
          <div>
            <span className="text-white/40 text-xs uppercase">Location</span>
            <p className="text-white/80 mt-0.5">{jd.location_preference}</p>
          </div>
        )}
        {jd.salary_range && (
          <div>
            <span className="text-white/40 text-xs uppercase">Salary</span>
            <p className="text-white/80 mt-0.5">
              ${jd.salary_range.min.toLocaleString()}–${jd.salary_range.max.toLocaleString()}
            </p>
          </div>
        )}
        {jd.min_experience_years != null && (
          <div>
            <span className="text-white/40 text-xs uppercase">Experience</span>
            <p className="text-white/80 mt-0.5">{jd.min_experience_years}+ years</p>
          </div>
        )}
        {jd.required_skills.length > 0 && (
          <div className="col-span-2 sm:col-span-1">
            <span className="text-white/40 text-xs uppercase">Required</span>
            <p className="text-white/80 mt-0.5 truncate" title={jd.required_skills.join(", ")}>
              {jd.required_skills.slice(0, 4).join(", ")}
              {jd.required_skills.length > 4 && ` +${jd.required_skills.length - 4}`}
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.candidates.map((c) => {
          const isShortlisted = shortlist.some((s) => s.rank === c.rank);
          return (
            <div
              key={c.rank}
              className="glass-card p-6 hover:border-white/20 transition-all duration-300 flex flex-col"
            >
              {/* Top row */}
              <div className="flex gap-4 items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center font-display text-lg text-[var(--accent)]">
                  #{c.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl text-white truncate">{c.name}</h3>
                  <p className="text-[var(--accent)] text-sm truncate">{c.title}</p>
                </div>
                <ProgressRing radius={24} stroke={3} progress={c.match_score} color={scoreColor(c.match_score)} />
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.top_matching_skills.slice(0, 5).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Scores */}
              <div className="flex gap-4 text-sm font-mono mb-4">
                <div>
                  <span className="text-white/40 text-xs">Match</span>
                  <p style={{ color: scoreColor(c.match_score) }}>{c.match_score.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Interest</span>
                  <p style={{ color: scoreColor(c.interest_score) }}>{c.interest_score.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Final</span>
                  <p className="text-white font-bold">{c.final_score.toFixed(1)}</p>
                </div>
              </div>

              {/* Interest summary */}
              {c.interest_summary && (
                <p className="text-white/50 text-sm mb-4 line-clamp-2">{c.interest_summary}</p>
              )}

              {/* Actions */}
              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => onSelect(c)}
                  className="flex-1 py-2 rounded bg-white/5 hover:bg-[var(--cyan)]/20 text-white/80 hover:text-[var(--cyan)] border border-white/10 hover:border-[var(--cyan)]/30 font-medium transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <MessageSquare className="w-4 h-4" /> Details
                </button>
                <button
                  onClick={() => onToggleShortlist(c)}
                  className={`px-3 py-2 rounded border transition-all ${
                    isShortlisted
                      ? "bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-[var(--accent)]"
                  }`}
                  title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                >
                  {isShortlisted ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
