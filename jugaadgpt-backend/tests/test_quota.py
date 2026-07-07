"""Quota service tests — anon device+IP counters, user counters, WhatsApp."""

import pytest

from app.auth import AuthUser
from app.config import settings
from app.services import kv
from app.services.quota import (
    get_quota_status,
    get_wa_quota_used,
    increment_quota,
    increment_wa_quota,
)


@pytest.fixture(autouse=True)
def clean_kv():
    kv._reset_memory_for_tests()
    yield
    kv._reset_memory_for_tests()


async def test_anon_starts_at_zero():
    status = await get_quota_status(None, "dev-1", "1.2.3.4")
    assert status.used == 0
    assert status.limit == settings.free_daily_quota
    assert not status.authenticated
    assert not status.exceeded


async def test_anon_increment_counts_both_keys():
    await increment_quota(None, "dev-1", "1.2.3.4")
    await increment_quota(None, "dev-1", "1.2.3.4")
    status = await get_quota_status(None, "dev-1", "1.2.3.4")
    assert status.used == 2
    # same IP, different device — IP counter wins (higher counter rule)
    status2 = await get_quota_status(None, "dev-OTHER", "1.2.3.4")
    assert status2.used == 2


async def test_anon_exceeds_at_limit():
    for _ in range(settings.free_daily_quota):
        await increment_quota(None, "dev-1", "1.2.3.4")
    status = await get_quota_status(None, "dev-1", "1.2.3.4")
    assert status.exceeded


async def test_user_counter_independent_of_anon():
    user = AuthUser(id="user-123", email="a@b.c")
    for _ in range(3):
        await increment_quota(user, "dev-1", "1.2.3.4")
    status = await get_quota_status(user, "dev-1", "1.2.3.4")
    assert status.used == 3
    assert status.limit == settings.auth_daily_quota
    assert status.authenticated
    # anon view of the same device/IP is untouched
    anon = await get_quota_status(None, "dev-1", "1.2.3.4")
    assert anon.used == 0


async def test_wa_quota_per_phone():
    assert await get_wa_quota_used("919999999999") == 0
    await increment_wa_quota("919999999999")
    await increment_wa_quota("919999999999")
    assert await get_wa_quota_used("919999999999") == 2
    assert await get_wa_quota_used("918888888888") == 0
