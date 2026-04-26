from __future__ import annotations

import json
from pathlib import Path

import yaml

from models import (
    CandidateProfile,
    CriterionScore,
    MatchExplanation,
    MatchResult,
    ParsedJD,
)

_ROOT = Path(__file__).parent
_CONFIG_PATH = _ROOT / "config.yaml"
_CANDIDATES_PATH = _ROOT / "data" / "candidates.json"


def _load_config() -> dict:
    with open(_CONFIG_PATH) as f:
        return yaml.safe_load(f)


def _load_skill_aliases(cfg: dict) -> dict[str, str]:
    return {k.lower().strip(): v.lower().strip() for k, v in cfg.get("skill_aliases", {}).items()}


def _normalize_skill(skill: str, aliases: dict[str, str]) -> str:
    s = skill.lower().strip()
    return aliases.get(s, s)


def _normalize_skills(skills: list[str], aliases: dict[str, str]) -> set[str]:
    return {_normalize_skill(s, aliases) for s in skills}


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _skill_recall(required: set[str], candidate: set[str]) -> float:
    """Fraction of required skills the candidate actually has."""
    if not required:
        return 1.0
    return len(required & candidate) / len(required)


def load_candidates(path: Path | None = None) -> list[CandidateProfile]:
    path = path or _CANDIDATES_PATH
    with open(path) as f:
        data = json.load(f)
    return [CandidateProfile(**c) for c in data]


def _score_required_skills(
    jd_skills: set[str], cand_skills: set[str]
) -> CriterionScore:
    recall = _skill_recall(jd_skills, cand_skills)
    score = round(recall * 100, 1)
    matched = jd_skills & cand_skills
    missing = jd_skills - cand_skills
    parts = []
    if matched:
        parts.append(f"Matched: {', '.join(sorted(matched))}")
    if missing:
        parts.append(f"Missing: {', '.join(sorted(missing))}")
    rationale = ". ".join(parts) if parts else "No required skills specified."
    return CriterionScore(score=score, rationale=rationale)


def _score_preferred_skills(
    jd_skills: set[str], cand_skills: set[str]
) -> CriterionScore:
    recall = _skill_recall(jd_skills, cand_skills)
    score = round(recall * 100, 1)
    matched = jd_skills & cand_skills
    rationale = (
        f"Has {len(matched)}/{len(jd_skills)} preferred skills."
        if jd_skills
        else "No preferred skills specified."
    )
    return CriterionScore(score=score, rationale=rationale)


def _score_experience(
    min_years: int | None, cand_years: int
) -> CriterionScore:
    if min_years is None:
        return CriterionScore(score=100, rationale="No experience requirement specified.")

    if cand_years >= min_years:
        # Diminishing returns above requirement — cap bonus at +20%
        extra = min(cand_years - min_years, 5)
        score = min(100, 80 + extra * 4)
        rationale = (
            f"Candidate has {cand_years}y vs {min_years}y required "
            f"({cand_years - min_years}y above)."
        )
    else:
        gap = min_years - cand_years
        score = max(0, 80 - gap * 20)
        rationale = (
            f"Candidate has {cand_years}y vs {min_years}y required "
            f"({gap}y below)."
        )
    return CriterionScore(score=round(score, 1), rationale=rationale)


def _score_education(
    jd_edu: str | None, cand_edu: str
) -> CriterionScore:
    if not jd_edu:
        return CriterionScore(score=100, rationale="No education requirement specified.")

    hierarchy = ["high school", "associate", "bachelor", "master", "phd", "doctorate"]

    def _level(s: str) -> int:
        s_low = s.lower()
        for i, h in enumerate(hierarchy):
            if h in s_low:
                return i
        return -1

    jd_level = _level(jd_edu)
    cand_level = _level(cand_edu)

    if jd_level < 0:
        # Can't parse JD education — give full marks
        return CriterionScore(score=80, rationale=f"Could not parse JD education '{jd_edu}'; giving default score.")

    if cand_level >= jd_level:
        return CriterionScore(score=100, rationale=f"Meets or exceeds education requirement ({cand_edu} vs {jd_edu}).")
    else:
        score = max(0, 100 - (jd_level - cand_level) * 30)
        return CriterionScore(score=score, rationale=f"Below education requirement ({cand_edu} vs {jd_edu}).")


