"""
Solution Generator — Call 2 of 2 in the pipeline.
Uses Sonnet with retrieved cases as grounding. Streams output.
"""

import json
from collections.abc import AsyncGenerator

from app.llm.anthropic_client import get_client
from app.schemas.solution import Constraints, Material, Solution

GENERATE_SYSTEM = """You are JugaadGPT — a fabricator's notebook, not a consultant.

Your job: generate ONE practical, buildable solution within the user's exact constraints.
You are grounded in real-world jugaad innovations documented from India.

HARD RULES (never violate):
- Total BOM cost MUST be ≤ budget_inr stated in constraints
- If power_availability is "none", the solution must require NO electricity at any step
- Use only materials available in the user's region (state/climate)
- Build steps must be completable at the stated skill_level

OUTPUT FORMAT (respond with valid JSON only, no markdown):
{
  "title": "Short descriptive name for the solution",
  "summary": "One paragraph: what it is and why it works for this constraint set",
  "materials": [
    {"item": "name", "quantity": "2 pieces", "cost_inr": 150, "source": "hardware_store|kabadiwala|free|agriculture_shop"}
  ],
  "total_cost_inr": 300,
  "build_steps": ["Step 1...", "Step 2...", ...],
  "expected_outcome": "Honest performance estimate with numbers where possible",
  "failure_modes": ["If X happens, do Y instead", ...],
  "maintenance": "What upkeep is needed and how often",
  "skill_check": "Any step that needs special skill or a helper"
}

Be specific. Rupee amounts, dimensions, time estimates. Not "get some clay pots" — "two unglazed clay matkas, 10-12 inch diameter, ₹80-120 each from any pottery market."
If the retrieved cases don't fit the user's constraints, adapt them — don't copy blindly."""


def _build_user_prompt(constraints: Constraints, cases: list[dict], conversation_history: str = "", language: str = "hinglish") -> str:
    cases_text = ""
    for i, case in enumerate(cases[:5], 1):
        cases_text += f"\n--- Reference Case {i}: {case.get('title', 'Unknown')} ---\n"
        cases_text += f"Problem: {case.get('problem_description', '')}\n"
        cases_text += f"Solution: {case.get('solution_summary', '')}\n"
        try:
            materials = json.loads(case.get("materials_json", "[]"))
            cases_text += f"Materials: {materials}\n"
        except (json.JSONDecodeError, TypeError):
            cases_text += f"Materials: {case.get('materials_json', '')}\n"
        cases_text += f"Cost: ₹{case.get('total_cost_inr', 'unknown')}\n"
        if case.get("failure_modes"):
            cases_text += f"Failure modes: {case['failure_modes']}\n"

    history_section = f"\n{conversation_history}\n" if conversation_history else ""

    lang_map = {"hindi": "Hindi (Devanagari script)", "hinglish": "Hinglish (Roman Hindi)", "english": "English"}
    lang_instruction = lang_map.get(language, "Hinglish (Roman Hindi)")

    return f"""{history_section}USER CONSTRAINTS:
{constraints.model_dump_json(indent=2)}

REFERENCE JUGAAD CASES (adapt these, don't copy):
{cases_text}

LANGUAGE: Write all text values (title, summary, build_steps, expected_outcome, failure_modes, maintenance, skill_check) in {lang_instruction}. JSON keys must stay in English.

Generate a solution that fits EXACTLY within these constraints. JSON only."""


async def generate_solution_stream(
    constraints: Constraints,
    cases: list[dict],
    conversation_history: str = "",
    language: str = "hinglish",
) -> AsyncGenerator[str, None]:
    client = get_client()
    prompt = _build_user_prompt(constraints, cases, conversation_history, language)

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=GENERATE_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def generate_solution(constraints: Constraints, cases: list[dict], conversation_history: str = "", language: str = "hinglish") -> Solution:
    """Non-streaming version for internal use (validator retries)."""
    client = get_client()
    prompt = _build_user_prompt(constraints, cases, conversation_history, language)

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=GENERATE_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw)

    materials = [Material(**m) for m in data.get("materials", [])]
    return Solution(
        title=data.get("title", ""),
        summary=data.get("summary", ""),
        materials=materials,
        total_cost_inr=data.get("total_cost_inr", 0),
        build_steps=data.get("build_steps", []),
        expected_outcome=data.get("expected_outcome", ""),
        failure_modes=data.get("failure_modes", []),
        maintenance=data.get("maintenance", ""),
        skill_check=data.get("skill_check", ""),
    )
