import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _engine_kwargs(url: str) -> dict:
    """Supabase's transaction pooler (Supavisor, port 6543) breaks asyncpg's
    prepared-statement caching. When the host is a Supabase pooler, disable
    statement caches and give prepared statements unique names automatically."""
    if "pooler.supabase.com" not in url:
        return {}
    return {
        "connect_args": {
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
        },
        "pool_pre_ping": True,
    }


engine = create_async_engine(settings.database_url, echo=False, **_engine_kwargs(settings.database_url))
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
