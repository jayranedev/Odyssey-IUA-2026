"""
Gemini embeddings provider tests — HTTP mocked, no network, no torch.
"""

import httpx
import pytest

from app.config import settings
from app.services import embeddings, kv
from app.services.embeddings import EmbeddingsExhausted, embed_documents, embed_query


@pytest.fixture(autouse=True)
def gemini_provider(monkeypatch):
    kv._reset_memory_for_tests()
    monkeypatch.setattr(settings, "embedding_provider", "gemini")
    monkeypatch.setattr(settings, "embedding_dim", 768)
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(embeddings, "_logged_dim", True)  # skip dim-check logging path
    yield
    kv._reset_memory_for_tests()


_RealAsyncClient = httpx.AsyncClient


class MockTransport:
    """Programmable sequence of responses for httpx.AsyncClient."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def make_client(self, *args, **kwargs):
        transport = httpx.MockTransport(self._handler)
        return _RealAsyncClient(transport=transport, timeout=30)

    def _handler(self, request):
        self.requests.append(request)
        status, body = self.responses.pop(0) if self.responses else (200, {})
        if isinstance(body, dict):
            return httpx.Response(status, json=body)
        return httpx.Response(status, text=body)


def _ok_body(n, dim=768):
    return {"embeddings": [{"values": [0.1] * dim} for _ in range(n)]}


@pytest.fixture
def mock_http(monkeypatch):
    def install(responses):
        mock = MockTransport(responses)
        monkeypatch.setattr(embeddings.httpx, "AsyncClient", mock.make_client)
        return mock
    return install


async def test_embed_query_returns_vector(mock_http, monkeypatch):
    mock_http([(200, _ok_body(1))])
    vec = await embed_query("vegetables rotting no electricity Rajasthan")
    assert len(vec) == 768


async def test_batching_over_100_texts(mock_http):
    mock = mock_http([(200, _ok_body(100)), (200, _ok_body(20))])
    out = await embed_documents([f"text {i}" for i in range(120)])
    assert len(out) == 120
    assert len(mock.requests) == 2  # two batchEmbedContents calls


async def test_429_retries_then_succeeds(mock_http, monkeypatch):
    async def no_sleep(_):
        pass
    monkeypatch.setattr(embeddings.asyncio, "sleep", no_sleep)
    mock = mock_http([(429, "rate limited"), (429, "rate limited"), (200, _ok_body(1))])
    vec = await embed_query("hello")
    assert len(vec) == 768
    assert len(mock.requests) == 3


async def test_persistent_429_flags_exhausted(mock_http, monkeypatch):
    async def no_sleep(_):
        pass
    monkeypatch.setattr(embeddings.asyncio, "sleep", no_sleep)
    mock_http([(429, "daily quota exceeded")] * 10)
    with pytest.raises(EmbeddingsExhausted):
        await embed_query("hello")
    assert await kv.kv_exists("llm:exhausted:gemini:embeddings")
    # subsequent calls short-circuit without hitting the API
    with pytest.raises(EmbeddingsExhausted):
        await embed_query("hello again")


async def test_missing_key_raises(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "")
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        await embed_query("hello")


def test_no_top_level_sentence_transformers_import():
    """The module must import cleanly without torch installed (Koyeb slim image)."""
    import ast
    import inspect

    tree = ast.parse(inspect.getsource(embeddings))
    top_level_imports = [
        n for n in tree.body
        if isinstance(n, (ast.Import, ast.ImportFrom))
    ]
    for node in top_level_imports:
        names = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module or ""]
        assert not any("sentence_transformers" in (n or "") or "torch" in (n or "") for n in names)
