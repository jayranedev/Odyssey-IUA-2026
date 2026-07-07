"""
LLM provider router — free tiers only (Groq → Gemini → OpenRouter).

All providers speak the OpenAI chat-completions protocol, so one AsyncOpenAI
client per provider is enough. On 429/5xx a provider+role is flagged in the
KV store (Redis in prod) and the chain advances; when every provider is
flagged, AllProvidersExhausted is raised so callers can send a friendly
"capacity reached" message instead of a stack trace.

Roles:
  extractor — small/fast model (constraint extraction, OCR post-processing)
  generator — large model (solution generation)
  vision    — multimodal model (photo-of-materials parsing)
"""

import logging
from collections.abc import AsyncGenerator
from contextvars import ContextVar

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
)

from app.config import settings
from app.services.kv import kv_exists, kv_set, seconds_until_midnight_utc

logger = logging.getLogger(__name__)

PROVIDER_ORDER = ["groq", "gemini", "openrouter"]

PROVIDER_BASE_URLS = {
    "groq": "https://api.groq.com/openai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "openrouter": "https://openrouter.ai/api/v1",
}

# role → provider → model id. OpenRouter generator has a second choice tried
# in-place if the first returns 404/400 (model unavailable).
MODELS = {
    "extractor": {
        "groq": "llama-3.1-8b-instant",
        "gemini": "gemini-2.0-flash",
        "openrouter": "meta-llama/llama-3.1-8b-instruct:free",
    },
    "generator": {
        "groq": "llama-3.3-70b-versatile",
        "gemini": "gemini-2.5-flash",
        "openrouter": "meta-llama/llama-3.3-70b-instruct:free",
    },
    "vision": {
        "groq": "meta-llama/llama-4-scout-17b-16e-instruct",
        "gemini": "gemini-2.0-flash",
        "openrouter": "google/gemini-2.0-flash-exp:free",
    },
}

OPENROUTER_GENERATOR_FALLBACK = "deepseek/deepseek-chat:free"

TRANSIENT_TTL = 600  # 10 minutes for 5xx / rate limits without a daily hint


class AllProvidersExhausted(Exception):
    """Every free provider is rate-limited or failing for this role."""

    def __init__(self, role: str):
        self.role = role
        super().__init__(f"All free LLM providers exhausted for role '{role}'")


_clients: dict[str, AsyncOpenAI] = {}

# Which provider actually served each role in the current request (for the
# structured per-query log line — set per asyncio task, never logged with content).
_used_providers: ContextVar[dict | None] = ContextVar("llm_used_providers", default=None)


def _note_used(role: str, provider: str) -> None:
    d = _used_providers.get()
    if d is None:
        d = {}
        _used_providers.set(d)
    d[role] = provider


def get_used_provider(role: str) -> str:
    return (_used_providers.get() or {}).get(role, "unknown")


def _api_key(provider: str) -> str:
    return {
        "groq": settings.groq_api_key,
        "gemini": settings.gemini_api_key,
        "openrouter": settings.openrouter_api_key,
    }[provider]


def _get_client(provider: str) -> AsyncOpenAI:
    if provider not in _clients:
        kwargs = {}
        if provider == "openrouter":
            kwargs["default_headers"] = {
                "HTTP-Referer": "https://jugaadgpt.in",
                "X-Title": "JugaadGPT",
            }
        _clients[provider] = AsyncOpenAI(
            api_key=_api_key(provider),
            base_url=PROVIDER_BASE_URLS[provider],
            max_retries=0,
            timeout=60.0,
            **kwargs,
        )
    return _clients[provider]


def _exhausted_key(provider: str, role: str) -> str:
    return f"llm:exhausted:{provider}:{role}"


def _exhaustion_ttl(error: APIStatusError) -> int:
    """429 with a daily-limit hint → until midnight UTC; otherwise 10 min."""
    headers = getattr(error, "response", None)
    headers = headers.headers if headers is not None else {}
    retry_after = headers.get("retry-after", "")
    try:
        retry_seconds = int(float(retry_after))
    except (TypeError, ValueError):
        retry_seconds = 0

    if error.status_code == 429:
        body_text = str(getattr(error, "body", "") or "").lower()
        daily_hint = any(w in body_text for w in ("day", "daily", "tpd", "rpd", "quota"))
        if daily_hint or retry_seconds > 3600:
            return seconds_until_midnight_utc()
    return max(retry_seconds, TRANSIENT_TTL) if retry_seconds else TRANSIENT_TTL


