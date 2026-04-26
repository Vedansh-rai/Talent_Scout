import React from 'react';
import type { ScoutResponse, RankedCandidate } from '../types';
import { Briefcase, MapPin, DollarSign, Award, ChevronRight } from 'lucide-react';

interface DashboardProps {
  data: ScoutResponse;
  onCandidateClick: (candidate: RankedCandidate) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onCandidateClick }) => {
  const jd = data.parsed_jd;

  return (
    <div>
      {/* JD Summary Card */}
      <div className="glass-panel dashboard-header">
        <h2>{jd.title}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{jd.role_summary}</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
          {jd.location_preference && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <MapPin size={16} /> {jd.location_preference}
            </div>
          )}
          {jd.salary_range && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <DollarSign size={16} /> ${jd.salary_range.min.toLocaleString()} - ${jd.salary_range.max.toLocaleString()}
            </div>
          )}
          {jd.min_experience_years && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Briefcase size={16} /> {jd.min_experience_years}+ years exp.
            </div>
          )}
        </div>
        
        <div>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Required Skills</h4>
          <div className="skills-tags">
            {jd.required_skills.map((skill, idx) => (
              <span key={idx} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Award className="text-accent" />
        <h2 style={{ fontSize: '1.5rem' }}>Top Matches</h2>
      </div>
      
      <div className="candidates-grid">
        {data.candidates.map((candidate) => (
          <div 
            key={candidate.rank} 
            className="glass-panel candidate-card"
            onClick={() => onCandidateClick(candidate)}
          >
            <div className="card-header">
              <div>
                <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  #{candidate.rank}
                </div>
                <div className="candidate-name">{candidate.name}</div>
                <div className="candidate-title">{candidate.title}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="score-badge">
                  <span className="score-value">{Math.round(candidate.match_score)}</span>
                  <span className="score-label">Match</span>
                </div>
              </div>
            </div>
            
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                {candidate.interest_summary}
              </p>
              <div className="skills-tags" style={{ marginTop: '0' }}>
                {candidate.top_matching_skills.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="skill-tag" style={{ background: 'transparent', borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                    {skill}
                  </span>
                ))}
                {candidate.top_matching_skills.length > 3 && (
                  <span className="skill-tag" style={{ background: 'transparent', borderColor: 'transparent', color: 'var(--text-muted)' }}>
                    +{candidate.top_matching_skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', color: 'var(--accent)', fontSize: '0.9rem' }}>
              View Details <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
