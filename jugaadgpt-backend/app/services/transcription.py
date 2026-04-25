"""
Audio transcription via Groq's Whisper API.
Groq is free-tier, ~10x faster than real-time, and handles Hindi/multilingual.
Returns plain text transcript.
"""

import io

from groq import AsyncGroq

from app.config import settings

_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/ogg") -> str:
    """
    Transcribe audio bytes to text.
    mime_type examples: audio/ogg, audio/mpeg, audio/wav, audio/webm
    Groq Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
    """
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
    filename = f"audio.{ext}"

    transcription = await client.audio.transcriptions.create(
        file=(filename, io.BytesIO(audio_bytes), mime_type),
        model="whisper-large-v3-turbo",
        language="hi",       # Hindi first; Whisper auto-detects if wrong
        response_format="text",
    )

    # Groq returns str directly when response_format="text"
    return transcription if isinstance(transcription, str) else transcription.text
