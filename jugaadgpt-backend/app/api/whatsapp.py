"""
Meta WhatsApp Cloud API webhook.

GET  /api/whatsapp/webhook  — verification handshake (Meta calls this once on setup)
POST /api/whatsapp/webhook  — incoming messages (text, image, audio)

Outgoing replies go via POST to graph.facebook.com, not TwiML.
"""

import base64
import json
import logging
import time

import httpx
from fastapi import APIRouter, HTTPException, Query, Request

from app.config import settings
from app.pipeline.extractor import extract_constraints
from app.pipeline.generator import generate_solution
from app.pipeline.retriever import retrieve_cases
from app.pipeline.validator import validate
from app.schemas.solution import Constraints
from app.services.transcription import transcribe_audio

logger = logging.getLogger(__name__)
router = APIRouter()

GRAPH_API_URL = "https://graph.facebook.com/v20.0"

# ── Language detection ───────────────────────────────────────────────────────

def _detect_language(text: str) -> str:
    """Detect Hindi (Devanagari), Hinglish (Roman Hindi), or English."""
    devanagari = sum(1 for c in text if "ऀ" <= c <= "ॿ")
    if devanagari > 3:
        return "hindi"
    # Common Roman Hindi words signal Hinglish
    roman_hindi = {"hai", "mein", "aur", "nahi", "nahin", "karo", "kaise", "kya",
                   "mere", "pass", "paas", "mujhe", "aapka", "bijli", "sabzi",
                   "rupaye", "rupee", "chahiye", "batayein", "agar", "wala"}
    words = set(text.lower().split())
    if len(words & roman_hindi) >= 2:
        return "hinglish"
    return "english"


# ── Label translations ───────────────────────────────────────────────────────

_LABELS = {
    "hindi": {
        "materials": "*सामान चाहिए (कुल: ₹{cost}):*",
        "steps": "*कैसे बनाएं:*",
        "result": "*परिणाम:*",
        "failure": "*अगर काम न करे:*",
    },
    "hinglish": {
        "materials": "*Saman chahiye (Total: ₹{cost}):*",
        "steps": "*Kaise banayein:*",
        "result": "*Result:*",
        "failure": "*Agar kaam na kare:*",
    },
    "english": {
        "materials": "*Materials needed (Total: ₹{cost}):*",
        "steps": "*How to build:*",
        "result": "*Expected result:*",
        "failure": "*If it doesn't work:*",
    },
}

_QUESTIONS = {
    "hindi": {
        "budget_inr": "आपका बजट कितना है? (रुपए में बताएं)",
        "power_availability": "आपके पास बिजली है? (हाँ / नहीं / कभी-कभी)",
        "location_state": "आप किस राज्य में हैं?",
        "climate": "आपके यहाँ मौसम कैसा है — गर्मी, सर्दी, या बारिश?",
    },
    "hinglish": {
        "budget_inr": "Aapka budget kitna hai? (Rupees mein batayein)",
        "power_availability": "Bijli hai aapke paas? (Haan / Nahi / Kabhi kabhi)",
        "location_state": "Aap kaunse state mein hain?",
        "climate": "Aapke yahan mausam kaisa hai — garmi, sardi, ya barish?",
    },
    "english": {
        "budget_inr": "What is your budget? (in Rupees)",
        "power_availability": "Do you have electricity? (Yes / No / Sometimes)",
        "location_state": "Which state or region are you in?",
        "climate": "What is the climate like — hot, cold, or rainy season?",
    },
}

_ERROR_MSG = {
    "hindi": "कुछ गड़बड़ हो गई। दोबारा कोशिश करें।",
    "hinglish": "Kuch problem ho gayi. Dobara try karein.",
    "english": "Something went wrong. Please try again.",
}

# ── In-memory session state ──────────────────────────────────────────────────
# sender phone → {"constraints": dict, "messages": list[str], "ts": float}
_sessions: dict[str, dict] = {}
SESSION_TTL = 3600  # 1 hour


