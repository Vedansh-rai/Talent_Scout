import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface ScoutFormProps {
  onSubmit: (jdText: string, topN: number, skipOutreach: boolean) => void;
  isLoading: boolean;
}

export const ScoutForm: React.FC<ScoutFormProps> = ({ onSubmit, isLoading }) => {
  const [jdText, setJdText] = useState('');
  const [topN, setTopN] = useState(5);
  const [skipOutreach, setSkipOutreach] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    onSubmit(jdText, topN, skipOutreach);
  };

  return (
    <div className="form-container">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="jdText">Job Description</label>
            <textarea
              id="jdText"
              className="form-control"
              rows={10}
              placeholder="Paste the job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="settings-row">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="topN">Top Candidates to Match</label>
              <input
                id="topN"
                type="number"
                min="1"
                max="50"
                className="form-control"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', marginBottom: 0 }}>
              <label className="checkbox-label" style={{ marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={skipOutreach}
                  onChange={(e) => setSkipOutreach(e.target.checked)}
                  disabled={isLoading}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent)' }}
                />
                Skip Outreach Phase (Faster)
              </label>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={isLoading || !jdText.trim()}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', margin: 0 }}></div>
                Scouting in Progress...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Search size={20} />
                Start AI Scouting
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
