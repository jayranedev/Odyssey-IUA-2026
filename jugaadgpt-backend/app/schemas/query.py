import base64
import binascii

from pydantic import BaseModel, ConfigDict, Field, field_validator


IMAGE_SIGNATURES = (
    b"\xff\xd8\xff",        # JPEG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"GIF87a",
    b"GIF89a",
    b"RIFF",                # WEBP starts with RIFF....WEBP
)


def normalize_image_base64(value: str | None) -> str | None:
    if value is None:
        return None

    image = value.strip()
    if not image or image.lower() in {"string", "null", "none"}:
        return None

    if image.startswith("data:"):
        _, separator, image = image.partition(",")
        if not separator:
            return None
        image = image.strip()

    compact = "".join(image.split())
    if not compact:
        return None

    try:
        decoded = base64.b64decode(compact, validate=True)
    except (binascii.Error, ValueError):
        return None

    if not any(decoded.startswith(signature) for signature in IMAGE_SIGNATURES):
        return None

    if decoded.startswith(b"RIFF") and decoded[8:12] != b"WEBP":
        return None

    return compact


class QueryRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "demo-session",
                "message": "hi how to make a water pump",
                "image_base64": "",
                "channel": "web",
                "lang": "hinglish",
                "location_state": "Maharashtra",
                "latitude": 0.0,
                "longitude": 0.0,
            }
        }
    )

    session_id: str = Field(..., description="UUID from frontend localStorage")
    message: str = Field(..., min_length=1, max_length=2000)
    image_base64: str | None = Field(
        default=None,
        description="Optional JPEG/PNG/GIF/WEBP base64, without the data URL prefix.",
        json_schema_extra={"example": ""}
    )
    channel: str = "web"  # web | whatsapp
    lang: str = "hinglish"  # hinglish | english | hindi
    # Auto-filled by frontend from browser geolocation + reverse geocode
    location_state: str | None = None  # e.g. "Maharashtra"
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("image_base64", mode="before")
    @classmethod
    def clean_image_base64(cls, value):
        return normalize_image_base64(value)


class ClarifyingQuestion(BaseModel):
    type: str = "clarification"
    question: str
    missing_fields: list[str]
    session_id: str


class StreamChunk(BaseModel):
    type: str  # "token" | "solution_start" | "solution_end" | "error"
    content: str = ""