def _get_session(sender: str) -> dict:
    s = _sessions.get(sender)
    if s and time.time() - s["ts"] > SESSION_TTL:
        del _sessions[sender]
        return {}
    return s or {}


def _update_session(sender: str, constraints_dict: dict, message: str, language: str):
    s = _get_session(sender)
    stored = dict(s.get("constraints", {}))
    messages = list(s.get("messages", []))
    messages.append(message)
    # Keep the language from the first real message; don't override with later one-word replies
    stored_lang = s.get("lang") or language

    # Merge: new non-empty values win over stored
    for k, v in constraints_dict.items():
        if k == "missing_constraints":
            continue
        if v is not None and v != "" and v != [] and v != "unknown":
            stored[k] = v

    _sessions[sender] = {"constraints": stored, "messages": messages, "lang": stored_lang, "ts": time.time()}
    return stored, messages, stored_lang


def _clear_session(sender: str):
    _sessions.pop(sender, None)


# Decide what's truly missing — never trust the LLM's missing_constraints list.
# Optional fields (daily_volume_kg, season, skill_level, timeline_days) are never required.
def _compute_missing(c: dict) -> list[str]:
    missing = []
    if c.get("budget_inr") is None:
        missing.append("budget_inr")
    if not c.get("location_state") and not c.get("climate"):
        missing.append("location_state")
    return missing


# ── Webhook verification ─────────────────────────────────────────────────────

@router.get("/whatsapp/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_verify_token:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


# ── Incoming message handler ─────────────────────────────────────────────────

@router.post("/whatsapp/webhook")
async def receive_message(request: Request):
    body = await request.json()

    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])
            phone_number_id = value.get("metadata", {}).get("phone_number_id", "")

            for message in messages:
                await _handle_message(message, phone_number_id)

    # Always return 200 quickly — Meta retries if you don't
    return {"status": "ok"}


async def _handle_message(message: dict, phone_number_id: str):
    from app.db import AsyncSessionLocal

    sender = message.get("from", "")
    msg_type = message.get("type", "text")

    try:
        text_input = ""
        image_base64 = None

        if msg_type == "text":
            text_input = message.get("text", {}).get("body", "")

        elif msg_type == "image":
            media_id = message.get("image", {}).get("id", "")
            caption = message.get("image", {}).get("caption", "")
            img_bytes, mime_type = await _download_meta_media(media_id)
            image_base64 = base64.b64encode(img_bytes).decode()
            text_input = caption or "I have these materials available. What can I build?"

        elif msg_type in ("audio", "voice"):
            media_id = message.get("audio", {}).get("id", "")
            audio_bytes, mime_type = await _download_meta_media(media_id)
            text_input = await transcribe_audio(audio_bytes, mime_type)
            if not text_input.strip():
                await _send_whatsapp_message(
                    phone_number_id, sender,
                    "Sorry, I couldn't understand the audio. Please try again or type your message."
                )
                return

        else:
            await _send_whatsapp_message(
                phone_number_id, sender,
                "Sorry, I only understand text, voice messages, and images right now."
            )
            return

        if not text_input.strip():
            return

        # Detect language from the user's message
        language = _detect_language(text_input)

        # Build full conversation context so follow-up one-word replies have context
        prior_session = _get_session(sender)
        prior_messages = prior_session.get("messages", [])
        if prior_messages:
            extraction_context = "\n".join(prior_messages) + "\n" + text_input
        else:
            extraction_context = text_input

        # Extract constraints from the full conversation context (not just current message)
        try:
            new_constraints = await extract_constraints(extraction_context, image_base64)
        except Exception as e:
            logger.warning("Constraint extraction failed: %s", e)
            new_constraints = Constraints()

        # Merge with session and compute what's still missing
        merged_dict, all_messages, language = _update_session(sender, new_constraints.model_dump(), text_input, language)
        missing = _compute_missing(merged_dict)

        if missing:
            question = _build_question(missing[:2], language)
            await _send_whatsapp_message(phone_number_id, sender, question)
            return

        # All critical constraints present — build final Constraints and generate
        final_constraints = Constraints(**{**merged_dict, "missing_constraints": []})
        conversation_history = "\n".join(all_messages[:-1]) if len(all_messages) > 1 else ""

        async with AsyncSessionLocal() as db:
            cases = await retrieve_cases(final_constraints, db)
            solution = await generate_solution(final_constraints, cases, conversation_history, language)
            validation = validate(solution, final_constraints)

            if not validation.passed and validation.retry_prompt_addition:
                from app.pipeline.generator import GENERATE_SYSTEM, _build_user_prompt
                from app.llm.anthropic_client import get_client
                client = get_client()
                patched = _build_user_prompt(final_constraints, cases, language=language) + validation.retry_prompt_addition
                resp = await client.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=4096,
                    system=GENERATE_SYSTEM,
                    messages=[{"role": "user", "content": patched}],
                )
                raw = resp.content[0].text.strip()
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

        for part in _split_for_whatsapp(solution, language):
            await _send_whatsapp_message(phone_number_id, sender, part)

        # Clear session after successful solution
        _clear_session(sender)

    except Exception as e:
        logger.exception("Error handling WhatsApp message from %s", sender)
        lang = _get_session(sender).get("lang", "hinglish")
        err = _ERROR_MSG.get(lang, _ERROR_MSG["hinglish"])
        await _send_whatsapp_message(phone_number_id, sender, f"{err} ({str(e)[:80]})")


