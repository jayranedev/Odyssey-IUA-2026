"""
POST /api/query        — main pipeline endpoint (SSE stream, supports conversation history)
POST /api/transcribe   — convert audio file → text (web voice input)
POST /api/tts          — text → speech (for web voice reply)

Flow: extract constraints → clarify if incomplete → retrieve cases → generate (streaming) → validate
"""

import json
import time
from datetime import date

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response, StreamingResponse

from app.config import settings
from app.db import AsyncSessionLocal
from app.pipeline.extractor import extract_constraints
from app.pipeline.generator import generate_solution, generate_solution_stream
from app.pipeline.retriever import retrieve_cases
from app.pipeline.validator import validate
from app.schemas.query import QueryRequest
from app.services.conversation import add_turn, format_history_for_prompt
from app.services.transcription import transcribe_audio


def _auto_season() -> str:
    month = date.today().month
    if month in (3, 4, 5, 6):
        return "summer"
    if month in (7, 8, 9):
        return "monsoon"
    return "winter"


def _compute_missing(c) -> list[str]:
    """Determine truly critical missing constraints. Never requires optional fields."""
    d = c if isinstance(c, dict) else c.model_dump()
    missing = []
    if not d.get("location_state") and not d.get("climate"):
        missing.append("location_state")
    return missing

router = APIRouter()

MAX_RETRIES = 2


