"""
POST /api/query        — main pipeline endpoint (SSE stream, supports conversation history)
POST /api/transcribe   — convert audio file → text (web voice input)
POST /api/tts          — text → speech MP3 (web + Expo voice reply, edge-tts)
POST /api/tts-b64      — text → base64 MP3 (Expo app compatibility wrapper)

Flow: extract constraints → clarify if incomplete → quota gate → retrieve cases
      → generate (streaming) → validate (deterministic, with retry loop)

SSE events: quota, status, token, clarification, solution, capacity,
            login_required, quota_exhausted, error
"""

import base64
import json
import logging
import time
from datetime import date

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import Response, StreamingResponse
from loguru import logger as struct_log

from app.auth import AuthUser, get_client_ip, get_current_user_optional, get_device_id
from app.db import AsyncSessionLocal
from app.llm import router as llm_router
from app.llm.parsing import extract_json_array
from app.llm.router import AllProvidersExhausted
from app.pipeline.extractor import extract_constraints
from app.pipeline.generator import generate_solution, generate_solution_stream, parse_solution
from app.pipeline.retriever import retrieve_cases
from app.pipeline.validator import validate
from app.schemas.query import QueryRequest
from app.services.conversation import add_turn, format_history_for_prompt
from app.services.embeddings import EmbeddingsExhausted
from app.services.quota import get_quota_status, increment_quota
from app.services.transcription import transcribe_audio

logger = logging.getLogger(__name__)

CAPACITY_MESSAGE = "Daily free capacity reached. Try again after midnight UTC."


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


def _quota_payload(status) -> str:
    return json.dumps({
        "type": "quota",
        "used": status.used,
        "limit": status.limit,
        "authenticated": status.authenticated,
    })


