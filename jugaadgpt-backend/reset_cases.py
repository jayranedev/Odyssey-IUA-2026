"""One-time: truncate jugaad_cases to clear stale Voyage embeddings before re-seeding."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings


async def main():
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        r = await conn.execute(text("SELECT COUNT(*) FROM jugaad_cases"))
        print(f"Before: {r.scalar()} records")
        await conn.execute(text("TRUNCATE TABLE jugaad_cases"))
        r = await conn.execute(text("SELECT COUNT(*) FROM jugaad_cases"))
        print(f"After:  {r.scalar()} records")
    await engine.dispose()
    print("Done — table is empty. Run seed_cases.py then seed_wikihow.py.")


if __name__ == "__main__":
    asyncio.run(main())
