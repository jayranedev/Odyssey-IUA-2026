"""
Router unit tests — mocked 429s prove the fallback chain advances and
exhaustion flags are set with the right TTLs. No network, no Redis
(the KV layer falls back to in-memory).
"""

import httpx
import pytest
from openai import APIStatusError

from app.llm import router
from app.llm.router import AllProvidersExhausted
from app.services import kv


@pytest.fixture(autouse=True)
def clean_state(monkeypatch):
    kv._reset_memory_for_tests()
    router._clients.clear()
    # All three providers "configured"
    monkeypatch.setattr(router.settings, "groq_api_key", "gk")
    monkeypatch.setattr(router.settings, "gemini_api_key", "gmk")
    monkeypatch.setattr(router.settings, "openrouter_api_key", "ork")
    yield
    kv._reset_memory_for_tests()
    router._clients.clear()


def _status_error(status: int, body: str = "", headers: dict | None = None) -> APIStatusError:
    request = httpx.Request("POST", "https://example.test/chat/completions")
    response = httpx.Response(status, request=request, headers=headers or {}, text=body)
    return APIStatusError(f"HTTP {status}", response=response, body=body)


class FakeCompletions:
    """Programmable per-provider behaviour, keyed by api_key."""

    behaviours: dict[str, object] = {}
    calls: list[str] = []

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def create(self, **kwargs):
        FakeCompletions.calls.append(self.api_key)
        behaviour = FakeCompletions.behaviours.get(self.api_key)
        if isinstance(behaviour, Exception):
            raise behaviour
        if kwargs.get("stream"):
            return _fake_stream(behaviour or "streamed")
        return _fake_response(behaviour or "ok")


def _fake_response(text: str):
    class Msg:
        content = text

    class Choice:
        message = Msg()

    class Resp:
        choices = [Choice()]

    return Resp()


async def _fake_stream(text: str):
    class Delta:
        def __init__(self, c):
            self.content = c

    class Choice:
        def __init__(self, c):
            self.delta = Delta(c)

    class Chunk:
        def __init__(self, c):
            self.choices = [Choice(c)]

    for piece in (text[: len(text) // 2], text[len(text) // 2:]):
        yield Chunk(piece)


class FakeClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.chat = type("Chat", (), {})()
        self.chat.completions = FakeCompletions(api_key)


@pytest.fixture
def fake_clients(monkeypatch):
    FakeCompletions.behaviours = {}
    FakeCompletions.calls = []
    monkeypatch.setattr(router, "_get_client", lambda p: FakeClient(router._api_key(p)))
    return FakeCompletions


async def test_first_provider_success(fake_clients):
    fake_clients.behaviours = {"gk": "groq says hi"}
    result = await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert result == "groq says hi"
    assert fake_clients.calls == ["gk"]


async def test_429_advances_chain_and_flags_provider(fake_clients):
    fake_clients.behaviours = {
        "gk": _status_error(429, body="rate limit: try again"),
        "gmk": "gemini answers",
    }
    result = await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert result == "gemini answers"
    assert fake_clients.calls == ["gk", "gmk"]
    # groq is now flagged exhausted for this role...
    assert await kv.kv_exists("llm:exhausted:groq:extractor")
    # ...and skipped on the next call
    fake_clients.calls.clear()
    await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert fake_clients.calls == ["gmk"]


async def test_daily_429_flag_lasts_until_midnight(fake_clients):
    fake_clients.behaviours = {
        "gk": _status_error(429, body="daily quota TPD exceeded"),
        "gmk": "ok",
    }
    await router.complete("generator", "sys", [{"role": "user", "content": "x"}])
    key = "llm:exhausted:groq:generator"
    assert await kv.kv_exists(key)
    _, expires_at = kv._memory[key]
    import time
    ttl = expires_at - time.time()
    # daily flag should be much longer than the 10-minute transient TTL
    assert ttl > 600


async def test_transient_5xx_flag_is_ten_minutes(fake_clients):
    fake_clients.behaviours = {
        "gk": _status_error(503, body="upstream sad"),
        "gmk": "ok",
    }
    await router.complete("generator", "sys", [{"role": "user", "content": "x"}])
    _, expires_at = kv._memory["llm:exhausted:groq:generator"]
    import time
    ttl = expires_at - time.time()
    assert 0 < ttl <= 601


async def test_all_exhausted_raises_typed_error(fake_clients):
    err = _status_error(429, body="rpd limit")
    fake_clients.behaviours = {"gk": err, "gmk": err, "ork": err}
    with pytest.raises(AllProvidersExhausted):
        await router.complete("generator", "sys", [{"role": "user", "content": "x"}])
    for provider in ("groq", "gemini", "openrouter"):
        assert await kv.kv_exists(f"llm:exhausted:{provider}:generator")


async def test_flag_expiry_restores_provider(fake_clients):
    await kv.kv_set("llm:exhausted:groq:extractor", "1", ttl_seconds=1)
    # simulate expiry
    key = "llm:exhausted:groq:extractor"
    value, _ = kv._memory[key]
    import time
    kv._memory[key] = (value, time.time() - 1)
    fake_clients.behaviours = {"gk": "back online"}
    result = await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert result == "back online"
    assert fake_clients.calls == ["gk"]


async def test_4xx_does_not_advance(fake_clients):
    fake_clients.behaviours = {"gk": _status_error(401, body="bad key")}
    with pytest.raises(APIStatusError):
        await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert not await kv.kv_exists("llm:exhausted:groq:extractor")


async def test_stream_advances_before_first_token(fake_clients):
    fake_clients.behaviours = {
        "gk": _status_error(500, body="boom"),
        "gmk": "streamed text",
    }
    chunks = []
    async for delta in router.stream("generator", "sys", [{"role": "user", "content": "x"}]):
        chunks.append(delta)
    assert "".join(chunks) == "streamed text"
    assert fake_clients.calls == ["gk", "gmk"]


async def test_missing_key_skips_provider(fake_clients, monkeypatch):
    monkeypatch.setattr(router.settings, "groq_api_key", "")
    fake_clients.behaviours = {"gmk": "gemini only"}
    result = await router.complete("extractor", "sys", [{"role": "user", "content": "hi"}])
    assert result == "gemini only"
    assert fake_clients.calls == ["gmk"]
