/* ─── Stage 1: JD Parser ───────────────────────────────────────── */
export interface SalaryRange {
  min: number;
  max: number;
}

export interface ParsedJD {
  title: string;
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years?: number;
  education?: string;
  location_preference?: string;
  salary_range?: SalaryRange;
  role_summary: string;
}

/* ─── Stage 2: Matching ────────────────────────────────────────── */
export interface CriterionScore {
  score: number;
  rationale: string;
}

export interface MatchExplanation {
  required_skills?: CriterionScore;
  preferred_skills?: CriterionScore;
  experience?: CriterionScore;
  education?: CriterionScore;
  location?: CriterionScore;
}

/* ─── Stage 3: Outreach ────────────────────────────────────────── */
export interface ConversationTurn {
  role: "agent" | "candidate";
  message: string;
}

/* ─── Stage 4: Ranked Output ──────────────────────────────────── */
export interface RankedCandidate {
  rank: number;
  name: string;
  title: string;
  match_score: number;
  interest_score: number;
  final_score: number;
  top_matching_skills: string[];
  interest_summary: string;
  match_explanation: MatchExplanation;
  transcript: ConversationTurn[];
  interest_justification: string;
}

/* ─── API ──────────────────────────────────────────────────────── */
export interface ScoutRequest {
  jd_text: string;
  top_n: number;
  skip_outreach: boolean;
  model?: string;
}

export interface ScoutResponse {
  parsed_jd: ParsedJD;
  candidates: RankedCandidate[];
}
