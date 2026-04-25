from pydantic import BaseModel, Field


class Constraints(BaseModel):
    problem_type: str = ""
    specific_issue: str = ""
    budget_inr: float | None = None
    power_availability: str = "unknown"  # none | intermittent | reliable
    available_materials: list[str] = Field(default_factory=list)
    location_state: str = ""
    season: str = ""
    climate: str = ""
    skill_level: str = "basic"  # basic | moderate | skilled
    timeline_days: int | None = None
    daily_volume_kg: float | None = None
    missing_constraints: list[str] = Field(default_factory=list)


class Material(BaseModel):
    item: str
    quantity: str = ""
    cost_inr: float
    source: str  # hardware_store | kabadiwala | free | agriculture_shop | etc.


class Solution(BaseModel):
    title: str
    summary: str
    materials: list[Material]
    total_cost_inr: float
    build_steps: list[str]
    expected_outcome: str
    failure_modes: list[str]
    maintenance: str = ""
    skill_check: str = ""
    source_case_ids: list[str] = Field(default_factory=list)


class ValidationResult(BaseModel):
    passed: bool
    hard_failures: list[str] = Field(default_factory=list)
    soft_warnings: list[str] = Field(default_factory=list)
    retry_prompt_addition: str = ""
