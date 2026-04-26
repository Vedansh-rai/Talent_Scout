import React from 'react';
import type { RankedCandidate, ConversationTurn } from '../types';
import { X, MessageSquare, Target, CheckCircle2 } from 'lucide-react';

interface CandidateModalProps {
  candidate: RankedCandidate | null;
  onClose: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="candidate-name">{candidate.name}</h2>
            <p className="candidate-title">{candidate.title}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body">
          {/* Match Details */}
          <section>
            <h3 className="section-title"><Target size={20} /> Match Breakdown ({candidate.match_score.toFixed(1)}/100)</h3>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(candidate.match_explanation).map(([key, value]) => {
                if (!value) return null;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{key.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--success)' }}>{value.score}/100</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{value.rationale}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Interest Assessment */}
          <section>
            <h3 className="section-title"><CheckCircle2 size={20} /> Interest Assessment ({candidate.interest_score.toFixed(1)}/100)</h3>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <p>{candidate.interest_justification}</p>
            </div>
          </section>

          {/* Chat Transcript */}
          {candidate.transcript && candidate.transcript.length > 0 && (
            <section>
              <h3 className="section-title"><MessageSquare size={20} /> Outreach Transcript</h3>
              <div className="chat-container">
                {candidate.transcript.map((turn: ConversationTurn, idx: number) => (
                  <div key={idx} className={`chat-msg ${turn.role === 'agent' ? 'chat-agent' : 'chat-candidate'}`}>
                    <div className="msg-role">{turn.role}</div>
                    <div>{turn.message}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
