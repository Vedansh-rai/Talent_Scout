"""Talent Scout — FastAPI server exposing the scouting pipeline as an API."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import List

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from candidate_matcher import load_candidates, match_candidates
from jd_parser import parse_jd
from models import ParsedJD, RankedCandidate
from outreach_agent import run_outreach
from ranker import rank

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger("talent_scout")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="Talent Scout API",
    description="AI-powered talent scouting agent: parse JD → match → engage → rank.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — restrict in production via ALLOWED_ORIGINS env var
# ---------------------------------------------------------------------------
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Config helpers
# ---------------------------------------------------------------------------
_CONFIG_PATH = Path(__file__).parent / "config.yaml"


def _load_config() -> dict:
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return {}


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class ScoutRequest(BaseModel):
    jd_text: str = Field(..., min_length=1, description="Raw job description text.")
    top_n: int = Field(default=0, ge=0, le=50, description="Candidates to shortlist (0 = config default).")
    skip_outreach: bool = Field(default=False, description="Skip conversational outreach simulation.")
    model: str = Field(default="", description="LLM model override.")


class ScoutResponse(BaseModel):
    parsed_jd: ParsedJD
    candidates: List[RankedCandidate]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health_check():
    """Liveness probe — returns OK when the server is running."""
    return {"status": "ok"}


@app.post("/api/scout", response_model=ScoutResponse)
def scout_candidates(req: ScoutRequest):
    """Run the full scouting pipeline against the candidate pool."""
    jd_text = req.jd_text.strip()
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")

    cfg = _load_config()

    top_n = req.top_n if req.top_n > 0 else cfg.get("top_n", 10)
    model = req.model if req.model else cfg.get("model", "gpt-4o")

    outreach_cfg = cfg.get("outreach", {})
    min_turns = outreach_cfg.get("min_turns", 3)
    max_turns = outreach_cfg.get("max_turns", 5)

    try:
        # Stage 1: Parse JD
        logger.info("Stage 1 — Parsing JD …")
        parsed_jd = parse_jd(jd_text, model=model)
        logger.info("Parsed JD: %s", parsed_jd.title)

        # Stage 2: Match Candidates
        logger.info("Stage 2 — Matching top %d candidates …", top_n)
        candidates = load_candidates()
        matches = match_candidates(parsed_jd, candidates, top_n=top_n)
        logger.info("Matched %d candidates", len(matches))

        # Stage 3: Outreach
        outreach_results = []
        if not req.skip_outreach:
            logger.info("Stage 3 — Running outreach simulations …")
            outreach_results = run_outreach(
                parsed_jd,
                matches,
                model=model,
                min_turns=min_turns,
                max_turns=max_turns,
            )
            logger.info("Completed outreach for %d candidates", len(outreach_results))
        else:
            logger.info("Stage 3 — Outreach skipped")

        # Stage 4: Rank
        logger.info("Stage 4 — Ranking …")
        ranked = rank(matches, outreach_results)

        return ScoutResponse(parsed_jd=parsed_jd, candidates=ranked)

    except HTTPException:
        raise
    except Exception:
        logger.exception("Scouting pipeline failed")
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
