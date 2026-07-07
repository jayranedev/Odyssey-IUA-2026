"""
Tiny async key-value layer for quota counters and provider-exhaustion flags.

Uses Redis when REDIS_URL is set; otherwise falls back to an in-process dict
with TTL semantics (fine for dev and unit tests, NOT for multi-worker prod).
"""

import asyncio
import time
from datetime import datetime, timedelta, timezone

from app.config import settings

_redis = None
_memory: dict[str, tuple[str, float | None]] = {}  # key → (value, expires_at_epoch | None)
_lock = asyncio.Lock()


def seconds_until_midnight_utc() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int((tomorrow - now).total_seconds()), 60)


def _get_redis():
    global _redis
    if _redis is None and settings.redis_url:
        import redis.asyncio as aioredis

        # rediss:// (Upstash and other TLS endpoints) is handled natively by
        # redis-py's from_url — it selects an SSL connection class automatically.
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis


def _mem_get(key: str) -> str | None:
    entry = _memory.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if expires_at is not None and time.time() > expires_at:
        _memory.pop(key, None)
        return None
    return value


async def kv_get(key: str) -> str | None:
    r = _get_redis()
    if r is not None:
        return await r.get(key)
    return _mem_get(key)


async def kv_set(key: str, value: str, ttl_seconds: int | None = None) -> None:
    r = _get_redis()
    if r is not None:
        await r.set(key, value, ex=ttl_seconds)
        return
    _memory[key] = (value, time.time() + ttl_seconds if ttl_seconds else None)


async def kv_incr(key: str, ttl_seconds: int | None = None) -> int:
    """Increment a counter; TTL is applied only when the key is created."""
    r = _get_redis()
    if r is not None:
        value = await r.incr(key)
        if value == 1 and ttl_seconds:
            await r.expire(key, ttl_seconds)
        return int(value)
    async with _lock:
        current = _mem_get(key)
        if current is None:
            _memory[key] = ("1", time.time() + ttl_seconds if ttl_seconds else None)
            return 1
        new = int(current) + 1
        _memory[key] = (str(new), _memory[key][1])
        return new


async def kv_exists(key: str) -> bool:
    return await kv_get(key) is not None


async def kv_delete(key: str) -> None:
    r = _get_redis()
    if r is not None:
        await r.delete(key)
        return
    _memory.pop(key, None)


def _reset_memory_for_tests() -> None:
    _memory.clear()
