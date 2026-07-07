"""
Daily generation quotas. Counters live in the KV layer (Redis in prod)
and expire at midnight UTC. Only actual generator runs count —
clarifying-question turns are free.

Anonymous users are tracked by BOTH device id and IP; the higher counter
wins, so clearing localStorage doesn't reset the meter.
"""

from dataclasses import dataclass

from app.auth import AuthUser
from app.config import settings
from app.services.kv import kv_get, kv_incr, seconds_until_midnight_utc


@dataclass
class QuotaStatus:
    used: int
    limit: int
    authenticated: bool

    @property
    def exceeded(self) -> bool:
        return self.used >= self.limit


async def _count(key: str) -> int:
    value = await kv_get(key)
    return int(value) if value else 0


def _anon_keys(device_id: str, ip: str) -> list[str]:
    keys = []
    if device_id:
        keys.append(f"quota:anon:{device_id}")
    if ip:
        keys.append(f"quota:anon:ip:{ip}")
    return keys or ["quota:anon:ip:unknown"]


async def get_quota_status(user: AuthUser | None, device_id: str, ip: str) -> QuotaStatus:
    if user is not None:
        used = await _count(f"quota:user:{user.id}")
        return QuotaStatus(used=used, limit=settings.auth_daily_quota, authenticated=True)
    counts = [await _count(k) for k in _anon_keys(device_id, ip)]
    return QuotaStatus(used=max(counts), limit=settings.free_daily_quota, authenticated=False)


async def increment_quota(user: AuthUser | None, device_id: str, ip: str) -> QuotaStatus:
    """Call ONLY when the generator actually runs."""
    ttl = seconds_until_midnight_utc()
    if user is not None:
        used = await kv_incr(f"quota:user:{user.id}", ttl_seconds=ttl)
        return QuotaStatus(used=used, limit=settings.auth_daily_quota, authenticated=True)
    counts = [await kv_incr(k, ttl_seconds=ttl) for k in _anon_keys(device_id, ip)]
    return QuotaStatus(used=max(counts), limit=settings.free_daily_quota, authenticated=False)


async def get_wa_quota_used(phone: str) -> int:
    return await _count(f"quota:wa:{phone}")


async def increment_wa_quota(phone: str) -> int:
    return await kv_incr(f"quota:wa:{phone}", ttl_seconds=seconds_until_midnight_utc())


def wa_quota_limit() -> int:
    return settings.wa_daily_quota
