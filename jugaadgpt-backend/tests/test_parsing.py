"""Tolerant JSON parsing — open models wrap JSON in fences and prose."""

from app.llm.parsing import extract_json_array, extract_json_object


def test_plain_json():
    assert extract_json_object('{"a": 1}') == {"a": 1}


def test_markdown_fences():
    assert extract_json_object('```json\n{"a": 1}\n```') == {"a": 1}
    assert extract_json_object('```\n{"a": 1}\n```') == {"a": 1}


def test_prose_preamble_and_trailer():
    raw = 'Sure! Here is the JSON you asked for:\n{"budget_inr": 500, "ok": true}\nLet me know if you need anything else.'
    assert extract_json_object(raw) == {"budget_inr": 500, "ok": True}


def test_garbage_returns_none():
    assert extract_json_object("I cannot help with that.") is None
    assert extract_json_object("") is None


def test_array_extraction():
    assert extract_json_array('["a", "b"]') == ["a", "b"]
    assert extract_json_array('Items I see:\n["rod", "pipe"]\nHope that helps!') == ["rod", "pipe"]
    assert extract_json_array("no array here") is None


def test_nested_object_with_prose():
    raw = 'The solution: {"materials": [{"item": "pot", "cost_inr": 80}], "total_cost_inr": 80} — done!'
    parsed = extract_json_object(raw)
    assert parsed["total_cost_inr"] == 80
    assert parsed["materials"][0]["item"] == "pot"
