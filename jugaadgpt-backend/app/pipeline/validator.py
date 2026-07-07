"""
Deterministic Validator — no LLM involved.
This is the moat: rules that the generator cannot violate.
Hard failures trigger a regeneration. Soft warnings are passed through.
"""

import re

from app.schemas.solution import Constraints, Solution, ValidationResult

POWER_TOOLS = {
    "drill", "grinder", "welder", "electric", "motor", "pump", "battery",
    "inverter", "generator", "fan", "blower", "charger", "voltage",
}

HIGH_SKILL_TERMS = {"welding", "soldering", "machining", "lathe", "circuit"}

# Negation window: a flagged term preceded within ~3 tokens by one of these is
# describing the ABSENCE of the thing ("no electricity needed", "bina motor ke")
# and must not trip the rule.
_NEGATORS = {"no", "not", "without", "bina", "nahi", "nahin", "zero"}
_NEGATION_WINDOW = 3


def _find_flagged_terms(terms: set[str], text: str) -> list[str]:
    """Word-boundary term matching with a negation window.

    A term matches a token exactly, or as a prefix of a longer word when the
    term is ≥4 chars ("electric" → "electricity"; but "fan" never matches
    "fantastic"). Matches preceded within _NEGATION_WINDOW tokens by a negator
    are skipped.
    """
    tokens = re.findall(r"[a-z]+", text.lower())
    found: set[str] = set()
    for i, tok in enumerate(tokens):
        for term in terms:
            if tok == term or (len(term) >= 4 and tok.startswith(term)):
                window = tokens[max(0, i - _NEGATION_WINDOW):i]
                if not (_NEGATORS & set(window)):
                    found.add(term)
    return sorted(found)

MONSOON_INCOMPATIBLE = {
    "solar dryer", "sun drying", "evaporative", "zeer pot", "clay pot cooler",
}

ARID_INCOMPATIBLE = {
    "rain harvesting as primary source",
}


def validate(solution: Solution, constraints: Constraints) -> ValidationResult:
    hard_failures: list[str] = []
    soft_warnings: list[str] = []

    # Hard rule 1: Budget
    if constraints.budget_inr is not None:
        if solution.total_cost_inr > constraints.budget_inr * 1.05:  # 5% tolerance
            hard_failures.append(
                f"Solution costs ₹{solution.total_cost_inr:.0f} but budget is ₹{constraints.budget_inr:.0f}. "
                f"Reduce cost by ₹{solution.total_cost_inr - constraints.budget_inr:.0f}."
            )

    # Hard rule 2: No power
    if constraints.power_availability == "none":
        combined_text = " ".join([
            " ".join(solution.build_steps),
            solution.summary,
            " ".join(m.item for m in solution.materials),
        ])
        found_power_tools = _find_flagged_terms(POWER_TOOLS, combined_text)
        if found_power_tools:
            hard_failures.append(
                f"Solution references power-dependent items ({', '.join(found_power_tools)}) "
                f"but user has no electricity. Use only hand tools and gravity."
            )

    # Hard rule 3: Skill level
    if constraints.skill_level == "basic":
        steps_text = " ".join(solution.build_steps)
        found_high_skill = _find_flagged_terms(HIGH_SKILL_TERMS, steps_text)
        if found_high_skill:
            hard_failures.append(
                f"Solution requires advanced skills ({', '.join(found_high_skill)}) "
                f"but user skill level is basic. Simplify or note where a helper is needed."
            )

    # Hard rule 4: Monsoon incompatibility
    if constraints.season == "monsoon":
        solution_lower = solution.title.lower() + solution.summary.lower()
        for incompatible in MONSOON_INCOMPATIBLE:
            if incompatible in solution_lower:
                hard_failures.append(
                    f"'{incompatible}' doesn't work in monsoon due to high humidity. "
                    f"Switch to a non-evaporative cooling or covered drying method."
                )

    # Soft warning 1: Timeline
    if constraints.timeline_days is not None and constraints.timeline_days <= 1:
        steps_count = len(solution.build_steps)
        if steps_count > 6:
            soft_warnings.append(
                f"Solution has {steps_count} steps but user needs it done in 1 day. "
                f"Consider simplifying or batching steps."
            )

    # Soft warning 2: BOM item count
    if len(solution.materials) > 10:
        soft_warnings.append(
            "Solution has many materials — consider if any can be combined or eliminated."
        )

    # Soft warning 3: No failure modes provided
    if not solution.failure_modes:
        soft_warnings.append("Add at least one failure mode so the user knows what to do if it doesn't work.")

    passed = len(hard_failures) == 0

    retry_prompt = ""
    if hard_failures:
        retry_prompt = "\n\nPREVIOUS ATTEMPT FAILED VALIDATION. Fix these issues:\n" + "\n".join(
            f"- {f}" for f in hard_failures
        )

    return ValidationResult(
        passed=passed,
        hard_failures=hard_failures,
        soft_warnings=soft_warnings,
        retry_prompt_addition=retry_prompt,
    )
