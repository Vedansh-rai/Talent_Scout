from __future__ import annotations

import csv
import json
from pathlib import Path

import yaml

from models import (
    MatchResult,
    OutreachResult,
    RankedCandidate,
)

_ROOT = Path(__file__).parent
_CONFIG_PATH = _ROOT / "config.yaml"
_OUTPUT_DIR = _ROOT / "output"


def _load_score_weights() -> tuple[float, float]:
    with open(_CONFIG_PATH) as f:
        cfg = yaml.safe_load(f)
    formula = cfg.get("score_formula", {})
    return formula.get("match_weight", 0.6), formula.get("interest_weight", 0.4)


def rank(
    matches: list[MatchResult],
    outreach_results: list[OutreachResult],
) -> list[RankedCandidate]:
    match_weight, interest_weight = _load_score_weights()

    # Build a lookup from candidate id → outreach result
    outreach_map: dict[str, OutreachResult] = {
        o.candidate.id: o for o in outreach_results
    }

    ranked: list[RankedCandidate] = []
    for m in matches:
        o = outreach_map.get(m.candidate.id)
        interest_score = o.interest_score if o else 50.0
        interest_just = o.interest_justification if o else "No outreach data."
        transcript = o.transcript if o else []

        final = round(match_weight * m.match_score + interest_weight * interest_score, 1)

        # Determine top matching skills from explanation
        top_skills: list[str] = []
        if m.match_explanation.required_skills:
            rationale = m.match_explanation.required_skills.rationale
            if "Matched:" in rationale:
                matched_part = rationale.split("Matched:")[1].split(".")[0]
                top_skills = [s.strip() for s in matched_part.split(",") if s.strip()]

        # Truncate interest justification for summary column
        interest_summary = interest_just[:120] if interest_just else ""

        ranked.append(
            RankedCandidate(
                rank=0,  # assigned after sorting
                name=m.candidate.name,
                title=m.candidate.title,
                match_score=m.match_score,
                interest_score=interest_score,
                final_score=final,
                top_matching_skills=top_skills[:5],
                interest_summary=interest_summary,
                match_explanation=m.match_explanation,
                transcript=transcript,
                interest_justification=interest_just,
            )
        )

    ranked.sort(key=lambda r: r.final_score, reverse=True)
    for i, r in enumerate(ranked, 1):
        r.rank = i

    return ranked


def print_table(ranked: list[RankedCandidate]) -> None:
    header = (
        f"{'Rank':<5} {'Name':<22} {'Title':<28} "
        f"{'Match':>6} {'Interest':>9} {'Final':>6}  "
        f"{'Top Skills':<30} {'Interest Summary'}"
    )
    sep = "─" * len(header)
    print(f"\n{sep}")
    print("  🏆  TALENT SHORTLIST — RANKED RESULTS")
    print(sep)
    print(header)
    print(sep)
    for r in ranked:
        skills_str = ", ".join(r.top_matching_skills[:3]) or "—"
        summary = r.interest_summary[:50] + ("…" if len(r.interest_summary) > 50 else "")
        print(
            f"{r.rank:<5} {r.name:<22} {r.title:<28} "
            f"{r.match_score:>6.1f} {r.interest_score:>9.1f} {r.final_score:>6.1f}  "
            f"{skills_str:<30} {summary}"
        )
    print(sep)


def save_results(ranked: list[RankedCandidate]) -> tuple[Path, Path]:
    _OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # JSON — full detail cards
    json_path = _OUTPUT_DIR / "results.json"
    data = [r.model_dump(mode="json") for r in ranked]
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2, default=str)

    # CSV — summary table
    csv_path = _OUTPUT_DIR / "shortlist.csv"
    fieldnames = [
        "rank", "name", "title", "match_score", "interest_score",
        "final_score", "top_matching_skills", "interest_summary",
    ]
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in ranked:
            writer.writerow({
                "rank": r.rank,
                "name": r.name,
                "title": r.title,
                "match_score": r.match_score,
                "interest_score": r.interest_score,
                "final_score": r.final_score,
                "top_matching_skills": "; ".join(r.top_matching_skills),
                "interest_summary": r.interest_summary,
            })

    return json_path, csv_path
