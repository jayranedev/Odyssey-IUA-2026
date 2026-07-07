import asyncio
import logging

logger = logging.getLogger(__name__)


async def generate_image_base64(prompt: str) -> str | None:
    """Run ii.send_request in a thread (it uses sync requests) and return base64."""
    from app.services.ii import send_request
    try:
        result = await asyncio.to_thread(send_request, prompt, prompt[:20].replace(" ", "_"))
        return result
    except Exception as exc:
        logger.warning("generate_image_base64 failed: %s", exc)
        return None
