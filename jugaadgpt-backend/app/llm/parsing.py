"""
Tolerant JSON extraction for open-model output.
Llama/DeepSeek are chattier than Claude: they add markdown fences, prose
preambles, and trailing commentary. Strip all of it and parse the JSON body.
"""

import json


def strip_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        # drop the first fence line (``` or ```json) and any closing fence
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


def extract_json_object(raw: str) -> dict | None:
    """Parse the first {...} object out of arbitrary model output."""
    raw = strip_fences(raw)
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        pass
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(raw[start : end + 1])
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def extract_json_array(raw: str) -> list | None:
    """Parse the first [...] array out of arbitrary model output."""
    raw = strip_fences(raw)
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        pass
    start = raw.find("[")
    end = raw.rfind("]")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(raw[start : end + 1])
        return data if isinstance(data, list) else None
    except json.JSONDecodeError:
        return None