@router.post("/query")
async def query(request: QueryRequest):
    async def event_stream():
        start = time.monotonic()
        full_solution_text = ""

        try:
            # Load conversation history for this session
            history = format_history_for_prompt(request.session_id)

            # Step 1: Extract constraints — pass history so follow-up queries have context
            yield _sse("status", "Analysing your constraints...")
            constraints = await extract_constraints(request.message, request.image_base64, history)

            # Auto-fill season from current date if not in message
            if not constraints.season or constraints.season == "unknown":
                constraints.season = _auto_season()

            # Default missing budget so search-style queries can still run.
            if constraints.budget_inr is None:
                constraints.budget_inr = 500

            # Auto-fill location from browser geolocation if provided and not in message
            if request.location_state and not constraints.location_state:
                constraints.location_state = request.location_state

            # Step 2: Check truly critical missing fields (never asks for optional ones)
            missing = _compute_missing(constraints)
            if missing:
                question = _build_clarifying_question(missing, request.lang)
                yield _sse("clarification", json.dumps({
                    "question": question,
                    "missing_fields": missing,
                }))
                return

            # Step 3: Retrieve relevant cases
            # Session is managed here (not via Depends) — StreamingResponse returns immediately
            # so Depends(get_db) would close the session before the generator finishes.
            yield _sse("status", "Searching jugaad case library...")
            async with AsyncSessionLocal() as db:
                cases = await retrieve_cases(constraints, db)

            # Step 4: Generate solution with retry loop
            solution = None
            retry_prompt_addition = ""

            for attempt in range(MAX_RETRIES + 1):
                if attempt == 0:
                    yield _sse("status", "Generating solution...")

                    # Stream the first attempt
                    full_text = ""
                    async for token in generate_solution_stream(constraints, cases, history, request.lang):
                        full_text += token
                        yield _sse("token", token)

                    # Parse the streamed result
                    try:
                        raw = full_text.strip()
                        if raw.startswith("```"):
                            raw = raw.split("```")[1]
                            if raw.startswith("json"):
                                raw = raw[4:]
                        data = json.loads(raw)
                        from app.schemas.solution import Material, Solution
                        solution = Solution(
                            title=data.get("title", ""),
                            summary=data.get("summary", ""),
                            materials=[Material(**m) for m in data.get("materials", [])],
                            total_cost_inr=data.get("total_cost_inr", 0),
                            build_steps=data.get("build_steps", []),
                            expected_outcome=data.get("expected_outcome", ""),
                            failure_modes=data.get("failure_modes", []),
                            maintenance=data.get("maintenance", ""),
                            skill_check=data.get("skill_check", ""),
                        )
                    except Exception:
                        yield _sse("error", "Failed to parse solution. Please try again.")
                        return
                else:
                    # Retry without streaming (hidden from user)
                    yield _sse("status", f"Refining solution (attempt {attempt + 1})...")
                    solution = await generate_solution(constraints, cases)

                # Step 5: Validate
                result = validate(solution, constraints)

                if result.passed:
                    break

                if attempt < MAX_RETRIES:
                    retry_prompt_addition = result.retry_prompt_addition
                    # Patch the user message for next attempt
                    from app.pipeline.generator import _build_user_prompt
                    # Re-run generate_solution with the retry hint appended
                    import anthropic
                    from app.llm.anthropic_client import get_client
                    from app.pipeline.generator import GENERATE_SYSTEM
                    client = get_client()
                    patched_prompt = _build_user_prompt(constraints, cases) + retry_prompt_addition
                    response = await client.messages.create(
                        model="claude-sonnet-4-6",
                        max_tokens=4096,
                        system=GENERATE_SYSTEM,
                        messages=[{"role": "user", "content": patched_prompt}],
                    )
                    raw = response.content[0].text.strip()
                    if raw.startswith("```"):
                        raw = raw.split("```")[1]
                        if raw.startswith("json"):
                            raw = raw[4:]
                    data = json.loads(raw)
                    from app.schemas.solution import Material, Solution
                    solution = Solution(
                        title=data.get("title", ""),
                        summary=data.get("summary", ""),
                        materials=[Material(**m) for m in data.get("materials", [])],
                        total_cost_inr=data.get("total_cost_inr", 0),
                        build_steps=data.get("build_steps", []),
                        expected_outcome=data.get("expected_outcome", ""),
                        failure_modes=data.get("failure_modes", []),
                        maintenance=data.get("maintenance", ""),
                        skill_check=data.get("skill_check", ""),
                    )
                    result = validate(solution, constraints)
                    if result.passed:
                        break

            # Step 6: Emit final validated solution
            validation_result = validate(solution, constraints)
            latency_ms = (time.monotonic() - start) * 1000

            # Save turn to conversation memory
            full_solution_text = f"{solution.title}: {solution.summary}"
            add_turn(request.session_id, request.message, full_solution_text)

            yield _sse("solution", json.dumps({
                "solution": solution.model_dump(),
                "warnings": validation_result.soft_warnings,
                "latency_ms": round(latency_ms),
            }))

        except Exception as e:
            yield _sse("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {data}\n\n"


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Web voice input: audio file → transcript text.
    Browser records with MediaRecorder → POST here → show transcript → user edits → POST /api/query.
    """
    audio_bytes = await audio.read()
    mime_type = audio.content_type or "audio/webm"
    transcript = await transcribe_audio(audio_bytes, mime_type)
    return {"transcript": transcript}


@router.post("/tts")
async def text_to_speech(body: dict):
    """
    Web voice reply: text → audio (wav bytes) via Sarvam AI Bulbul.
    Body: {"text": "...", "lang": "hi-IN"}
    Always returns a valid response so CORS headers are preserved.
    """
    import base64
    import logging as _logging
    import httpx as _httpx

    _log = _logging.getLogger(__name__)

    text = (body.get("text") or "").strip()
    lang = body.get("lang") or "hi-IN"
    if not text or not settings.sarvam_api_key:
        return Response(status_code=204)

    lang_map = {
        "hi-IN": "hi-IN", "hinglish": "hi-IN",
        "en-IN": "en-IN", "en-US": "en-IN", "en-GB": "en-IN",
    }
    sarvam_lang = lang_map.get(lang, "hi-IN")

    try:
        payload = {
            "text": text[:2500],
            "target_language_code": sarvam_lang,
            "speaker": "manan",
            "model": "bulbul:v3",
            "pace": 0.9,
            "speech_sample_rate": 24000,
        }
        async with _httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                json=payload,
                headers={"api-subscription-key": settings.sarvam_api_key},
            )
            if resp.status_code != 200:
                _log.warning("Sarvam TTS 400 body: %s", resp.text[:500])
                resp.raise_for_status()

        audio_b64 = resp.json()["audios"][0]
        audio_bytes = base64.b64decode(audio_b64)
        return Response(content=audio_bytes, media_type="audio/wav")

    except Exception as exc:
        _log.warning("Sarvam TTS failed: %s", exc)
        return Response(status_code=204)


@router.post("/tts-b64")
async def tts_elevenlabs(body: dict):
    """
    Mobile TTS: text → base64 MP3 via ElevenLabs multilingual.
    Body: {"text": "...", "lang": "hinglish|english|hindi"}
    Returns: {"audio_base64": "<mp3 base64>" | ""}
    """
    import base64
    import httpx as _httpx

    text = (body.get("text") or "").strip()
    if not text or not settings.elevenlabs_api_key:
        return {"audio_base64": ""}

    try:
        async with _httpx.AsyncClient(timeout=25) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text[:2500],
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {"stability": 0.45, "similarity_boost": 0.80, "style": 0.3},
                },
            )
        if resp.status_code == 200:
            return {"audio_base64": base64.b64encode(resp.content).decode()}
        logger.warning("ElevenLabs TTS %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        logger.warning("ElevenLabs TTS failed: %s", exc)
    return {"audio_base64": ""}


@router.post("/generate-image")
async def generate_image(body: dict):
    """
    Prompt → base64 PNG via Gemini Imagen.
    Body: {"prompt": "..."}
    Returns: {"base64": "<base64 string>" | null}
    """
    prompt = (body.get("prompt") or "").strip()
    if not prompt:
        return {"base64": None}
    from app.services.image_gen import generate_image_base64
    b64 = await generate_image_base64(prompt)
    return {"base64": b64}


@router.post("/ocr")
async def ocr_scan(body: dict):
    """
    Image → list of items/materials (for the Workshop scraps list).
    Uses Claude vision to identify objects in the photo.
    Body: {"image_base64": "...", "image_type": "image/jpeg"}
    """
    image_base64 = body.get("image_base64", "")
    image_type = body.get("image_type", "image/jpeg")
    if not image_base64:
        return {"items": []}

    from app.llm.anthropic_client import get_client
    client = get_client()
    response = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": image_type, "data": image_base64},
                },
                {
                    "type": "text",
                    "text": (
                        "List all visible items, materials, tools, or objects in this image. "
                        "Return ONLY a JSON array of short strings (1-4 words each), no other text. "
                        "Max 10 items. Example: [\"Iron rod\", \"PVC pipe\", \"Old tyre\"]"
                    ),
                },
            ],
        }],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        items = json.loads(raw.strip())
        if isinstance(items, list):
            return {"items": [str(i) for i in items[:10]]}
    except Exception:
        pass
    return {"items": []}


def _build_clarifying_question(missing_fields: list[str], lang: str = "hinglish") -> str:
    if lang == "english":
        field_questions = {
            "budget_inr": "What is your budget in rupees?",
            "power_availability": "Do you have electricity available?",
            "location_state": "Which state in India are you in?",
            "climate": "What is your local climate like — hot, cold, or rainy?",
        }
    elif lang == "hindi":
        field_questions = {
            "budget_inr": "आपका बजट कितना है? (रुपये में बताएं)",
            "power_availability": "क्या आपके पास बिजली है?",
            "location_state": "आप किस राज्य में हैं?",
            "climate": "आपके क्षेत्र का मौसम कैसा है — गर्मी, सर्दी, या बारिश?",
        }
    else:  # hinglish default
        field_questions = {
            "budget_inr": "Aapka budget kitna hai? (rupees mein)",
            "power_availability": "Kya aapke paas bijli hai?",
            "location_state": "Aap kaunse state mein hain?",
            "climate": "Aapke area ka mahaul kaisa hai — garmi, sardi, ya barish?",
        }
    questions = [field_questions.get(f, f"Please provide: {f}") for f in missing_fields[:2]]
    return " | ".join(questions)
