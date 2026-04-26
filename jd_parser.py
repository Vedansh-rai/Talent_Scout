from __future__ import annotations

from models import ParsedJD, SalaryRange
from llm_client import chat_completion_json

_SYSTEM_PROMPT = """\
You are a job description parser. Extract structured information from the raw \
job description provided by the user.

Return a JSON object with EXACTLY these keys:
{
  "title": string,
  "required_skills": [string],
  "preferred_skills": [string],
  "min_experience_years": int or null,
  "education": string or null,
  "location_preference": string or null,
  "salary_range": {"min": int, "max": int} or null,
  "role_summary": string (2-3 sentence distillation)
}

Rules:
- required_skills: hard requirements explicitly stated.
- preferred_skills: nice-to-haves, "bonus", "preferred", "a plus".
- If a field is not mentioned or unclear, set it to null.
- Salary integers should be annual amounts in USD. Convert "150k" to 150000.
- Normalize skill names to their common form (e.g., "JS" → "JavaScript").
- Return ONLY valid JSON. No markdown, no commentary.
"""


def parse_jd(raw_jd: str, model: str = "gpt-4o") -> ParsedJD:
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": raw_jd},
    ]
    data = chat_completion_json(messages, model=model, temperature=0.2)

    # Build SalaryRange if present
    sr = data.get("salary_range")
    salary = None
    if sr and isinstance(sr, dict) and sr.get("min") is not None:
        salary = SalaryRange(min=sr["min"], max=sr["max"])

    return ParsedJD(
        title=data.get("title", "Unknown Role"),
        required_skills=data.get("required_skills", []),
        preferred_skills=data.get("preferred_skills", []),
        min_experience_years=data.get("min_experience_years"),
        education=data.get("education"),
        location_preference=data.get("location_preference"),
        salary_range=salary,
        role_summary=data.get("role_summary", ""),
    )
