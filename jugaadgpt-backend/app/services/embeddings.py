"""
Embeddings — provider-switched via EMBEDDING_PROVIDER.

gemini (default): Google `text-embedding-004` (768 dims) over the REST
    batchEmbedContents endpoint using the existing GEMINI_API_KEY. No local
    model, no torch — fits a 512MB PaaS instance. 429s get retry-with-backoff
    and then an exhaustion flag in the KV store (like the LLM router); callers
    see a typed EmbeddingsExhausted that /api/query surfaces as the `capacity`
    SSE event. (No secondary embedding provider is configured: no genuinely
    key-free option exists, so exhaustion is surfaced honestly instead.)

local: sentence-transformers (install the `local-embeddings` poetry extra).
    Lazy singleton, threadpool executor — identical to the pre-Phase-9 path.
    IMPORTANT: sentence_transformers must only ever be imported inside this
    provider's loader, never at module top level.
"""

import asyncio
import logging
import threading
from concurrent.futures import ThreadPoolExecutor

import httpx

from app.config import settings
from app.services.kv import kv_exists, kv_set, seconds_until_midnight_utc

logger = logging.getLogger(__name__)


class EmbeddingsExhausted(Exception):
    """The embeddings API is rate-limited for the rest of the day/window."""


# ── Gemini API provider ──────────────────────────────────────────

GEMINI_EMBED_MODEL = "text-embedding-004"
_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"
_GEMINI_BATCH_LIMIT = 100  # documented max requests per batchEmbedContents call
_EXHAUSTED_KEY = "llm:exhausted:gemini:embeddings"
_MAX_RETRIES = 3

_logged_dim = False


async def _gemini_embed_batch(texts: list[str], task_type: str) -> list[list[float]]:
    global _logged_dim
    if not settings.gemini_api_key:
        raise RuntimeError("EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is not set")
    if await kv_exists(_EXHAUSTED_KEY):
        raise EmbeddingsExhausted("Gemini embeddings flagged exhausted")

    url = f"{_GEMINI_BASE}/models/{GEMINI_EMBED_MODEL}:batchEmbedContents"
    payload = {
        "requests": [
            {
                "model": f"models/{GEMINI_EMBED_MODEL}",
                "content": {"parts": [{"text": t}]},
                "taskType": task_type,
            }
            for t in texts
        ]
    }

    async with httpx.AsyncClient(timeout=30) as client:
        for attempt in range(_MAX_RETRIES + 1):
            resp = await client.post(
                url, json=payload, headers={"x-goog-api-key": settings.gemini_api_key}
            )
            if resp.status_code == 200:
                embeddings = [e["values"] for e in resp.json()["embeddings"]]
                if not _logged_dim:
                    _logged_dim = True
                    logger.info(
                        "Gemini embeddings live: model=%s dim=%d (config EMBEDDING_DIM=%d)",
                        GEMINI_EMBED_MODEL, len(embeddings[0]), settings.embedding_dim,
                    )
                    if len(embeddings[0]) != settings.embedding_dim:
                        raise RuntimeError(
                            f"EMBEDDING_DIM={settings.embedding_dim} but Gemini returned "
                            f"{len(embeddings[0])} dims — fix .env and re-run migrations + reembed"
                        )
                return embeddings
            if resp.status_code == 429 and attempt < _MAX_RETRIES:
                delay = 2 ** attempt  # 1s, 2s, 4s
                logger.warning("Gemini embeddings 429, retry %d/%d in %ss", attempt + 1, _MAX_RETRIES, delay)
                await asyncio.sleep(delay)
                continue
            if resp.status_code == 429:
                body = resp.text.lower()
                daily = any(w in body for w in ("day", "daily", "quota", "per_day"))
                ttl = seconds_until_midnight_utc() if daily else 600
                await kv_set(_EXHAUSTED_KEY, "1", ttl_seconds=ttl)
                logger.error("Gemini embeddings exhausted (429), flagged for %ss", ttl)
                raise EmbeddingsExhausted(f"Gemini embeddings rate-limited: {resp.text[:200]}")
            resp.raise_for_status()
    raise EmbeddingsExhausted("Gemini embeddings retries exhausted")


async def _gemini_embed(texts: list[str], mode: str) -> list[list[float]]:
    task_type = "RETRIEVAL_QUERY" if mode == "query" else "RETRIEVAL_DOCUMENT"
    out: list[list[float]] = []
    for i in range(0, len(texts), _GEMINI_BATCH_LIMIT):
        out.extend(await _gemini_embed_batch(texts[i : i + _GEMINI_BATCH_LIMIT], task_type))
    return out


# ── Local sentence-transformers provider ─────────────────────────

_BGE_EN_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

_model = None
_model_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="embed")


def _get_local_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                # Lazy import — this module must be importable without torch installed.
                from sentence_transformers import SentenceTransformer

                logger.info("[embeddings] loading %s (CPU)", settings.embedding_model)
                _model = SentenceTransformer(settings.embedding_model, device="cpu")
                actual_dim = _model.get_sentence_embedding_dimension()
                if actual_dim != settings.embedding_dim:
                    raise RuntimeError(
                        f"EMBEDDING_DIM={settings.embedding_dim} but "
                        f"{settings.embedding_model} produces {actual_dim} dims — "
                        "fix .env and re-run the migration + scripts/reembed_cases.py"
                    )
    return _model


def _local_query_text(text: str) -> str:
    name = settings.embedding_model.lower()
    if "bge-" in name and "-en-" in name:
        return _BGE_EN_QUERY_PREFIX + text
    return text


def _local_embed_sync(texts: list[str], mode: str = "passage") -> list[list[float]]:
    model = _get_local_model()
    if mode == "query":
        texts = [_local_query_text(t) for t in texts]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return [e.tolist() for e in embeddings]


async def _local_embed(texts: list[str], mode: str) -> list[list[float]]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _local_embed_sync, texts, mode)


# ── Public API (provider dispatch) ───────────────────────────────

async def _embed(texts: list[str], mode: str) -> list[list[float]]:
    if settings.embedding_provider == "local":
        return await _local_embed(texts, mode)
    return await _gemini_embed(texts, mode)


async def embed_documents(texts: list[str]) -> list[list[float]]:
    return await _embed(texts, mode="passage")


async def embed_query(text: str) -> list[float]:
    results = await _embed([text], mode="query")
    return results[0]


async def embed_documents_batched(
    texts: list[str], batch_size: int = 64, inter_batch_delay: float = 0
) -> list[list[float]]:
    all_embeddings: list[list[float]] = []
    total = len(texts)
    for i in range(0, total, batch_size):
        batch = texts[i : i + batch_size]
        all_embeddings.extend(await _embed(batch, mode="passage"))
        if inter_batch_delay:
            await asyncio.sleep(inter_batch_delay)
        logger.info("embedded %d/%d", min(i + batch_size, total), total)
    return all_embeddings
