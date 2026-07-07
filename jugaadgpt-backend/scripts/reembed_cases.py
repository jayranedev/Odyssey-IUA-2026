"""
Re-embed every row in jugaad_cases with the current EMBEDDING_MODEL.

Run after migration 007 (which changes the pgvector column dimension):
  poetry run python scripts/reembed_cases.py

If the table is empty, seeds it from data/hero_cases.json first
(same fallback path the retriever uses).
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402

from app.config import settings  # noqa: E402
from app.models.jugaad_case import JugaadCase  # noqa: E402
from app.services.embeddings import embed_documents_batched  # noqa: E402

HERO_CASES_PATH = Path(__file__).parent.parent / "data" / "hero_cases.json"


def build_embedding_text(case: dict) -> str:
    """Same text recipe as data/seed_cases.py — keep in sync."""
    return " ".join(filter(None, [
        case.get("title", ""),
        case.get("problem_description", ""),
        case.get("solution_summary", ""),
        (case.get("climate_tags") or "").replace(",", " "),
        (case.get("region_tags") or "").replace(",", " "),
        "no electricity" if not case.get("power_required") else "",
    ]))


async def seed_hero_cases(db) -> int:
    if not HERO_CASES_PATH.exists():
        return 0
    with open(HERO_CASES_PATH, encoding="utf-8") as f:
        cases = json.load(f)
    for case in cases:
        db.add(JugaadCase(
            id=case.get("id") or str(uuid.uuid4()),
            title=case["title"],
            problem_type=case.get("problem_type", "other"),
            problem_description=case["problem_description"],
            solution_summary=case["solution_summary"],
            materials_json=json.dumps(case.get("materials_json", [])) if isinstance(case.get("materials_json"), list) else case.get("materials_json", "[]"),
            build_steps_json=json.dumps(case.get("build_steps_json", [])) if isinstance(case.get("build_steps_json"), list) else case.get("build_steps_json", "[]"),
            total_cost_inr=case.get("total_cost_inr", 0),
            climate_tags=case.get("climate_tags", ""),
            region_tags=case.get("region_tags", ""),
            power_required=case.get("power_required", False),
            skill_level=case.get("skill_level", "basic"),
            source_url=case.get("source_url", ""),
            failure_modes=case.get("failure_modes", ""),
            embedding=None,
        ))
    await db.commit()
    return len(cases)


async def main():
    print(f"Embedding model: {settings.embedding_model} (dim {settings.embedding_dim})")
    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(select(JugaadCase))
        rows = list(result.scalars().all())

        if not rows:
            print("jugaad_cases is empty — seeding from data/hero_cases.json")
            seeded = await seed_hero_cases(db)
            print(f"Seeded {seeded} hero cases")
            result = await db.execute(select(JugaadCase))
            rows = list(result.scalars().all())

        if not rows:
            print("Nothing to embed. Done.")
            await engine.dispose()
            return

        print(f"Re-embedding {len(rows)} cases...")
        texts = [
            build_embedding_text({
                "title": r.title,
                "problem_description": r.problem_description,
                "solution_summary": r.solution_summary,
                "climate_tags": r.climate_tags,
                "region_tags": r.region_tags,
                "power_required": r.power_required,
            })
            for r in rows
        ]
        embeddings = await embed_documents_batched(texts)

        for row, embedding in zip(rows, embeddings):
            row.embedding = embedding

        await db.commit()
        print(f"Done. Re-embedded {len(rows)} cases with {settings.embedding_model}.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
