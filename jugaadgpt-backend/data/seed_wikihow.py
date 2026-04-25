"""
Seed the full WikiHow dataset (26,301 articles) into pgvector.

All records are included — no category filter. The RAG's cosine similarity
ranking handles relevance at query time.

Run:
    poetry run python data/seed_wikihow.py
    poetry run python data/seed_wikihow.py --limit 100   # quick test
    poetry run python data/seed_wikihow.py --dry-run     # stats only

Resumable: already-inserted records are skipped on re-run.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.models.jugaad_case import JugaadCase
from app.services.embeddings import embed_documents_batched

JSONL_PATH = Path(__file__).parent.parent / "wikihow_rag_dataset.jsonl"
BATCH_SIZE = 32


def to_jugaad_case(doc: dict) -> dict:
    categories = doc.get("categories", [])
    l1 = categories[0] if categories else ""
    l2 = categories[1] if len(categories) > 1 else ""
    content = doc.get("rag_content", "")
    title = doc.get("title", "")

    return {
        "id": f"wikihow-{doc['doc_id']}",
        "title": title,
        "problem_type": _infer_problem_type(l1, l2),
        "problem_description": content[:500],
        "solution_summary": content,
        "materials_json": "[]",
        "build_steps_json": "[]",
        "total_cost_inr": 0.0,
        "climate_tags": "",
        "region_tags": "",
        "power_required": _needs_power(content),
        "skill_level": _infer_skill(content),
        "source_url": doc.get("url", ""),
        "failure_modes": "",
    }


def _infer_problem_type(l1: str, l2: str) -> str:
    mapping = {
        "Gardening": "agriculture",
        "Home Maintenance": "tools",
        "DIY": "tools",
        "Heating and Cooling": "cooling",
        "Sustainable Living": "power",
        "Disaster Preparedness": "other",
        "Tools": "tools",
        "Yard and Outdoors": "agriculture",
        "Home Improvements": "tools",
        "Food Preparation": "food_preservation",
        "Herbs and Spices": "agriculture",
        "Recipes": "food_preservation",
        "Crafts": "tools",
        "Woodworking": "tools",
        "Cars & Other Vehicles": "tools",
        "Health": "health",
        "Computers and Electronics": "other",
        "Education and Communications": "other",
        "Finance and Business": "other",
        "Food and Entertaining": "food_preservation",
        "Hobbies and Crafts": "tools",
        "Pets and Animals": "agriculture",
        "Sports and Fitness": "other",
        "Travel": "other",
        "Relationships": "other",
    }
    return mapping.get(l2) or mapping.get(l1) or "other"


def _needs_power(content: str) -> bool:
    lower = content.lower()
    return any(w in lower for w in ("electric", "plug", "outlet", "battery", "motor", "power tool", "drill", "saw"))


def _infer_skill(content: str) -> str:
    lower = content.lower()
    if any(w in lower for w in ("weld", "solder", "lathe", "machining", "circuit board", "rewire")):
        return "skilled"
    if any(w in lower for w in ("drill", "tile", "plumb", "concrete", "mortar")):
        return "moderate"
    return "basic"


async def seed(limit: int | None = None, dry_run: bool = False):
    print(f"Loading {JSONL_PATH.name}...")

    records = []
    with open(JSONL_PATH, encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line.strip())
            if doc:
                records.append(doc)
            if limit and len(records) >= limit:
                break

    print(f"Total records: {len(records)}")

    if dry_run:
        from collections import Counter
        cats = Counter(
            f"{d['categories'][0]} > {d['categories'][1]}" if len(d.get("categories", [])) > 1
            else (d["categories"][0] if d.get("categories") else "uncategorised")
            for d in records
        )
        print("\nTop categories:")
        for cat, n in cats.most_common(25):
            print(f"  {n:5d}  {cat}")
        print("\n[dry-run] Done.")
        return

    cases = [to_jugaad_case(d) for d in records]

    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(text("SELECT id FROM jugaad_cases WHERE id LIKE 'wikihow-%'"))
        existing_ids = {row[0] for row in result.fetchall()}

    print(f"Already in DB: {len(existing_ids)}")
    pending = [c for c in cases if c["id"] not in existing_ids]
    print(f"To insert:     {len(pending)}")

    if not pending:
        print("Nothing to do.")
        await engine.dispose()
        return

    inserted = 0
    total = len(pending)

    for chunk_start in range(0, total, BATCH_SIZE):
        chunk = pending[chunk_start : chunk_start + BATCH_SIZE]
        texts = [f"{c['title']} {c['problem_description']}" for c in chunk]

        embeddings = await embed_documents_batched(texts, batch_size=BATCH_SIZE, inter_batch_delay=0)
        await asyncio.sleep(1.5)  # stay well under Voyage free-tier rate limit

        async with Session() as db:
            db.add_all([
                JugaadCase(
                    id=c["id"],
                    title=c["title"],
                    problem_type=c["problem_type"],
                    problem_description=c["problem_description"],
                    solution_summary=c["solution_summary"],
                    materials_json=c["materials_json"],
                    build_steps_json=c["build_steps_json"],
                    total_cost_inr=c["total_cost_inr"],
                    climate_tags=c["climate_tags"],
                    region_tags=c["region_tags"],
                    power_required=c["power_required"],
                    skill_level=c["skill_level"],
                    source_url=c["source_url"],
                    failure_modes=c["failure_modes"],
                    embedding=emb if isinstance(emb, list) else emb.tolist(),
                )
                for c, emb in zip(chunk, embeddings)
            ])
            await db.commit()

        inserted += len(chunk)
        pct = inserted / total * 100
        print(f"  [{pct:5.1f}%] {inserted}/{total}", flush=True)

    await engine.dispose()
    print(f"\nDone. Inserted {inserted} records.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(seed(limit=args.limit, dry_run=args.dry_run))
