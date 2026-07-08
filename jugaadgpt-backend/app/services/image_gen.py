import httpx
import logging
import base64
import urllib.parse

logger = logging.getLogger(__name__)


async def generate_image_base64(prompt: str) -> str | None:
    """Generate an image using pollinations.ai and return it as a base64 string."""
    try:
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            img_bytes = response.content
            if not img_bytes:
                return None
                
            base64_data = base64.b64encode(img_bytes).decode('utf-8')
            logger.info("Successfully generated image via pollinations.ai for prompt: %s...", prompt[:40])
            return base64_data

    except Exception as exc:
        logger.warning("generate_image_base64 failed: %s", exc)
        return None
