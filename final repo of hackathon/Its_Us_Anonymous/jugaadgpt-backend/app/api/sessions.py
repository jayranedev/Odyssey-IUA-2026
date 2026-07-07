"""
GET  /api/sessions            — list all sessions (newest first)
POST /api/sessions            — upsert a session (create or update title/lang)
GET  /api/sessions/{id}       — get session + all messages
DELETE /api/sessions/{id}     — delete session + its messages + blueprints

POST /api/sessions/{id}/messages  — append a message to a session
GET  /api/sessions/{id}/blueprints — get blueprints for a session
GET  /api/blueprints               — list all blueprints (newest first)
"""

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.blueprint import Blueprint
from app.models.blueprint_image import BlueprintImage
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession

router = APIRouter(tags=["sessions"])


# ── Schemas ────────────────────────────────────────────────────

class SessionUpsert(BaseModel):
    id: str
    title: str = "New Chat"
    lang: str = "hinglish"


class MessageIn(BaseModel):
    role: str           # user | assistant
    type: str           # user | solution | clarification | error
    content_json: str   # JSON string of the message payload


class BlueprintIn(BaseModel):
    session_id: str
    title: str
    topic: str = ""
    steps_json: str = "[]"
    materials_json: str = "[]"
    expected_outcome: str = ""
    total_cost_inr: float = 0.0


# ── Session endpoints ──────────────────────────────────────────

@router.get("/sessions")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).order_by(ChatSession.updated_at.desc()).limit(100)
    )
    return result.scalars().all()


@router.post("/sessions")
async def upsert_session(body: SessionUpsert, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, body.id)
    if session:
        session.title = body.title
        session.lang = body.lang
        session.updated_at = datetime.utcnow()
    else:
        session = ChatSession(id=body.id, title=body.title, lang=body.lang)
        db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await db.get(ChatSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    msgs = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = msgs.scalars().all()
    return {"session": session, "messages": messages}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.execute(delete(Blueprint).where(Blueprint.session_id == session_id))
    session = await db.get(ChatSession, session_id)
    if session:
        await db.delete(session)
    await db.commit()
    return {"deleted": session_id}


# ── Message endpoints ──────────────────────────────────────────

@router.post("/sessions/{session_id}/messages")
async def add_message(session_id: str, body: MessageIn, db: AsyncSession = Depends(get_db)):
    msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role=body.role,
        type=body.type,
        content_json=body.content_json,
    )
    db.add(msg)

    # bump session message_count + updated_at
    session = await db.get(ChatSession, session_id)
    if session:
        session.message_count = (session.message_count or 0) + 1
        session.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(msg)
    return msg


# ── Blueprint endpoints ────────────────────────────────────────

@router.get("/blueprints")
async def list_blueprints(session_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Blueprint).order_by(Blueprint.created_at.desc())
    if session_id:
        q = q.where(Blueprint.session_id == session_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/sessions/{session_id}/blueprints")
async def session_blueprints(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Blueprint)
        .where(Blueprint.session_id == session_id)
        .order_by(Blueprint.created_at.asc())
    )
    return result.scalars().all()


@router.get("/blueprint-image")
async def get_blueprint_image(title: str, db: AsyncSession = Depends(get_db)):
    """Return cached image_base64 from blueprint_images table."""
    row = await db.get(BlueprintImage, title)
    return {"image_base64": row.image_base64 if row else ""}


@router.post("/blueprint-image")
async def save_blueprint_image(body: dict, db: AsyncSession = Depends(get_db)):
    """Upsert blueprint image by title — always saves, no session dependency."""
    title = (body.get("title") or "").strip()
    b64 = (body.get("image_base64") or "").strip()
    if not title or not b64:
        return {"ok": False}

    row = await db.get(BlueprintImage, title)
    if row:
        row.image_base64 = b64
        row.updated_at = datetime.utcnow()
    else:
        row = BlueprintImage(title=title, image_base64=b64)
        db.add(row)

    await db.commit()
    return {"ok": True}


@router.post("/blueprints")
async def upsert_blueprint(body: BlueprintIn, db: AsyncSession = Depends(get_db)):
    """
    Upsert: if a blueprint with the same session_id + topic already exists, update it
    (keeps the most refined version). Otherwise create a new one.
    """
    existing = None
    if body.topic:
        result = await db.execute(
            select(Blueprint).where(
                Blueprint.session_id == body.session_id,
                Blueprint.topic == body.topic,
            )
        )
        existing = result.scalars().first()

    if existing:
        existing.title = body.title
        existing.steps_json = body.steps_json
        existing.materials_json = body.materials_json
        existing.expected_outcome = body.expected_outcome
        existing.total_cost_inr = body.total_cost_inr
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing

    bp = Blueprint(
        id=str(uuid.uuid4()),
        session_id=body.session_id,
        title=body.title,
        topic=body.topic,
        steps_json=body.steps_json,
        materials_json=body.materials_json,
        expected_outcome=body.expected_outcome,
        total_cost_inr=body.total_cost_inr,
    )
    db.add(bp)
    await db.commit()
    await db.refresh(bp)
    return bp
