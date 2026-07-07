"""
Audio transcription: ElevenLabs Scribe (primary) → Sarvam Saaras → Groq Whisper fallback.
"""

import io
import logging

import httpx

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
    """
    Transcribe audio bytes to text.
    Priority: ElevenLabs Scribe → Sarvam Saaras → Groq Whisper.
    """
    if settings.elevenlabs_api_key:
        try:
            return await _transcribe_elevenlabs(audio_bytes, mime_type)
        except Exception as e:
            logger.warning("ElevenLabs STT failed: %s — trying Sarvam", e)
    if settings.sarvam_api_key:
        return await _transcribe_sarvam(audio_bytes, mime_type)
    return await _transcribe_groq(audio_bytes, mime_type)


async def _transcribe_elevenlabs(audio_bytes: bytes, mime_type: str) -> str:
    ext_map = {
        "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "mp4",
        "audio/wav": "wav", "audio/webm": "webm", "audio/m4a": "m4a",
        "audio/opus": "ogg",
    }
    ext = ext_map.get(mime_type, "webm")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": settings.elevenlabs_api_key},
            files={"file": (f"audio.{ext}", io.BytesIO(audio_bytes), mime_type)},
            data={"model_id": "scribe_v1"},
        )
    if resp.status_code != 200:
        raise RuntimeError(f"ElevenLabs STT {resp.status_code}: {resp.text[:200]}")
    text = resp.json().get("text", "").strip()
    if not text:
        raise RuntimeError("ElevenLabs STT returned empty transcript")
    logger.info("ElevenLabs STT transcript: %s", text[:100])
    return text


async def _transcribe_sarvam(audio_bytes: bytes, mime_type: str) -> str:
    ext_map = {
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "audio/m4a": "m4a",
        "audio/opus": "ogg",
    }
    ext = ext_map.get(mime_type, "wav")
    filename = f"audio.{ext}"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.sarvam.ai/speech-to-text",
            headers={"api-subscription-key": settings.sarvam_api_key},
            files={"file": (filename, io.BytesIO(audio_bytes), mime_type)},
            data={
                "model": "saaras:v3",
                "mode": "transcribe",  # auto-detects language incl. Hindi/Hinglish
            },
        )

    if resp.status_code != 200:
        logger.warning("Sarvam STT failed %s: %s — falling back to Groq", resp.status_code, resp.text[:200])
        return await _transcribe_groq(audio_bytes, mime_type)

    data = resp.json()
    transcript = data.get("transcript", "")
    if not transcript.strip():
        logger.warning("Sarvam STT returned empty transcript, falling back to Groq")
        return await _transcribe_groq(audio_bytes, mime_type)

    logger.info("Sarvam STT transcript: %s", transcript[:100])
    return transcript


async def _transcribe_groq(audio_bytes: bytes, mime_type: str) -> str:
    client = get_groq_client()
    ext_map = {
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "audio/m4a": "m4a",
    }
    ext = ext_map.get(mime_type, "ogg")
    transcription = await client.audio.transcriptions.create(
        file=(f"audio.{ext}", io.BytesIO(audio_bytes), mime_type),
        model="whisper-large-v3-turbo",
        language="hi",
        response_format="text",
    )
    return transcription if isinstance(transcription, str) else transcription.text
