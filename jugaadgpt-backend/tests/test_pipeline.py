"""
Smoke tests for the pipeline components.
Run with: pytest tests/ -v
"""

import pytest

from app.pipeline.validator import validate
from app.schemas.solution import Constraints, Material, Solution


def make_solution(**overrides) -> Solution:
    defaults = dict(
        title="Test Cooler",
        summary="A clay pot cooler",
        materials=[Material(item="Clay pot", quantity="2", cost_inr=200, source="pottery_market")],
        total_cost_inr=200,
        build_steps=["Step 1", "Step 2"],
        expected_outcome="Cools by 10C",
        failure_modes=["If humidity is high, won't work"],
    )
    defaults.update(overrides)
    return Solution(**defaults)


def make_constraints(**overrides) -> Constraints:
    defaults = dict(
        problem_type="food_preservation",
        specific_issue="vegetables spoiling",
        budget_inr=500,
        power_availability="none",
        location_state="Rajasthan",
        season="summer",
        climate="hot_arid",
        skill_level="basic",
    )
    defaults.update(overrides)
    return Constraints(**defaults)


class TestValidator:
    def test_passes_valid_solution(self):
        result = validate(make_solution(), make_constraints())
        assert result.passed

    def test_fails_over_budget(self):
        solution = make_solution(total_cost_inr=600)
        constraints = make_constraints(budget_inr=500)
        result = validate(solution, constraints)
        assert not result.passed
        assert any("budget" in f.lower() for f in result.hard_failures)

    def test_fails_power_tools_when_no_power(self):
        solution = make_solution(
            build_steps=["Connect to electric motor", "Run drill"],
            summary="Requires electric drill and motor",
        )
        constraints = make_constraints(power_availability="none")
        result = validate(solution, constraints)
        assert not result.passed
        assert any("electric" in f.lower() or "motor" in f.lower() for f in result.hard_failures)

    def test_passes_with_no_power_constraint_and_no_power(self):
        solution = make_solution(
            build_steps=["Place pot in shade", "Add water"],
            summary="No electricity needed",
        )
        constraints = make_constraints(power_availability="none")
        result = validate(solution, constraints)
        assert result.passed

    def test_fails_monsoon_incompatible(self):
        solution = make_solution(
            title="Zeer pot cooler",
            summary="evaporative clay pot cooler",
        )
        constraints = make_constraints(season="monsoon")
        result = validate(solution, constraints)
        assert not result.passed

    def test_warns_too_many_steps_for_one_day(self):
        solution = make_solution(
            build_steps=[f"Step {i}" for i in range(8)],
            failure_modes=["If it fails, try again"],
        )
        constraints = make_constraints(timeline_days=1)
        result = validate(solution, constraints)
        assert result.passed  # soft warning, not a hard failure
        assert any("day" in w.lower() or "step" in w.lower() for w in result.soft_warnings)

    def test_warns_no_failure_modes(self):
        solution = make_solution(failure_modes=[])
        result = validate(solution, make_constraints())
        assert result.passed
        assert any("failure" in w.lower() for w in result.soft_warnings)

    def test_retry_prompt_appended_on_failure(self):
        solution = make_solution(total_cost_inr=1000)
        constraints = make_constraints(budget_inr=500)
        result = validate(solution, constraints)
        assert result.retry_prompt_addition != ""
        assert "FAILED VALIDATION" in result.retry_prompt_addition