async def _mark_exhausted(provider: str, role: str, error: Exception) -> None:
    ttl = _exhaustion_ttl(error) if isinstance(error, APIStatusError) else TRANSIENT_TTL
    logger.warning("LLM provider %s exhausted for role=%s (%ss): %s", provider, role, ttl, error)
    await kv_set(_exhausted_key(provider, role), "1", ttl_seconds=ttl)


async def _available_providers(role: str) -> list[str]:
    out = []
    for provider in PROVIDER_ORDER:
        if not _api_key(provider):
            continue
        if await kv_exists(_exhausted_key(provider, role)):
            continue
        out.append(provider)
    return out


def _build_messages(system: str, messages: list[dict]) -> list[dict]:
    out = []
    if system:
        out.append({"role": "system", "content": system})
    out.extend(messages)
    return out


def _should_advance(error: Exception) -> bool:
    """429 and 5xx (and connection issues) advance the chain; 4xx bubbles up."""
    if isinstance(error, (APIConnectionError, APITimeoutError)):
        return True
    if isinstance(error, APIStatusError):
        return error.status_code == 429 or error.status_code >= 500
    return False


async def complete(
    role: str,
    system: str,
    messages: list[dict],
    max_tokens: int = 1024,
    json_mode: bool = False,
    temperature: float = 0.7,
) -> str:
    """Non-streaming completion. Returns the assistant text."""
    providers = await _available_providers(role)
    if not providers:
        raise AllProvidersExhausted(role)

    last_error: Exception | None = None
    for provider in providers:
        models_to_try = [MODELS[role][provider]]
        if provider == "openrouter" and role == "generator":
            models_to_try.append(OPENROUTER_GENERATOR_FALLBACK)

        for model in models_to_try:
            try:
                kwargs = {}
                # OpenRouter free models often reject response_format — skip there.
                if json_mode and provider in ("groq", "gemini"):
                    kwargs["response_format"] = {"type": "json_object"}
                response = await _get_client(provider).chat.completions.create(
                    model=model,
                    messages=_build_messages(system, messages),
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs,
                )
                _note_used(role, provider)
                return response.choices[0].message.content or ""
            except Exception as e:  # noqa: BLE001 — decide advance vs re-raise below
                last_error = e
                if isinstance(e, APIStatusError) and e.status_code in (400, 404) and len(models_to_try) > 1 and model == models_to_try[0]:
                    logger.warning("Model %s unavailable on %s, trying fallback model", model, provider)
                    continue  # try the fallback model on the same provider
                if _should_advance(e):
                    await _mark_exhausted(provider, role, e)
                    break  # next provider
                raise
    if last_error and not _should_advance(last_error):
        raise last_error
    raise AllProvidersExhausted(role)


async def stream(
    role: str,
    system: str,
    messages: list[dict],
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    """Streaming completion. Yields text deltas.

    Provider failover only happens before the first token is emitted —
    once tokens flow, a mid-stream error surfaces to the caller.
    """
    providers = await _available_providers(role)
    if not providers:
        raise AllProvidersExhausted(role)

    for provider in providers:
        model = MODELS[role][provider]
        emitted = False
        try:
            response = await _get_client(provider).chat.completions.create(
                model=model,
                messages=_build_messages(system, messages),
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True,
            )
            async for chunk in response:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta and delta.content:
                    if not emitted:
                        _note_used(role, provider)
                    emitted = True
                    yield delta.content
            return
        except Exception as e:  # noqa: BLE001
            if emitted or not _should_advance(e):
                raise
            await _mark_exhausted(provider, role, e)
    raise AllProvidersExhausted(role)


async def startup_model_check() -> None:
    """Best-effort: list models per configured provider and log which flash /
    llama models are actually available on the free tier right now."""
    for provider in PROVIDER_ORDER:
        if not _api_key(provider):
            logger.info("LLM provider %s: no API key configured, skipped", provider)
            continue
        try:
            models = await _get_client(provider).models.list()
            ids = [m.id for m in models.data]
            interesting = [i for i in ids if any(k in i.lower() for k in ("flash", "llama", "deepseek"))]
            logger.info("LLM provider %s: %d models available; relevant: %s",
                        provider, len(ids), ", ".join(sorted(interesting)[:15]))
            for role in MODELS:
                if MODELS[role][provider] not in ids:
                    logger.warning("LLM provider %s: configured %s model %r NOT in live model list",
                                   provider, role, MODELS[role][provider])
        except Exception as e:  # noqa: BLE001 — startup check must never crash the app
            logger.warning("LLM provider %s: model list check failed: %s", provider, e)
