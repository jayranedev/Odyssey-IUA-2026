"""
RAG Retriever — fetches the top-k most relevant jugaad cases via pgvector.
Uses Voyage AI for query embedding (matches how documents were indexed).
Falls back to hero_cases.json when DB is empty (dev mode / before seeding).
"""

import json
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.jugaad_case import JugaadCase
from app.schemas.solution import Constraints
from app.services.embeddings import embed_query

HERO_CASES_PATH = Path(__file__).parent.parent.parent / "data" / "hero_cases.json"


def _constraints_to_query(constraints: Constraints) -> str:
    parts = [constraints.specific_issue or constraints.problem_type]
    if constraints.location_state:
        parts.append(f"in {constraints.location_state}")
    if constraints.power_availability == "none":
        parts.append("no electricity no power")
    if constraints.budget_inr:
        parts.append(f"budget {constraints.budget_inr} rupees low cost")
    if constraints.climate:
        parts.append(constraints.climate)
    if constraints.available_materials:
        parts.append(" ".join(constraints.available_materials[:5]))
    return " ".join(filter(None, parts))


async def retrieve_cases(constraints: Constraints, db: AsyncSession, top_k: int = 5) -> list[dict]:
    # Check if DB has any data
    count_result = await db.execute(select(JugaadCase).limit(1))
    has_data = count_result.scalar_one_or_none() is not None

    if not has_data:
        return _load_hero_cases(constraints, top_k)

    query_text = _constraints_to_query(constraints)
    query_embedding = await embed_query(query_text)

    # asyncpg doesn't support :param::vector casting — embed the vector literal directly.
    # query_embedding comes from Voyage (trusted float list), not user input.
    vec_literal = "[" + ",".join(str(x) for x in query_embedding) + "]"
    result = await db.execute(
        text(f"""
            SELECT id, title, problem_description, solution_summary,
                   materials_json, build_steps_json, total_cost_inr,
                   failure_modes, climate_tags, power_required,
                   1 - (embedding <=> '{vec_literal}'::vector) AS similarity
            FROM jugaad_cases
            ORDER BY embedding <=> '{vec_literal}'::vector
            LIMIT :k
        """),
        {"k": top_k},
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


def _load_hero_cases(constraints: Constraints, top_k: int) -> list[dict]:
    if not HERO_CASES_PATH.exists():
        return []
    with open(HERO_CASES_PATH) as f:
        cases = json.load(f)
    if constraints.power_availability == "none":
        cases = [c for c in cases if not c.get("power_required", False)] + [
            c for c in cases if c.get("power_required", False)
        ]
    return cases[:top_k]
