#!/usr/bin/env python3
"""AI-Powered Talent Scouting & Engagement Agent — CLI entrypoint."""

from __future__ import annotations

import sys
from pathlib import Path

import typer
import yaml
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from jd_parser import parse_jd
from candidate_matcher import load_candidates, match_candidates
from outreach_agent import run_outreach
from ranker import rank, print_table, save_results

app = typer.Typer(
    name="talent-scout",
    help="AI-powered talent scouting agent: parse JD → match → engage → rank.",
    add_completion=False,
)

_ROOT = Path(__file__).parent
_CONFIG_PATH = _ROOT / "config.yaml"


def _load_config() -> dict:
    with open(_CONFIG_PATH) as f:
        return yaml.safe_load(f)


@app.command()
def run(
    jd_file: Path = typer.Option(..., "--jd-file", "-j", help="Path to job description text file."),
    top_n: int = typer.Option(0, "--top-n", "-n", help="Number of candidates to shortlist (0 = use config default)."),
    model: str = typer.Option("", "--model", "-m", help="LLM model override (default from config)."),
    skip_outreach: bool = typer.Option(False, "--skip-outreach", help="Skip conversational outreach (match-only mode)."),
) -> None:
    cfg = _load_config()

    if top_n <= 0:
        top_n = cfg.get("top_n", 10)
    if not model:
        model = cfg.get("model", "gpt-4o")

    outreach_cfg = cfg.get("outreach", {})
    min_turns = outreach_cfg.get("min_turns", 3)
    max_turns = outreach_cfg.get("max_turns", 5)

    # ── Stage 1: Parse JD ───────────────────────────────────────────
    if not jd_file.exists():
        typer.echo(f"Error: JD file not found: {jd_file}", err=True)
        raise typer.Exit(code=1)

    raw_jd = jd_file.read_text().strip()
    if not raw_jd:
        typer.echo("Error: JD file is empty.", err=True)
        raise typer.Exit(code=1)

    print("\n🔍 Stage 1: Parsing job description...")
    parsed_jd = parse_jd(raw_jd, model=model)
    print(f"   ✅ Parsed: {parsed_jd.title}")
    print(f"   Required skills: {', '.join(parsed_jd.required_skills)}")
    print(f"   Preferred skills: {', '.join(parsed_jd.preferred_skills)}")
    print(f"   Min experience: {parsed_jd.min_experience_years or 'N/A'}y")
    print(f"   Location: {parsed_jd.location_preference or 'Any'}")
    if parsed_jd.salary_range:
        print(f"   Salary: ${parsed_jd.salary_range.min:,}–${parsed_jd.salary_range.max:,}")

    # ── Stage 2: Candidate Matching ─────────────────────────────────
    print(f"\n🎯 Stage 2: Matching candidates (top {top_n})...")
    candidates = load_candidates()
    print(f"   Loaded {len(candidates)} candidates from pool.")
    matches = match_candidates(parsed_jd, candidates, top_n=top_n)
    print(f"   ✅ Top {len(matches)} candidates selected by match score.")
    for i, m in enumerate(matches, 1):
        print(f"   {i:>3}. {m.candidate.name:<22} Match: {m.match_score:.1f}")

    # ── Stage 3: Conversational Outreach ────────────────────────────
    if skip_outreach:
        print("\n⏭️  Stage 3: Skipped (--skip-outreach)")
        outreach_results = []
    else:
        print(f"\n💬 Stage 3: Simulating outreach conversations ({min_turns}-{max_turns} turns)...")
        outreach_results = run_outreach(
            parsed_jd, matches, model=model,
            min_turns=min_turns, max_turns=max_turns,
        )
        print(f"   ✅ Completed outreach for {len(outreach_results)} candidates.")

    # ── Stage 4: Rank & Output ──────────────────────────────────────
    print("\n📊 Stage 4: Ranking and generating output...")
    ranked = rank(matches, outreach_results)
    print_table(ranked)

    json_path, csv_path = save_results(ranked)
    print(f"\n📁 Detailed results saved to:")
    print(f"   JSON: {json_path}")
    print(f"   CSV:  {csv_path}")
    print()


if __name__ == "__main__":
    app()
