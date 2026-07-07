"""
Auth + quota + session-scoping API tests.
Uses in-memory SQLite (no pgvector tables touched) and the in-memory KV.
"""

import time

import pytest
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings
from app.db import Base, get_db
from app.main import app
from app.models.blueprint import Blueprint  # noqa: F401 — table needed for delete cascade
from app.models.blueprint_image import BlueprintImage  # noqa: F401
from app.models.chat_message import ChatMessage  # noqa: F401
from app.models.chat_session import ChatSession  # noqa: F401 — registers the table
from app.models.user import User
from app.services import kv

TEST_SECRET = "test-supabase-jwt-secret"

SQLITE_TABLES = [
    Base.metadata.tables["users"],
    Base.metadata.tables["chat_sessions"],
    Base.metadata.tables["chat_messages"],
    Base.metadata.tables["blueprints"],
    Base.metadata.tables["blueprint_images"],
]


def make_token(sub: str = "user-1", email: str = "u@example.com") -> str:
    return jwt.encode(
        {"sub": sub, "email": email, "aud": "authenticated", "exp": int(time.time()) + 3600},
        TEST_SECRET,
        algorithm="HS256",
    )


@pytest.fixture
async def client(monkeypatch):
    kv._reset_memory_for_tests()
    monkeypatch.setattr(settings, "supabase_jwt_secret", TEST_SECRET)

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: Base.metadata.create_all(c, tables=SQLITE_TABLES))
    TestSession = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        c.test_sessionmaker = TestSession
        yield c
    app.dependency_overrides.clear()
    kv._reset_memory_for_tests()
    await engine.dispose()


async def test_anon_under_quota_gets_quota_event(client, monkeypatch):
    """Anonymous user below the limit: stream starts with the quota event."""
    monkeypatch.setattr(settings, "free_daily_quota", 5)

    # Make the pipeline stop right after the quota gate (no LLM in tests)
    async def boom(*a, **k):
        raise RuntimeError("stop-here")
    monkeypatch.setattr("app.api.query.extract_constraints", boom)

    resp = await client.post(
        "/api/query",
        json={"session_id": "s1", "message": "vegetables rotting"},
        headers={"X-Device-Id": "device-A"},
    )
    assert resp.status_code == 200
    body = resp.text
    assert "event: quota" in body
    assert '"used": 0' in body
    assert '"limit": 5' in body
    assert "login_required" not in body


async def test_sixth_request_returns_login_required(client, monkeypatch):
    monkeypatch.setattr(settings, "free_daily_quota", 5)
    from app.services.quota import increment_quota
    for _ in range(5):
        await increment_quota(None, "device-B", "9.9.9.9")

    resp = await client.post(
        "/api/query",
        json={"session_id": "s1", "message": "help"},
        headers={"X-Device-Id": "device-B", "X-Forwarded-For": "9.9.9.9"},
    )
    assert resp.status_code == 200
    assert "event: login_required" in resp.text


async def test_authed_over_quota_returns_quota_exhausted(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_daily_quota", 2)
    from app.auth import AuthUser
    from app.services.quota import increment_quota
    await increment_quota(AuthUser("user-1", "u@example.com"), "", "")
    await increment_quota(AuthUser("user-1", "u@example.com"), "", "")

    resp = await client.post(
        "/api/query",
        json={"session_id": "s1", "message": "help"},
        headers={"Authorization": f"Bearer {make_token('user-1')}"},
    )
    assert resp.status_code == 200
    assert "event: quota_exhausted" in resp.text
    assert '"authenticated": true' in resp.text


async def test_sessions_scoped_per_device_and_user(client):
    # anon device-A creates a session
    r = await client.post("/api/sessions", json={"id": "sess-A", "title": "A chat"},
                          headers={"X-Device-Id": "device-A"})
    assert r.status_code == 200

    # device-A sees it; device-B doesn't
    r = await client.get("/api/sessions", headers={"X-Device-Id": "device-A"})
    assert [s["id"] for s in r.json()] == ["sess-A"]
    r = await client.get("/api/sessions", headers={"X-Device-Id": "device-B"})
    assert r.json() == []

    # authed user creates their own session; list is scoped to the user
    token = make_token("user-7", "seven@example.com")
    await client.post("/api/sessions", json={"id": "sess-U", "title": "U chat"},
                      headers={"Authorization": f"Bearer {token}"})
    r = await client.get("/api/sessions", headers={"Authorization": f"Bearer {token}"})
    assert [s["id"] for s in r.json()] == ["sess-U"]

    # device-B cannot read device-A's session
    r = await client.get("/api/sessions/sess-A", headers={"X-Device-Id": "device-B"})
    assert r.status_code == 403


async def test_claim_reassigns_device_sessions(client):
    # two anonymous sessions on device-C
    for sid in ("c1", "c2"):
        await client.post("/api/sessions", json={"id": sid, "title": sid},
                          headers={"X-Device-Id": "device-C"})

    token = make_token("user-9", "nine@example.com")
    # user row must exist for the FK — the upsert normally does this; do it directly
    async with client.test_sessionmaker() as db:
        db.add(User(id="user-9", email="nine@example.com"))
        await db.commit()

    r = await client.post("/api/sessions/claim", json={"device_id": "device-C"},
                          headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["claimed"] == 2

    # sessions now belong to the user
    r = await client.get("/api/sessions", headers={"Authorization": f"Bearer {token}"})
    assert sorted(s["id"] for s in r.json()) == ["c1", "c2"]
    # and are no longer visible anonymously
    r = await client.get("/api/sessions", headers={"X-Device-Id": "device-C"})
    assert r.json() == []


async def test_claim_requires_auth(client):
    r = await client.post("/api/sessions/claim", json={"device_id": "device-X"})
    assert r.status_code == 401