# ── Meta Graph API helpers ───────────────────────────────────────────────────

async def _download_meta_media(media_id: str) -> tuple[bytes, str]:
    headers = {"Authorization": f"Bearer {settings.whatsapp_access_token}"}
    async with httpx.AsyncClient() as client:
        meta_resp = await client.get(f"{GRAPH_API_URL}/{media_id}", headers=headers)
        meta_resp.raise_for_status()
        media_info = meta_resp.json()

        file_resp = await client.get(media_info["url"], headers=headers)
        file_resp.raise_for_status()

        mime_type = media_info.get("mime_type", "application/octet-stream")
        return file_resp.content, mime_type


async def _send_whatsapp_message(phone_number_id: str, to: str, text: str):
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": text[:4096]},
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GRAPH_API_URL}/{phone_number_id}/messages",
            headers=headers,
            json=payload,
        )
        if resp.status_code >= 400:
            logger.error("WhatsApp send failed: %s %s", resp.status_code, resp.text)


# ── Formatting ───────────────────────────────────────────────────────────────

def _split_for_whatsapp(solution, language: str = "hinglish") -> list[str]:
    """Return 3 message parts so WhatsApp doesn't show a wall of text."""
    L = _LABELS.get(language, _LABELS["hinglish"])

    # Part 1: title + summary
    part1 = f"*{solution.title}*\n\n{solution.summary}"

    # Part 2: materials BOM
    mat_lines = [L["materials"].format(cost=f"{solution.total_cost_inr:.0f}")]
    for m in solution.materials:
        mat_lines.append(f"• {m.item} — ₹{m.cost_inr:.0f} ({m.source})")
    part2 = "\n".join(mat_lines)

    # Part 3: steps + outcome + notes
    step_lines = [L["steps"]]
    for i, step in enumerate(solution.build_steps, 1):
        step_lines.append(f"{i}. {step}")
    step_lines.append(f"\n{L['result']} {solution.expected_outcome}")
    if solution.failure_modes:
        step_lines.append(f"\n{L['failure']} {solution.failure_modes[0]}")
    if solution.skill_check:
        step_lines.append(f"\n⚠️ {solution.skill_check}")
    part3 = "\n".join(step_lines)

    return [p[:4096] for p in (part1, part2, part3)]


def _build_question(missing_fields: list[str], language: str = "hinglish") -> str:
    Q = _QUESTIONS.get(language, _QUESTIONS["hinglish"])
    return " | ".join(Q.get(f, f"Please provide: {f}") for f in missing_fields)
