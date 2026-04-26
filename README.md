# Talent Scout — AI-Powered Recruiting Agent

An end-to-end AI recruiting pipeline that parses job descriptions, matches
candidates from a talent pool, simulates recruiter–candidate conversations, and
produces a ranked shortlist.

## Architecture

```
JD Text ──▶ JD Parser ──▶ Candidate Matcher ──▶ Outreach Agent ──▶ Ranker ──▶ Results
              (LLM)       (weighted scoring)     (dual-LLM chat)    (combine)   (JSON/CSV)
```

| Stage | Module | Description |
|-------|--------|-------------|
| 1 | `jd_parser.py` | Extracts structured fields (skills, experience, salary, etc.) from raw JD text via LLM |
| 2 | `candidate_matcher.py` | Scores each candidate against the parsed JD using weighted criteria (skills, experience, education, location) |
| 3 | `outreach_agent.py` | Simulates multi-turn recruiter ↔ candidate conversations and assesses interest (0–100) |
| 4 | `ranker.py` | Combines match score (60%) + interest score (40%) into a final ranking |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (for the frontend)
- Azure OpenAI API access

### 1. Backend

```bash
cd talent_scout
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

**CLI mode:**

```bash
python main.py --jd-file jd.txt --top-n 5
```

**API server:**

```bash
python server.py
# → http://localhost:8001
# → Docs at http://localhost:8001/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxies API calls to :8001)
```

### 3. Run Tests

```bash
pytest tests/ -v
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/scout` | Run full scouting pipeline |

### `POST /api/scout`

```json
{
  "jd_text": "Senior Backend Engineer...",
  "top_n": 5,
  "skip_outreach": false
}
```

Returns `{ parsed_jd, candidates[] }` with full match explanations, outreach
transcripts, and ranked scores.

## Configuration

Edit `config.yaml` to tune weights, model, and outreach parameters:

```yaml
model: gpt-4o-mini
top_n: 10

weights:
  required_skills: 0.40
  preferred_skills: 0.15
  experience: 0.20
  education: 0.10
  location: 0.15

score_formula:
  match_weight: 0.6
  interest_weight: 0.4

outreach:
  min_turns: 3
  max_turns: 5
```

## Project Structure

```
talent_scout/
├── main.py                 # CLI entrypoint (Typer)
├── server.py               # FastAPI server
├── jd_parser.py            # Stage 1 — JD parsing via LLM
├── candidate_matcher.py    # Stage 2 — weighted candidate scoring
├── outreach_agent.py       # Stage 3 — dual-LLM outreach simulation
├── ranker.py               # Stage 4 — final ranking & output
├── llm_client.py           # Azure OpenAI client wrapper
├── models.py               # Pydantic data models
├── config.yaml             # Weights, model, and pipeline config
├── requirements.txt        # Python dependencies
├── data/
│   └── candidates.json     # 50-candidate talent pool
├── output/
│   ├── results.json        # Detailed ranked output
│   └── shortlist.csv       # Summary CSV
├── tests/
│   └── test_pipeline.py    # Pytest suite
└── frontend/               # React + TypeScript + Tailwind UI
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   ├── types.ts
    │   └── components/
    └── package.json
```
