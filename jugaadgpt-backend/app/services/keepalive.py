import asyncio
import logging
import os

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TRUTHY = {"1", "true", "yes", "on"}


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in TRUTHY


def keepalive_base_url() -> str:
    """Public URL to ping. Render provides RENDER_EXTERNAL_URL automatically."""
    return (settings.keepalive_url or os.getenv("RENDER_EXTERNAL_URL", "")).rstrip("/")


def keepalive_target_url() -> str:
    base_url = keepalive_base_url()
    return f"{base_url}/health" if base_url else ""


def should_start_keepalive() -> bool:
    if not settings.keepalive_enabled:
        return False
    if settings.environment.lower() != "production":
        return False
    if settings.keepalive_interval_seconds <= 0:
        return False

    # Avoid local shells pinging production accidentally. On Render, the RENDER
    # variable is injected automatically. Elsewhere, setting KEEPALIVE_URL is an
    # explicit opt-in.
    return _truthy(os.getenv("RENDER")) or bool(settings.keepalive_url)


async def keepalive_loop() -> None:
    url = keepalive_target_url()
    if not url:
        logger.info("Backend keepalive skipped: no public URL configured")
        return

    interval = max(settings.keepalive_interval_seconds, 60)
    initial_delay = max(settings.keepalive_initial_delay_seconds, 0)
    timeout = max(settings.keepalive_timeout_seconds, 1)

    logger.info("Backend keepalive enabled: pinging %s every %ss", url, interval)
    if initial_delay:
        await asyncio.sleep(initial_delay)

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        while True:
            try:
                response = await client.get(
                    url,
                    headers={"User-Agent": "jugaadgpt-backend-keepalive/1.0"},
                )
                if response.status_code >= 400:
                    logger.warning(
                        "Backend keepalive got HTTP %s from %s",
                        response.status_code,
                        url,
                    )
                else:
                    logger.debug("Backend keepalive ok: HTTP %s", response.status_code)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("Backend keepalive ping failed: %s", exc)

            await asyncio.sleep(interval)
