"""
Constraint Extractor — Call 1 of 2 in the pipeline.
Uses Haiku (cheap, fast) to parse free-text into a structured Constraints object.
If the user includes an image, falls back to Sonnet for multimodal parsing.
"""

import json

from app.llm.anthropic_client import get_client
from app.schemas.solution import Constraints

EXTRACT_SYSTEM = """You are a constraint extraction engine for JugaadGPT, an AI that helps people in India solve problems with limited resources.

Your job: parse the user's message into a structured JSON object. Extract every constraint mentioned. If a constraint isn't mentioned, leave it as null or empty — do NOT guess or assume.

Respond ONLY with valid JSON matching this exact schema:
{
  "problem_type": "food_preservation | water | power | tools | health | agriculture | cooling | other",
  "specific_issue": "one-line description of the specific problem",
  "budget_inr": <number or null>,
  "power_availability": "none | intermittent | reliable | unknown",
  "available_materials": ["list of materials the user explicitly mentioned"],
  "location_state": "<Indian state name or empty string>",
  "season": "summer | winter | monsoon | unknown",
  "climate": "hot_arid | hot_humid | temperate | cold | unknown",
  "skill_level": "basic | moderate | skilled",
  "timeline_days": <number or null>,
  "daily_volume_kg": <number or null>,
  "missing_constraints": ["list of constraint names that are critical but missing from the message"]
}

ONLY these 3 are critical — add to missing_constraints ONLY if truly absent:
- budget_inr (always required — cannot generate without knowing budget)
- power_availability (required only if problem involves cooling, motors, or equipment)
- location_state OR climate (need at least one for material availability)

season, skill_level, daily_volume_kg are optional — NEVER add them to missing_constraints.
If season is unknown, default to "unknown". If skill_level is unknown, default to "basic"."""

EXTRACT_SYSTEM_VISION = EXTRACT_SYSTEM + """

The user has also provided an image. Identify any materials, tools, or environmental context visible in the image and add them to available_materials."""


async def extract_constraints(
    message: str,
    image_base64: str | None = None,
    history: str = "",
) -> Constraints:
    client = get_client()

    # Prepend conversation history so follow-up queries have full context
    full_message = f"{history}\n\nUser's latest message: {message}" if history else message

    if image_base64:
        model = "claude-sonnet-4-6"
        system = EXTRACT_SYSTEM_VISION
        content = [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_base64,
                },
            },
            {"type": "text", "text": full_message},
        ]
    else:
        model = "claude-haiku-4-5-20251001"
        system = EXTRACT_SYSTEM
        content = full_message

    response = await client.messages.create(
        model=model,
        max_tokens=512,
        system=system,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # LLM returned prose (common on vague follow-ups) — use safe defaults
        data = {}

    # Coerce null / missing fields so Pydantic never sees unexpected types
    for f in ("problem_type", "specific_issue", "location_state", "season", "climate"):
        if not data.get(f):
            data[f] = ""
    if not data.get("specific_issue"):
        data["specific_issue"] = message[:200]
    if data.get("power_availability") is None:
        data["power_availability"] = "unknown"
    if data.get("skill_level") is None:
        data["skill_level"] = "basic"
    if not isinstance(data.get("available_materials"), list):
        data["available_materials"] = []
    if not isinstance(data.get("missing_constraints"), list):
        data["missing_constraints"] = []
    return Constraints(**data)
