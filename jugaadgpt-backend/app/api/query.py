"""
POST /api/query        — main pipeline endpoint (SSE stream, supports conversation history)
POST /api/transcribe   — convert audio file → text (web voice input)
POST /api/tts          — text → speech (for web voice reply)

Flow: extract constraints → clarify if incomplete → retrieve cases → generate (streaming) → validate
"""

import json
import time
from datetime import date

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
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
    if d.get("budget_inr") is None:
        missing.append("budget_inr")
    if not d.get("location_state") and not d.get("climate"):
        missing.append("location_state")
    return missing

router = APIRouter()

MAX_RETRIES = 2


@router.post("/query")
async def query(request: QueryRequest, db: AsyncSession = Depends(get_db)):
    async def event_stream():
        start = time.monotonic()
        full_solution_text = ""

        try:
            # Load conversation history for this session
            history = format_history_for_prompt(request.session_id)

            # Step 1: Extract constraints (history gives context for follow-ups)
            yield _sse("status", "Analysing your constraints...")
            constraints = await extract_constraints(request.message, request.image_base64)

            # Auto-fill season from current date if not in message
            if not constraints.season or constraints.season == "unknown":
                constraints.season = _auto_season()

            # Auto-fill location from browser geolocation if provided and not in message
            if request.location_state and not constraints.location_state:
                constraints.location_state = request.location_state

            # Step 2: Check truly critical missing fields (never asks for optional ones)
            missing = _compute_missing(constraints)
            if missing:
                question = _build_clarifying_question(missing)
                yield _sse("clarification", json.dumps({
                    "question": question,
                    "missing_fields": missing,
                }))
                return

            # Step 3: Retrieve relevant cases
            yield _sse("status", "Searching jugaad case library...")
            cases = await retrieve_cases(constraints, db)

            # Step 4: Generate solution with retry loop
            solution = None
            retry_prompt_addition = ""

            for attempt in range(MAX_RETRIES + 1):
                if attempt == 0:
                    yield _sse("status", "Generating solution...")

                    # Stream the first attempt
                    full_text = ""
                    async for token in generate_solution_stream(constraints, cases, history):
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
    Web voice reply: text → audio (mp3 bytes).
    Frontend flow: solution arrives → POST /api/tts → play audio.
    Uses Groq's TTS API (same client as Whisper).

    Body: {"text": "...", "lang": "hi"}  (lang is a hint, not enforced)
    """
    from app.services.transcription import get_groq_client
    text = body.get("text", "")[:1000]  # cap length

    client = get_groq_client()
    response = await client.audio.speech.create(
        model="playai-tts",
        voice="Arya-PlayAI",   # Hindi-accented Indian female voice
        input=text,
        response_format="mp3",
    )
    audio_bytes = response.read()
    return Response(content=audio_bytes, media_type="audio/mpeg")


def _build_clarifying_question(missing_fields: list[str]) -> str:
    field_questions = {
        "budget_inr": "Aapka budget kitna hai? (What is your budget in rupees?)",
        "power_availability": "Kya aapke paas bijli hai? (Do you have electricity available?)",
        "location_state": "Aap kaunse state mein hain? (Which state are you in?)",
        "climate": "Aapke area ka mahaul kaisa hai — garmi, sardi, ya barish? (Hot/cold/rainy climate?)",
    }
    questions = [field_questions.get(f, f"Please provide: {f}") for f in missing_fields[:2]]
    return " | ".join(questions)
