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


async def extract_constraints(message: str, image_base64: str | None = None) -> Constraints:
    client = get_client()

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
            {"type": "text", "text": message},
        ]
    else:
        model = "claude-haiku-4-5-20251001"
        system = EXTRACT_SYSTEM
        content = message

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
    data = json.loads(raw)
    # Coerce null string fields to "" so Pydantic doesn't fail on one-word replies
    for field in ("problem_type", "specific_issue", "location_state", "season", "climate"):
        if data.get(field) is None:
            data[field] = ""
    if data.get("power_availability") is None:
        data["power_availability"] = "unknown"
    if data.get("skill_level") is None:
        data["skill_level"] = "basic"
    if data.get("available_materials") is None:
        data["available_materials"] = []
    if data.get("missing_constraints") is None:
        data["missing_constraints"] = []
    return Constraints(**data)
