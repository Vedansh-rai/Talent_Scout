import type { RankedCandidate, ConversationTurn } from "../types";
import { X, Target, CheckCircle2, MessageSquare, Star, StarOff } from "lucide-react";

interface CandidateModalProps {
  candidate: RankedCandidate;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  onClose: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize text-white/80">{label.replace("_", " ")}</span>
        <span className="font-mono text-[var(--cyan)]">{score.toFixed(0)}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--cyan)] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChatBubble({ turn, candidateName }: { turn: ConversationTurn; candidateName: string }) {
  const isAgent = turn.role === "agent";
  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
          isAgent
            ? "bg-[#1f1f22] border border-white/10 rounded-tr-sm text-white/90"
            : "bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-tl-sm text-white/90"
        }`}
      >
        <p className="text-xs font-mono mb-1 opacity-50 uppercase tracking-wider">
          {isAgent ? "AI Agent" : candidateName}
        </p>
        <p className="leading-relaxed text-sm">{turn.message}</p>
      </div>
    </div>
  );
}

export function CandidateModal({ candidate, isShortlisted, onToggleShortlist, onClose }: CandidateModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0d0d0f]/95 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-white">{candidate.name}</h2>
            <p className="text-[var(--accent)] text-sm">{candidate.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleShortlist}
              className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-all ${
                isShortlisted
                  ? "bg-[var(--accent)]/20 border-[var(--accent)]/40 text-[var(--accent)]"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-[var(--accent)]"
              }`}
            >
              {isShortlisted ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
              {isShortlisted ? "Shortlisted" : "Shortlist"}
            </button>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Scores overview */}
          <div className="grid grid-cols-3 gap-4 text-center font-mono">
            <div className="glass-card p-4 rounded-lg">
              <p className="text-xs text-white/40 uppercase mb-1">Match</p>
              <p className="text-2xl text-[var(--cyan)]">{candidate.match_score.toFixed(1)}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-xs text-white/40 uppercase mb-1">Interest</p>
              <p className="text-2xl text-[var(--accent)]">{candidate.interest_score.toFixed(1)}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <p className="text-xs text-white/40 uppercase mb-1">Final</p>
              <p className="text-2xl text-white font-bold">{candidate.final_score.toFixed(1)}</p>
            </div>
          </div>

          {/* Match Breakdown */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-display text-white mb-4">
              <Target className="w-5 h-5 text-[var(--cyan)]" /> Match Breakdown
            </h3>
            <div className="glass-card p-5 rounded-lg">
              {Object.entries(candidate.match_explanation).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key} className="mb-4 last:mb-0">
                    <ScoreBar label={key} score={value.score} />
                    <p className="text-white/50 text-xs mt-1">{value.rationale}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interest Assessment */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-display text-white mb-4">
              <CheckCircle2 className="w-5 h-5 text-[var(--success)]" /> Interest Assessment
            </h3>
            <div className="glass-card p-5 rounded-lg">
              <p className="text-white/80 leading-relaxed">{candidate.interest_justification}</p>
            </div>
          </section>

          {/* Transcript */}
          {candidate.transcript.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-display text-white mb-4">
                <MessageSquare className="w-5 h-5 text-[var(--accent)]" /> Outreach Transcript
              </h3>
              <div className="glass-card p-5 rounded-lg space-y-4 max-h-[400px] overflow-y-auto">
                {candidate.transcript.map((turn, idx) => (
                  <ChatBubble key={idx} turn={turn} candidateName={candidate.name} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