@router.post("/query")
async def query(
    request: QueryRequest,
    http_request: Request,
    user: AuthUser | None = Depends(get_current_user_optional),
):
    device_id = get_device_id(http_request) or request.session_id
    client_ip = get_client_ip(http_request)

    async def event_stream():
        start = time.monotonic()

        try:
            # Quota status first, so every UI can render the pill immediately
            quota = await get_quota_status(user, device_id, client_ip)
            yield _sse("quota", _quota_payload(quota))

            if quota.exceeded:
                if quota.authenticated:
                    yield _sse("quota_exhausted", json.dumps({
                        "type": "quota_exhausted",
                        "message": f"You've used all {quota.limit} jugaads for today. Resets at midnight UTC.",
                    }))
                else:
                    yield _sse("login_required", json.dumps({
                        "type": "login_required",
                        "message": f"You've used your {quota.limit} free jugaads today — log in to continue and save your chats.",
                    }))
                return

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
            # Clarifying turns don't touch the quota — only generation counts.
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

            # The generator is about to run — this is the moment the quota is spent.
            quota = await increment_quota(user, device_id, client_ip)
            yield _sse("quota", _quota_payload(quota))

            # Step 4: Generate solution with validator retry loop
            solution = None
            retry_hint = ""
            validation_retries = 0

            for attempt in range(MAX_RETRIES + 1):
                if attempt == 0:
                    yield _sse("status", "Generating solution...")

                    # Stream the first attempt
                    full_text = ""
                    async for token in generate_solution_stream(constraints, cases, history, request.lang):
                        full_text += token
                        yield _sse("token", token)

                    # Parse the streamed result (tolerant of fences/prose)
                    try:
                        solution = parse_solution(full_text)
                    except Exception:
                        yield _sse("error", "Failed to parse solution. Please try again.")
                        return
                else:
                    # Retry without streaming (hidden from user), carrying the
                    # validator's fix-it hint so hard rules get corrected.
                    yield _sse("status", f"Refining solution (attempt {attempt + 1})...")
                    solution = await generate_solution(
                        constraints, cases, history, request.lang,
                        retry_hint=retry_hint,
                    )

                # Step 5: Validate (deterministic — the moat)
                result = validate(solution, constraints)
                if result.passed:
                    break
                retry_hint = result.retry_prompt_addition
                validation_retries = attempt + 1

            # Step 6: Emit final validated solution
            validation_result = validate(solution, constraints)
            latency_ms = (time.monotonic() - start) * 1000

            # Save turn to conversation memory
            add_turn(request.session_id, request.message, f"{solution.title}: {solution.summary}")

            # One structured line per query — metadata only, never content/tokens.
            struct_log.bind(
                provider=llm_router.get_used_provider("generator"),
                role="generator",
                latency_ms=round(latency_ms),
                quota_type="user" if user else "anon",
                validation_retries=validation_retries,
                validation_passed=validation_result.passed,
                channel=request.channel,
            ).info("query completed")

            yield _sse("solution", json.dumps({
                "solution": solution.model_dump(),
                "warnings": validation_result.soft_warnings,
                "latency_ms": round(latency_ms),
            }))

        except (AllProvidersExhausted, EmbeddingsExhausted):
            yield _sse("capacity", json.dumps({
                "type": "capacity",
                "message": CAPACITY_MESSAGE,
            }))
        except Exception as e:
            logger.exception("Query pipeline failed")
            yield _sse("error", str(e))

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse(event: str, data: str) -> str:
    # SSE requires each line of a multiline payload to be prefixed with "data: "
    formatted_data = "\n".join(f"data: {line}" for line in data.split("\n"))
    return f"event: {event}\n{formatted_data}\n\n"


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Web voice input: audio file → transcript text (Groq Whisper, free tier).
    Browser records with MediaRecorder → POST here → show transcript → user edits → POST /api/query.
    """
    audio_bytes = await audio.read()
    mime_type = audio.content_type or "audio/webm"
    transcript = await transcribe_audio(audio_bytes, mime_type)
    return {"transcript": transcript}


@router.post("/tts")
async def text_to_speech(body: dict):
    """
    Voice reply: text → MP3 via edge-tts (free, Indian voices).
    Body: {"text": "...", "lang": "hi-IN" | "hinglish" | "english" | ...}
    Always returns a valid response so CORS headers are preserved.
    """
    from app.services.tts import synthesize_mp3

    text = (body.get("text") or "").strip()
    lang = body.get("lang") or "hinglish"
    if not text:
        return Response(status_code=204)

    try:
        audio_bytes = await synthesize_mp3(text, lang)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as exc:
        logger.warning("edge-tts failed: %s", exc)
        return Response(status_code=204)


@router.post("/tts-b64")
async def tts_base64(body: dict):
    """
    Expo app TTS: text → base64 MP3 via edge-tts.
    Body: {"text": "...", "lang": "hinglish|english|hindi"}
    Returns: {"audio_base64": "<mp3 base64>" | ""}
    """
    from app.services.tts import synthesize_mp3

    text = (body.get("text") or "").strip()
    lang = body.get("lang") or "hinglish"
    if not text:
        return {"audio_base64": ""}

    try:
        audio_bytes = await synthesize_mp3(text, lang)
        return {"audio_base64": base64.b64encode(audio_bytes).decode()}
    except Exception as exc:
        logger.warning("edge-tts (b64) failed: %s", exc)
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
    Uses the router's vision role to identify objects in the photo.
    Body: {"image_base64": "...", "image_type": "image/jpeg"}
    """
    image_base64 = body.get("image_base64", "")
    image_type = body.get("image_type", "image/jpeg")
    if not image_base64:
        return {"items": []}

    try:
        raw = await llm_router.complete(
            role="vision",
            system="",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{image_type};base64,{image_base64}"},
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
            max_tokens=300,
            temperature=0.1,
        )
    except AllProvidersExhausted:
        return {"items": []}

    items = extract_json_array(raw)
    if isinstance(items, list):
        return {"items": [str(i) for i in items[:10]]}
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