def _score_location(
    jd_loc: str | None, cand_loc: str
) -> CriterionScore:
    if not jd_loc:
        return CriterionScore(score=100, rationale="No location requirement specified.")

    jd_low = jd_loc.lower()
    cand_low = cand_loc.lower()

    if "remote" in jd_low:
        return CriterionScore(score=100, rationale="Role is remote-friendly; any location works.")

    # Check city / region overlap
    jd_tokens = set(jd_low.replace(",", " ").split())
    cand_tokens = set(cand_low.replace(",", " ").split())

    if jd_tokens & cand_tokens:
        return CriterionScore(score=100, rationale=f"Location match: {cand_loc} aligns with {jd_loc}.")

    if "hybrid" in jd_low:
        return CriterionScore(score=40, rationale=f"Hybrid role in {jd_loc}; candidate is in {cand_loc} — may not commute.")

    return CriterionScore(score=20, rationale=f"Location mismatch: {cand_loc} vs required {jd_loc}.")


def score_candidate(
    jd: ParsedJD, candidate: CandidateProfile, aliases: dict[str, str], weights: dict[str, float]
) -> MatchResult:
    jd_req = _normalize_skills(jd.required_skills, aliases)
    jd_pref = _normalize_skills(jd.preferred_skills, aliases)
    cand_skills = _normalize_skills(candidate.skills, aliases)

    criteria: dict[str, CriterionScore | None] = {}
    active_weights: dict[str, float] = {}

    # Compute each criterion, skipping those with no JD data
    req = _score_required_skills(jd_req, cand_skills)
    if jd.required_skills:
        criteria["required_skills"] = req
        active_weights["required_skills"] = weights["required_skills"]
    else:
        criteria["required_skills"] = req

    pref = _score_preferred_skills(jd_pref, cand_skills)
    if jd.preferred_skills:
        criteria["preferred_skills"] = pref
        active_weights["preferred_skills"] = weights["preferred_skills"]
    else:
        criteria["preferred_skills"] = pref

    exp = _score_experience(jd.min_experience_years, candidate.years_of_experience)
    if jd.min_experience_years is not None:
        criteria["experience"] = exp
        active_weights["experience"] = weights["experience"]
    else:
        criteria["experience"] = exp

    edu = _score_education(jd.education, candidate.education)
    if jd.education:
        criteria["education"] = edu
        active_weights["education"] = weights["education"]
    else:
        criteria["education"] = edu

    loc = _score_location(jd.location_preference, candidate.location)
    if jd.location_preference:
        criteria["location"] = loc
        active_weights["location"] = weights["location"]
    else:
        criteria["location"] = loc

    # Redistribute weights if some criteria are inactive
    total_active = sum(active_weights.values()) or 1.0
    weighted_score = 0.0
    for key, w in active_weights.items():
        criterion = criteria[key]
        if criterion:
            weighted_score += (w / total_active) * criterion.score

    # If no active weights (no JD info at all), fall back to 50
    if not active_weights:
        weighted_score = 50.0

    match_score = round(min(100, max(0, weighted_score)), 1)

    explanation = MatchExplanation(
        required_skills=criteria.get("required_skills"),
        preferred_skills=criteria.get("preferred_skills"),
        experience=criteria.get("experience"),
        education=criteria.get("education"),
        location=criteria.get("location"),
    )

    return MatchResult(
        candidate=candidate,
        match_score=match_score,
        match_explanation=explanation,
    )


def match_candidates(
    jd: ParsedJD, candidates: list[CandidateProfile], top_n: int = 10
) -> list[MatchResult]:
    cfg = _load_config()
    aliases = _load_skill_aliases(cfg)
    weights = cfg.get("weights", {
        "required_skills": 0.40,
        "preferred_skills": 0.15,
        "experience": 0.20,
        "education": 0.10,
        "location": 0.15,
    })

    results = [score_candidate(jd, c, aliases, weights) for c in candidates]
    results.sort(key=lambda r: r.match_score, reverse=True)
    return results[:top_n]
