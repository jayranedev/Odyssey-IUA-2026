"""
Seed NIF agriculture innovations into pgvector-backed `jugaad_cases`.

Uses local fastembed embeddings from `app.services.embeddings`, which prefers
CUDA when available.

Run:
    poetry run python data/seed_nif_agriculture.py
    poetry run python data/seed_nif_agriculture.py --limit 100
    poetry run python data/seed_nif_agriculture.py --dry-run

Strict GPU run:
    poetry run python data/seed_nif_agriculture.py --require-gpu

Resumable: existing IDs are skipped.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

import onnxruntime as ort
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.models.jugaad_case import JugaadCase
from app.services.embeddings import embed_documents_batched

JSON_PATH = Path(__file__).parent.parent / "nif_agriculture_data_final.json"
BATCH_SIZE = 128


def _has_cuda_provider() -> bool:
    return "CUDAExecutionProvider" in set(ort.get_available_providers())


def _infer_problem_type(title: str, keywords: list[str], description: str) -> str:
    haystack = " ".join([title, " ".join(keywords), description]).lower()

    if any(k in haystack for k in ("irrigation", "water", "pump", "sprayer", "drip")):
        return "agriculture"
    if any(k in haystack for k in ("dryer", "processing", "storage", "preservation")):
        return "food_preservation"
    if any(k in haystack for k in ("power", "solar", "electric", "battery", "wind")):
        return "power"
    if any(k in haystack for k in ("cool", "cooling", "cold")):
        return "cooling"
    if any(k in haystack for k in ("health", "medical", "sanitation", "toilet")):
        return "health"
    if any(k in haystack for k in ("tool", "machine", "weeder", "cutter", "tractor", "knife")):
        return "tools"
    return "other"


def _needs_power(text: str) -> bool:
    lower = text.lower()
    return any(w in lower for w in ("electric", "battery", "motor", "solar", "diesel", "petrol", "engine"))


def _infer_skill(text: str) -> str:
    lower = text.lower()
    if any(w in lower for w in ("weld", "machining", "circuit", "fabrication", "lathe", "gearbox")):
        return "skilled"
    if any(w in lower for w in ("drill", "pipe", "concrete", "assembly", "shaft")):
        return "moderate"
    return "basic"


def _clean_keywords(raw: object) -> list[str]:
    if not isinstance(raw, list):
        return []
    return [str(k).strip() for k in raw if isinstance(k, str) and k.strip()]


def to_jugaad_case(doc: dict) -> dict | None:
    if not isinstance(doc, dict):
        return None

    raw_id = doc.get("id")
    title = str(doc.get("title", "")).strip()
    if raw_id is None or not title:
        return None

    details = doc.get("details") if isinstance(doc.get("details"), dict) else {}
    description = str(details.get("full_description", "")).strip()
    keywords = _clean_keywords(doc.get("keywords"))
    source_url = str(doc.get("url", "")).strip()

    embedding_text = " ".join(part for part in [title, " ".join(keywords), description] if part)

    return {
        "id": f"nif-{raw_id}",
        "title": title,
        "problem_type": _infer_problem_type(title, keywords, description),
        "problem_description": description[:500] if description else title,
        "solution_summary": description or title,
        "materials_json": "[]",
        "build_steps_json": "[]",
        "total_cost_inr": 0.0,
        "climate_tags": "",
        "region_tags": "",
        "power_required": _needs_power(embedding_text),
        "skill_level": _infer_skill(embedding_text),
        "source_url": source_url,
        "failure_modes": "",
        "_embedding_text": embedding_text,
    }


async def seed(limit: int | None = None, dry_run: bool = False, require_gpu: bool = False):
    if require_gpu and not _has_cuda_provider():
        raise RuntimeError(
            "CUDAExecutionProvider is unavailable. Install/activate onnxruntime-gpu and CUDA/cuDNN first."
        )

    print(f"Loading {JSON_PATH.name}...")

    with open(JSON_PATH, encoding="utf-8") as f:
        payload = json.load(f)

    docs = [d for d in payload if isinstance(d, dict)]
    if limit:
        docs = docs[:limit]

    cases = [c for c in (to_jugaad_case(d) for d in docs) if c is not None]
    print(f"Total valid records: {len(cases)}")

    if dry_run:
        print("[dry-run] Done.")
        return

    engine = create_async_engine(settings.database_url)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(text("SELECT id FROM jugaad_cases WHERE id LIKE 'nif-%'"))
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
        texts = [c["_embedding_text"] for c in chunk]

        embeddings = await embed_documents_batched(texts, batch_size=64, inter_batch_delay=0)

        rows = [
            {
                "id": c["id"],
                "title": c["title"],
                "problem_type": c["problem_type"],
                "problem_description": c["problem_description"],
                "solution_summary": c["solution_summary"],
                "materials_json": c["materials_json"],
                "build_steps_json": c["build_steps_json"],
                "total_cost_inr": c["total_cost_inr"],
                "climate_tags": c["climate_tags"],
                "region_tags": c["region_tags"],
                "power_required": c["power_required"],
                "skill_level": c["skill_level"],
                "source_url": c["source_url"],
                "failure_modes": c["failure_modes"],
                "embedding": emb if isinstance(emb, list) else emb.tolist(),
            }
            for c, emb in zip(chunk, embeddings)
        ]

        async with Session() as db:
            stmt = pg_insert(JugaadCase).values(rows).on_conflict_do_nothing(index_elements=["id"])
            result = await db.execute(stmt)
            await db.commit()
            inserted += result.rowcount

        done = chunk_start + len(chunk)
        pct = done / total * 100
        print(f"  [{pct:5.1f}%] {done}/{total} (inserted={inserted})", flush=True)

    await engine.dispose()
    print(f"\nDone. Inserted {inserted} records.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--require-gpu", action="store_true")
    args = parser.parse_args()
    asyncio.run(seed(limit=args.limit, dry_run=args.dry_run, require_gpu=args.require_gpu))
