from __future__ import annotations

import json
import traceback

from models import (
    CandidateProfile,
    ConversationTurn,
    InterestAssessment,
    MatchResult,
    OutreachResult,
    ParsedJD,
    Role,
)
from llm_client import chat_completion, chat_completion_json


def _build_agent_system_prompt(jd: ParsedJD) -> str:
    return f"""\
You are a friendly, professional tech recruiter reaching out to a potential \
candidate about a role. Be warm and personalized — reference the candidate's \
background. Share relevant role highlights to spark interest.

Role you're recruiting for:
- Title: {jd.title}
- Summary: {jd.role_summary}
- Key skills: {', '.join(jd.required_skills)}
- Location: {jd.location_preference or 'Flexible'}
- Salary range: {f'${jd.salary_range.min:,}-${jd.salary_range.max:,}' if jd.salary_range else 'Competitive'}

Your goals across the conversation:
1. Open with a personalized hook referencing their background.
2. Share 2-3 compelling aspects of the role.
3. Gauge their interest, availability, and salary expectations.
4. Be natural — don't interrogate. Keep messages concise (2-4 sentences).

Respond ONLY with the recruiter's next message. No labels, no quotation marks wrapping the whole message.
"""


def _build_candidate_system_prompt(candidate: CandidateProfile) -> str:
    return f"""\
You are role-playing as a real tech professional responding to a recruiter's \
outreach message. Stay in character based on your profile.

Your profile:
- Name: {candidate.name}
- Current title: {candidate.title}
- Skills: {', '.join(candidate.skills)}
- Experience: {candidate.years_of_experience} years
- Location: {candidate.location}
- Availability: {candidate.availability}
- Salary expectation: {f'${candidate.salary_expectation:,}' if candidate.salary_expectation else 'Open'}
- Bio: {candidate.bio}

Behavior guidelines:
- Respond naturally as this person would. Some are enthusiastic, some cautious, \
  some not interested at all.
- If the role doesn't match your skills or interests, politely decline or express reservations.
- If you just accepted another offer or aren't looking, say so.
- Ask questions about the role if genuinely curious.
- Keep responses concise (1-3 sentences), like real LinkedIn/email replies.
- Do NOT break character. Do NOT mention that you are an AI.

Respond ONLY with the candidate's next message.
"""


def _assess_interest(transcript: list[ConversationTurn], model: str) -> InterestAssessment:
    convo_text = "\n".join(
        f"{'Recruiter' if t.role == Role.AGENT else 'Candidate'}: {t.message}"
        for t in transcript
    )
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert at analyzing recruiter-candidate conversations. "
                "Rate the candidate's interest level from 0-100 based on the conversation. "
                "Return JSON: {\"interest_score\": int, \"justification\": string}\n\n"
                "Scoring guide:\n"
                "- 0-20: Declined or clearly not interested\n"
                "- 21-40: Polite but lukewarm, significant reservations\n"
                "- 41-60: Somewhat interested but has concerns or conditions\n"
                "- 61-80: Interested with minor reservations\n"
                "- 81-100: Very enthusiastic, eager to proceed"
            ),
        },
        {
            "role": "user",
            "content": f"Analyze this conversation:\n\n{convo_text}",
        },
    ]
    data = chat_completion_json(messages, model=model, temperature=0.3)
    return InterestAssessment(
        interest_score=max(0, min(100, data.get("interest_score", 50))),
        justification=data.get("justification", "Unable to assess."),
    )


def simulate_outreach(
    jd: ParsedJD,
    match: MatchResult,
    model: str = "gpt-4o",
    min_turns: int = 3,
    max_turns: int = 5,
) -> OutreachResult:
    candidate = match.candidate
    agent_sys = _build_agent_system_prompt(jd)
    cand_sys = _build_candidate_system_prompt(candidate)

    transcript: list[ConversationTurn] = []
    agent_messages: list[dict] = [{"role": "system", "content": agent_sys}]
    cand_messages: list[dict] = [{"role": "system", "content": cand_sys}]

    # Seed the agent with candidate context for personalization
    agent_messages.append({
        "role": "user",
        "content": (
            f"You're reaching out to {candidate.name}, a {candidate.title} with "
            f"{candidate.years_of_experience} years of experience, skilled in "
            f"{', '.join(candidate.skills[:5])}. Craft your opening message."
        ),
    })

    for turn in range(max_turns):
        # Agent speaks
        agent_reply = chat_completion(agent_messages, model=model, temperature=0.8)
        transcript.append(ConversationTurn(role=Role.AGENT, message=agent_reply))
        agent_messages.append({"role": "assistant", "content": agent_reply})

        # Candidate responds
        cand_messages.append({"role": "user", "content": agent_reply})
        cand_reply = chat_completion(cand_messages, model=model, temperature=0.9)
        transcript.append(ConversationTurn(role=Role.CANDIDATE, message=cand_reply))
        cand_messages.append({"role": "assistant", "content": cand_reply})

        # Feed candidate reply back to agent for next turn
        agent_messages.append({"role": "user", "content": cand_reply})

        # Check for early termination after minimum turns
        if turn + 1 >= min_turns:
            decline_signals = [
                "not interested", "not looking", "accepted another",
                "pass on this", "decline", "not the right fit",
                "no thank you", "no thanks",
            ]
            cand_lower = cand_reply.lower()
            if any(sig in cand_lower for sig in decline_signals):
                break

    # Assess interest
    assessment = _assess_interest(transcript, model=model)

    return OutreachResult(
        candidate=candidate,
        match_score=match.match_score,
        transcript=transcript,
        interest_score=assessment.interest_score,
        interest_justification=assessment.justification,
    )


def run_outreach(
    jd: ParsedJD,
    matches: list[MatchResult],
    model: str = "gpt-4o",
    min_turns: int = 3,
    max_turns: int = 5,
) -> list[OutreachResult]:
    results: list[OutreachResult] = []
    for i, match in enumerate(matches, 1):
        print(f"  📞 Engaging candidate {i}/{len(matches)}: {match.candidate.name}...")
        try:
            result = simulate_outreach(jd, match, model=model, min_turns=min_turns, max_turns=max_turns)
            results.append(result)
        except Exception:
            print(f"  ⚠️  Outreach failed for {match.candidate.name}, skipping.")
            traceback.print_exc()
            # Graceful degradation — assign neutral interest score
            results.append(
                OutreachResult(
                    candidate=match.candidate,
                    match_score=match.match_score,
                    transcript=[],
                    interest_score=50.0,
                    interest_justification="Outreach simulation failed; default neutral score assigned.",
                )
            )
    return results
