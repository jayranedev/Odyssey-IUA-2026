import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from limits import parse as parse_limit
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api import archive, feedback, query, sessions, vision, whatsapp
from app.config import settings
from app.logging_config import setup_logging

setup_logging()

logger = logging.getLogger(__name__)

# ── Sentry (optional — only when SENTRY_DSN is set) ─────────────
if settings.sentry_dsn:
    import sentry_sdk

    def _scrub_auth(event, hint):
        headers = event.get("request", {}).get("headers", {})
        for key in list(headers):
            if key.lower() in ("authorization", "x-device-id", "cookie"):
                headers[key] = "[Filtered]"
        return event

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.1,
        send_default_pii=False,
        before_send=_scrub_auth,
    )
    logger.info("Sentry initialised (env=%s)", settings.environment)


def _rate_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Burst limiting (slowapi): 20/min per IP on everything, plus a tighter
# 10/min per IP window on POST /api/query enforced in middleware below.
limiter = Limiter(key_func=_rate_key, default_limits=["20/minute"])

_query_burst = MovingWindowRateLimiter(MemoryStorage())
_QUERY_LIMIT = parse_limit("10/minute")


@asynccontextmanager
async def lifespan(app: FastAPI):
    keepalive_task: asyncio.Task | None = None
    token_ok = bool(settings.whatsapp_access_token)
    logger.info(
        "WhatsApp config — access_token: %s, phone_number_id: %s",
        "SET" if token_ok else "MISSING",
        settings.whatsapp_phone_number_id or "MISSING",
    )
    logger.info(
        "LLM keys — groq: %s, gemini: %s, openrouter: %s | embeddings: %s (%s, dim %d) | redis: %s",
        "SET" if settings.groq_api_key else "MISSING",
        "SET" if settings.gemini_api_key else "MISSING",
        "SET" if settings.openrouter_api_key else "MISSING",
        settings.embedding_provider,
        settings.embedding_model if settings.embedding_provider == "local" else "text-embedding-004",
        settings.embedding_dim,
        "SET" if settings.redis_url else "in-memory fallback",
    )
    if settings.environment == "production" and not settings.redis_url:
        logger.warning(
            "⚠️  PRODUCTION WITHOUT REDIS: quotas and LLM exhaustion flags live in "
            "process memory and RESET ON EVERY RESTART/DEPLOY. Set REDIS_URL "
            "(e.g. an Upstash rediss:// URL) before going live."
        )
    # Best-effort: log which free-tier models are live right now (never blocks startup)
    from app.llm.router import startup_model_check
    asyncio.create_task(startup_model_check())

    from app.services.keepalive import keepalive_loop, should_start_keepalive
    if should_start_keepalive():
        keepalive_task = asyncio.create_task(keepalive_loop())
    else:
        logger.info("Backend keepalive disabled for this environment")

    try:
        yield
    finally:
        if keepalive_task:
            keepalive_task.cancel()
            try:
                await keepalive_task
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="JugaadGPT API",
    description="Constraint-first AI for India's street-smart solutions",
    version="0.2.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def burst_limit_query(request: Request, call_next):
    """10 req/min per IP on POST /api/query (tighter than the 20/min default)."""
    if request.url.path == "/api/query" and request.method == "POST":
        if not _query_burst.hit(_QUERY_LIMIT, "query", _rate_key(request)):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests — max 10/min on /api/query."},
            )
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Baseline hardening on every API response (no CSP — this is a JSON/SSE API)."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(query.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(whatsapp.router, prefix="/api")
app.include_router(archive.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(vision.router, prefix="/api")


@app.get("/health")
async def health():
    """Fast liveness probe — no DB, used by Koyeb health checks + keep-alive."""
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    """SELECT 1 against Postgres — the daily keep-alive hits this so the
    Supabase free-tier project never pauses for inactivity."""
    from sqlalchemy import text

    from app.db import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        await db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}
