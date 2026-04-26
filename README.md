# Talent Scout — AI-Powered Recruiting Agent

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38bdf8.svg)

An end-to-end AI recruiting pipeline that parses job descriptions, matches candidates from a talent pool, simulates recruiter–candidate conversations, and produces a ranked shortlist in a sleek, dark-glassmorphism dashboard.

## 🌟 Key Features

1. **Intelligent JD Parsing:** Extracts structured fields (skills, experience, salary, etc.) from raw Job Description text using LLMs.
2. **Semantic Matching:** Scores each candidate in the database against the parsed JD using weighted criteria.
3. **AI Outreach Simulation:** Dynamically generates simulated conversations between an AI Recruiter and AI Candidate to assess genuine interest and technical fit.
4. **Comprehensive Ranking:** Combines resume match scores (60%) and conversational interest scores (40%) into a final candidate ranking.
5. **Modern Dashboard:** A premium React frontend offering a seamless workflow from JD input to candidate deep-dives.

---

## 🏗 Architecture

```text
JD Text ──▶ JD Parser ──▶ Candidate Matcher ──▶ Outreach Agent ──▶ Ranker ──▶ React UI
              (LLM)       (weighted scoring)     (dual-LLM chat)    (combine)
```

## 🛠 Tech Stack

- **Backend:** Python, FastAPI, Pydantic, Azure OpenAI (via `azure-ai-inference`)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Dark Glassmorphism UI), Lucide Icons
- **Deployment:** Render (Web Service for API, Static Site for UI)

---

## 💻 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Azure OpenAI API access

### 1. Backend Setup
Navigate to the root directory and set up your Python environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the root directory:
```env
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/models
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

Start the FastAPI server:
```bash
python server.py
# Server runs on http://localhost:8001
# API Docs available at http://localhost:8001/docs
```

### 2. Frontend Setup
Open a new terminal tab and navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```
*Note: The local Vite dev server automatically proxies `/api` requests to `localhost:8001`.*

---

## 🚀 Deployment (Render)

Deploying Talent Scout requires two separate Render services: a Web Service (Backend) and a Static Site (Frontend).

### 1. Backend (FastAPI Web Service)
1. Create a new **Web Service** on Render and connect your repository.
2. **Language:** Python 3
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:**
   - `AZURE_OPENAI_API_KEY`: Your key
   - `AZURE_OPENAI_ENDPOINT`: Your endpoint
   - `AZURE_OPENAI_DEPLOYMENT`: e.g., `gpt-4o-mini`
   - `ALLOWED_ORIGINS`: The URL of your deployed frontend (e.g., `https://talent-scout-ui.onrender.com`). **Do not include a trailing slash!**

### 2. Frontend (React Static Site)
1. Create a new **Static Site** on Render and connect the same repository.
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL`: The URL of your deployed backend followed by `/api` (e.g., `https://talent-scout-api.onrender.com/api`). **Do not include a trailing slash!**

*(Note: After setting `VITE_API_URL`, trigger a "Manual Deploy -> Clear build cache & deploy" so the React app builds with the correct API URL).*

---

## 🛑 Troubleshooting

**1. Browser Console says "Failed to fetch" (CORS Error)**
- **Fix:** Ensure the `ALLOWED_ORIGINS` environment variable on your Render backend exactly matches your frontend URL without a trailing slash.

**2. Missing Outreach Transcripts / "Outreach simulation failed"**
- **Cause:** You are hitting Azure OpenAI Rate Limits (`429 Too Many Requests`). The outreach agent simulates 5 back-and-forth messages per candidate. For 5 candidates, that's 50 rapid API calls which can trigger basic-tier rate limits.
- **Fix:** In the UI, lower "Top N Candidates" to `1` or `2` to reduce the number of API calls, or increase your Azure OpenAI quota. The app gracefully falls back to a default interest score of `50` if the rate limit is hit.

---

## ⚙️ Configuration
You can tune the pipeline's behavior in `config.yaml`:
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
