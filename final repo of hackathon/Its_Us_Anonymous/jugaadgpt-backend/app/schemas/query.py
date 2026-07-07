from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    session_id: str = Field(..., description="UUID from frontend localStorage")
    message: str = Field(..., min_length=1, max_length=2000)
    image_base64: str | None = None  # for photo-of-materials feature
    channel: str = "web"  # web | whatsapp
    lang: str = "hinglish"  # hinglish | english | hindi
    # Auto-filled by frontend from browser geolocation + reverse geocode
    location_state: str | None = None  # e.g. "Maharashtra"
    latitude: float | None = None
    longitude: float | None = None


class ClarifyingQuestion(BaseModel):
    type: str = "clarification"
    question: str
    missing_fields: list[str]
    session_id: str


class StreamChunk(BaseModel):
    type: str  # "token" | "solution_start" | "solution_end" | "error"
    content: str = ""
