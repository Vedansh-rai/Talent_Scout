import os
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yaml
from dotenv import load_dotenv

from jd_parser import parse_jd
from candidate_matcher import load_candidates, match_candidates
from outreach_agent import run_outreach
from ranker import rank
from models import ParsedJD, RankedCandidate

load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="Talent Scout API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_CONFIG_PATH = Path(__file__).parent / "config.yaml"

def _load_config() -> dict:
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return {}

class ScoutRequest(BaseModel):
    jd_text: str
    top_n: int = 0
    skip_outreach: bool = False
    model: str = ""

class ScoutResponse(BaseModel):
    parsed_jd: ParsedJD
    candidates: List[RankedCandidate]

@app.post("/api/scout", response_model=ScoutResponse)
def scout_candidates(req: ScoutRequest):
    if not req.jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty.")

    cfg = _load_config()
    
    top_n = req.top_n if req.top_n > 0 else cfg.get("top_n", 10)
    model = req.model if req.model else cfg.get("model", "gpt-4o")
    
    outreach_cfg = cfg.get("outreach", {})
    min_turns = outreach_cfg.get("min_turns", 3)
    max_turns = outreach_cfg.get("max_turns", 5)

    try:
        # Stage 1: Parse JD
        parsed_jd = parse_jd(req.jd_text, model=model)
        
        # Stage 2: Match Candidates
        candidates = load_candidates()
        matches = match_candidates(parsed_jd, candidates, top_n=top_n)
        
        # Stage 3: Outreach
        outreach_results = []
        if not req.skip_outreach:
            outreach_results = run_outreach(
                parsed_jd, matches, model=model,
                min_turns=min_turns, max_turns=max_turns
            )
            
        # Stage 4: Rank
        ranked = rank(matches, outreach_results)
        
        return ScoutResponse(parsed_jd=parsed_jd, candidates=ranked)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
