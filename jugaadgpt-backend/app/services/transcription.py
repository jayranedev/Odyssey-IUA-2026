"""
Audio transcription via Groq Whisper (free tier, ~2K req/day).
"""

import io
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_groq_client = None


def get_groq_client():
    global _groq_client
    if _groq_client is None:
        from groq import AsyncGroq
        _groq_client = AsyncGroq(api_key=settings.groq_api_key)
    return _groq_client


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/ogg") -> str:
    """Transcribe audio bytes to text (Hindi + multilingual)."""
    client = get_groq_client()
    ext_map = {
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "audio/m4a": "m4a",
        "audio/opus": "ogg",
    }
    ext = ext_map.get(mime_type, "ogg")
    transcription = await client.audio.transcriptions.create(
        file=(f"audio.{ext}", io.BytesIO(audio_bytes), mime_type),
        model="whisper-large-v3-turbo",
        language="hi",
        response_format="text",
    )
    text = transcription if isinstance(transcription, str) else transcription.text
    logger.info("Groq Whisper transcript: %s", text[:100])
    return text
