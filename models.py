from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Stage 1: JD Parser ──────────────────────────────────────────────

class SalaryRange(BaseModel):
    min: int
    max: int


class ParsedJD(BaseModel):
    title: str
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    min_experience_years: Optional[int] = None
    education: Optional[str] = None
    location_preference: Optional[str] = None
    salary_range: Optional[SalaryRange] = None
    role_summary: str = ""


# ── Candidate Profile ───────────────────────────────────────────────

class CandidateProfile(BaseModel):
    id: str
    name: str
    title: str
    skills: list[str] = Field(default_factory=list)
    years_of_experience: int
    education: str
    location: str
    bio: str = ""
    availability: str = ""
    salary_expectation: Optional[int] = None


# ── Stage 2: Matching ───────────────────────────────────────────────

class CriterionScore(BaseModel):
    score: float = Field(ge=0, le=100)
    rationale: str


class MatchExplanation(BaseModel):
    required_skills: Optional[CriterionScore] = None
    preferred_skills: Optional[CriterionScore] = None
    experience: Optional[CriterionScore] = None
    education: Optional[CriterionScore] = None
    location: Optional[CriterionScore] = None


class MatchResult(BaseModel):
    candidate: CandidateProfile
    match_score: float = Field(ge=0, le=100)
    match_explanation: MatchExplanation


# ── Stage 3: Outreach ───────────────────────────────────────────────

class Role(str, Enum):
    AGENT = "agent"
    CANDIDATE = "candidate"


class ConversationTurn(BaseModel):
    role: Role
    message: str


class InterestAssessment(BaseModel):
    interest_score: float = Field(ge=0, le=100)
    justification: str


class OutreachResult(BaseModel):
    candidate: CandidateProfile
    match_score: float
    transcript: list[ConversationTurn]
    interest_score: float = Field(ge=0, le=100)
    interest_justification: str


# ── Stage 4: Ranked Output ──────────────────────────────────────────

class RankedCandidate(BaseModel):
    rank: int
    name: str
    title: str
    match_score: float
    interest_score: float
    final_score: float
    top_matching_skills: list[str]
    interest_summary: str
    match_explanation: MatchExplanation
    transcript: list[ConversationTurn]
    interest_justification: str
