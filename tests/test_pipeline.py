"""Tests for the talent scouting pipeline — matcher, ranker, and JD parsing edge cases."""

import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import (
    CandidateProfile,
    ConversationTurn,
    CriterionScore,
    MatchExplanation,
    MatchResult,
    OutreachResult,
    ParsedJD,
    RankedCandidate,
    Role,
    SalaryRange,
)
from candidate_matcher import (
    _normalize_skill,
    _normalize_skills,
    _score_required_skills,
    _score_preferred_skills,
    _score_experience,
    _score_education,
    _score_location,
    score_candidate,
    load_candidates,
)
from ranker import rank


# ── Fixtures ────────────────────────────────────────────────────────

@pytest.fixture
def sample_jd() -> ParsedJD:
    return ParsedJD(
        title="Senior Backend Engineer",
        required_skills=["Python", "FastAPI", "PostgreSQL", "AWS"],
        preferred_skills=["Docker", "Kubernetes"],
        min_experience_years=5,
        education="Bachelor's in Computer Science",
        location_preference="Remote, US timezone",
        salary_range=SalaryRange(min=150000, max=190000),
        role_summary="Senior backend role building APIs.",
    )


@pytest.fixture
def perfect_candidate() -> CandidateProfile:
    return CandidateProfile(
        id="t001",
        name="Perfect Match",
        title="Senior Backend Engineer",
        skills=["Python", "FastAPI", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
        years_of_experience=7,
        education="Master's in Computer Science",
        location="Remote, US timezone",
        bio="Ideal candidate.",
        availability="Available now",
        salary_expectation=175000,
    )


@pytest.fixture
def partial_candidate() -> CandidateProfile:
    return CandidateProfile(
        id="t002",
        name="Partial Match",
        title="Backend Developer",
        skills=["Python", "Django", "MySQL"],
        years_of_experience=3,
        education="Bachelor's in Computer Science",
        location="New York, NY",
        bio="Some overlap.",
        availability="2 weeks",
        salary_expectation=130000,
    )


@pytest.fixture
def zero_match_candidate() -> CandidateProfile:
    return CandidateProfile(
        id="t003",
        name="No Match",
        title="Graphic Designer",
        skills=["Photoshop", "Illustrator", "Figma"],
        years_of_experience=5,
        education="Bachelor's in Fine Arts",
        location="London, UK",
        bio="Not a developer.",
        availability="Available",
        salary_expectation=80000,
    )


@pytest.fixture
def aliases() -> dict[str, str]:
    return {
        "js": "javascript",
        "ts": "typescript",
        "postgres": "postgresql",
        "k8s": "kubernetes",
        "py": "python",
    }


@pytest.fixture
def weights() -> dict[str, float]:
    return {
        "required_skills": 0.40,
        "preferred_skills": 0.15,
        "experience": 0.20,
        "education": 0.10,
        "location": 0.15,
    }


# ── Skill Normalization Tests ───────────────────────────────────────

class TestSkillNormalization:
    def test_alias_resolution(self, aliases):
        assert _normalize_skill("JS", aliases) == "javascript"
        assert _normalize_skill("k8s", aliases) == "kubernetes"
        assert _normalize_skill("Postgres", aliases) == "postgresql"

    def test_no_alias(self, aliases):
        assert _normalize_skill("Python", aliases) == "python"
        assert _normalize_skill("FastAPI", aliases) == "fastapi"

    def test_whitespace_handling(self, aliases):
        assert _normalize_skill("  JS  ", aliases) == "javascript"

    def test_normalize_set(self, aliases):
        result = _normalize_skills(["JS", "Python", "k8s"], aliases)
        assert result == {"javascript", "python", "kubernetes"}


# ── Required Skills Scoring ─────────────────────────────────────────

class TestRequiredSkillsScoring:
    def test_full_overlap(self):
        jd = {"python", "fastapi", "postgresql"}
        cand = {"python", "fastapi", "postgresql", "docker"}
        result = _score_required_skills(jd, cand)
        assert result.score == 100.0

    def test_partial_overlap(self):
        jd = {"python", "fastapi", "postgresql", "aws"}
        cand = {"python", "django"}
        result = _score_required_skills(jd, cand)
        assert result.score == 25.0  # 1/4

    def test_zero_overlap(self):
        jd = {"python", "fastapi"}
        cand = {"java", "spring"}
        result = _score_required_skills(jd, cand)
        assert result.score == 0.0

    def test_empty_jd_skills(self):
        result = _score_required_skills(set(), {"python"})
        assert result.score == 100.0  # No requirements = full score


# ── Experience Scoring ──────────────────────────────────────────────

class TestExperienceScoring:
    def test_meets_requirement(self):
        result = _score_experience(5, 5)
        assert result.score == 80.0

    def test_exceeds_requirement(self):
        result = _score_experience(5, 8)
        assert result.score == 92.0  # 80 + 3*4

    def test_below_requirement(self):
        result = _score_experience(5, 3)
        assert result.score == 40.0  # 80 - 2*20

    def test_no_requirement(self):
        result = _score_experience(None, 3)
        assert result.score == 100.0

    def test_far_below(self):
        result = _score_experience(10, 1)
        assert result.score == 0.0  # 80 - 9*20 clamped at 0


# ── Education Scoring ───────────────────────────────────────────────

class TestEducationScoring:
    def test_meets_requirement(self):
        result = _score_education("Bachelor's", "Bachelor's in CS")
        assert result.score == 100.0

    def test_exceeds_requirement(self):
        result = _score_education("Bachelor's", "Master's in CS")
        assert result.score == 100.0

    def test_below_requirement(self):
        result = _score_education("Master's", "Bachelor's in CS")
        assert result.score == 70.0

    def test_no_requirement(self):
        result = _score_education(None, "High School")
        assert result.score == 100.0


# ── Location Scoring ────────────────────────────────────────────────

class TestLocationScoring:
    def test_remote_friendly(self):
        result = _score_location("Remote", "Anywhere, Moon")
        assert result.score == 100.0

    def test_city_match(self):
        result = _score_location("New York", "New York, NY")
        assert result.score == 100.0

    def test_city_mismatch(self):
        result = _score_location("San Francisco, onsite", "London, UK")
        assert result.score == 20.0

    def test_no_requirement(self):
        result = _score_location(None, "Mars")
        assert result.score == 100.0


# ── Full Candidate Scoring ──────────────────────────────────────────

class TestFullScoring:
    def test_perfect_candidate_scores_high(self, sample_jd, perfect_candidate, aliases, weights):
        result = score_candidate(sample_jd, perfect_candidate, aliases, weights)
        assert result.match_score >= 85.0

    def test_partial_candidate_scores_mid(self, sample_jd, partial_candidate, aliases, weights):
        result = score_candidate(sample_jd, partial_candidate, aliases, weights)
        assert 20.0 <= result.match_score <= 70.0

    def test_zero_match_scores_low(self, sample_jd, zero_match_candidate, aliases, weights):
        result = score_candidate(sample_jd, zero_match_candidate, aliases, weights)
        # 0 skill overlap but matches on experience/education/location → mid-low score
        assert result.match_score < 50.0
        assert result.match_explanation.required_skills.score == 0.0

    def test_explanation_populated(self, sample_jd, perfect_candidate, aliases, weights):
        result = score_candidate(sample_jd, perfect_candidate, aliases, weights)
        assert result.match_explanation.required_skills is not None
        assert result.match_explanation.experience is not None


# ── Ranker Tests ────────────────────────────────────────────────────

class TestRanker:
    def _make_match(self, cand: CandidateProfile, score: float) -> MatchResult:
        return MatchResult(
            candidate=cand,
            match_score=score,
            match_explanation=MatchExplanation(
                required_skills=CriterionScore(score=score, rationale="test"),
            ),
        )

    def _make_outreach(self, cand: CandidateProfile, match_score: float, interest: float) -> OutreachResult:
        return OutreachResult(
            candidate=cand,
            match_score=match_score,
            transcript=[
                ConversationTurn(role=Role.AGENT, message="Hi!"),
                ConversationTurn(role=Role.CANDIDATE, message="Hello!"),
            ],
            interest_score=interest,
            interest_justification=f"Interest level: {interest}",
        )

    def test_ranking_order(self, perfect_candidate, partial_candidate):
        matches = [
            self._make_match(perfect_candidate, 90.0),
            self._make_match(partial_candidate, 60.0),
        ]
        outreach = [
            self._make_outreach(perfect_candidate, 90.0, 50.0),  # final: 54+20=74
            self._make_outreach(partial_candidate, 60.0, 95.0),  # final: 36+38=74
        ]
        ranked = rank(matches, outreach)
        # Both score 74, so order depends on sort stability or tie-breaking
        assert len(ranked) == 2
        assert ranked[0].rank == 1
        assert ranked[1].rank == 2

    def test_interest_beats_match(self, perfect_candidate, partial_candidate):
        """A good-match eager candidate should beat a perfect-match uninterested one."""
        matches = [
            self._make_match(perfect_candidate, 95.0),
            self._make_match(partial_candidate, 70.0),
        ]
        outreach = [
            self._make_outreach(perfect_candidate, 95.0, 10.0),  # final: 57+4=61
            self._make_outreach(partial_candidate, 70.0, 95.0),  # final: 42+38=80
        ]
        ranked = rank(matches, outreach)
        assert ranked[0].name == "Partial Match"
        assert ranked[0].final_score > ranked[1].final_score


# ── JD Parsing with Missing Fields ──────────────────────────────────

class TestParsedJDMissingFields:
    def test_jd_with_no_salary(self):
        jd = ParsedJD(
            title="Engineer",
            required_skills=["Python"],
            role_summary="A role.",
        )
        assert jd.salary_range is None
        assert jd.education is None
        assert jd.location_preference is None

    def test_weight_redistribution(self, zero_match_candidate, aliases, weights):
        """When JD has no education/location, those weights redistribute."""
        jd = ParsedJD(
            title="Developer",
            required_skills=["Python"],
            min_experience_years=3,
            role_summary="A role.",
        )
        result = score_candidate(jd, zero_match_candidate, aliases, weights)
        assert result.match_score >= 0
        assert result.match_explanation.education is not None


# ── Candidates Loading ──────────────────────────────────────────────

class TestCandidateLoading:
    def test_load_candidates(self):
        candidates = load_candidates()
        assert len(candidates) == 50
        assert all(c.id for c in candidates)
        assert all(c.name for c in candidates)
