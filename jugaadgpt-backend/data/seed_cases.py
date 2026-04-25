"""
Seed script — embeds all cases from hero_cases.json and loads them into pgvector.
Run with: poetry run python data/seed_cases.py

Also accepts a JSONL file of scraped cases:
  poetry run python data/seed_cases.py --file data/scraped_cases.jsonl
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models.jugaad_case import JugaadCase
from app.services.embeddings import embed_documents_batched


def build_embedding_text(case: dict) -> str:
    return " ".join(filter(None, [
        case.get("title", ""),
        case.get("problem_description", ""),
        case.get("solution_summary", ""),
        case.get("climate_tags", "").replace(",", " "),
        case.get("region_tags", "").replace(",", " "),
        "no electricity" if not case.get("power_required") else "",
    ]))


async def seed(file_path: str | None = None):
    if file_path:
        with open(file_path) as f:
            if file_path.endswith(".jsonl"):
                cases = [json.loads(line) for line in f if line.strip()]
            else:
                cases = json.load(f)
    else:
        hero_path = Path(__file__).parent / "hero_cases.json"
        with open(hero_path) as f:
            cases = json.load(f)

    print(f"Embedding {len(cases)} cases with Voyage AI...")
    texts = [build_embedding_text(c) for c in cases]
    embeddings = await embed_documents_batched(texts)

    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        inserted = 0
        skipped = 0
        for case, embedding in zip(cases, embeddings):
            case_id = case.get("id") or str(uuid.uuid4())
            existing = await db.execute(select(JugaadCase).where(JugaadCase.id == case_id))
            if existing.scalar_one_or_none():
                skipped += 1
                continue

            db.add(JugaadCase(
                id=case_id,
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
                embedding=embedding if isinstance(embedding, list) else embedding.tolist(),
            ))
            inserted += 1

        await db.commit()
        print(f"Done. Inserted: {inserted}, Skipped (already exists): {skipped}")

    await engine.dispose()


if __name__ == "__main__":
    file_arg = None
    if len(sys.argv) > 2 and sys.argv[1] == "--file":
        file_arg = sys.argv[2]
    asyncio.run(seed(file_arg))
