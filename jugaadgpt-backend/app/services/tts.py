"""
Free text-to-speech via Microsoft Edge neural voices (edge-tts).
No API key, no quota. Indian voices for Hindi/Hinglish and Indian English.
Returns MP3 bytes.
"""

import logging

import edge_tts

logger = logging.getLogger(__name__)

# lang value (from web/expo/session) → edge voice
_VOICE_MAP = {
    "hindi": "hi-IN-SwaraNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "hinglish": "hi-IN-SwaraNeural",  # Swara handles Roman-Hindi text well
    "english": "en-IN-NeerjaNeural",
    "en-IN": "en-IN-NeerjaNeural",
    "en-US": "en-IN-NeerjaNeural",
    "en-GB": "en-IN-NeerjaNeural",
}

DEFAULT_VOICE = "hi-IN-SwaraNeural"
MAX_TTS_CHARS = 2500


def pick_voice(lang: str) -> str:
    return _VOICE_MAP.get((lang or "").strip(), DEFAULT_VOICE)


async def synthesize_mp3(text: str, lang: str = "hinglish") -> bytes:
    """Text → MP3 bytes. Raises on network failure (callers degrade gracefully)."""
    voice = pick_voice(lang)
    communicate = edge_tts.Communicate(text[:MAX_TTS_CHARS], voice, rate="-5%")
    chunks: list[bytes] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            chunks.append(chunk["data"])
    audio = b"".join(chunks)
    if not audio:
        raise RuntimeError("edge-tts returned no audio")
    return audio
