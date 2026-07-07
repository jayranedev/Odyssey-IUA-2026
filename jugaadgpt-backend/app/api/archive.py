import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthUser, get_current_user_optional
from app.db import AsyncSessionLocal, get_db
from app.models.archive_card import ArchiveCard

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/archive", tags=["archive"])


class ArchiveCardIn(BaseModel):
    id: str | None = None
    session_id: str | None = None
    title: str
    status: str
    status_color: str = "bg-primary"
    annotation: str
    image: str = ""
    rotation: str = "rotate-1"
    bg_color: str = "bg-white"
    starred: bool = False
    solution_json: str = "{}"


class ArchiveCardPatch(BaseModel):
    title: str | None = None
    status: str | None = None
    status_color: str | None = None
    annotation: str | None = None
    image: str | None = None
    rotation: str | None = None
    bg_color: str | None = None
    starred: bool | None = None
    image_base64: str | None = None


# ── Background image generator ──────────────────────────────────────────────

async def _generate_and_store_image(card_id: str, prompt: str):
    from app.services.image_gen import generate_image_base64
    try:
        b64 = await generate_image_base64(prompt)
        if not b64:
            return
        async with AsyncSessionLocal() as db:
            card = await db.get(ArchiveCard, card_id)
            if card:
                card.image_base64 = b64
                await db.commit()
                logger.info("Archive image generated for card %s", card_id)
    except Exception as exc:
        logger.warning("Archive image generation failed for %s: %s", card_id, exc)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("")
async def create_card(
    body: ArchiveCardIn,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # If image is a base64 data URI, route it to image_base64 (image column is VARCHAR 500)
    image_url = body.image or ""
    image_b64 = ""
    if image_url.startswith("data:image"):
        image_b64 = image_url.split(",", 1)[1] if "," in image_url else ""
        image_url = ""

    card = ArchiveCard(
        id=body.id or str(uuid.uuid4()),
        session_id=body.session_id,
        title=body.title,
        status=body.status,
        status_color=body.status_color,
        annotation=body.annotation,
        image=image_url[:500],
        rotation=body.rotation,
        bg_color=body.bg_color,
        starred=body.starred,
        solution_json=body.solution_json,
        image_base64=image_b64,
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)

    img_prompt = (
        f"Jugaad DIY solution: {body.title}. "
        "Rustic hand-drawn schematic, Indian village style, blueprint paper background, no text"
    )
    background_tasks.add_task(_generate_and_store_image, card.id, img_prompt)

    return card


@router.get("")
async def list_cards(
    session_id: str | None = None, 
    user: AuthUser | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    q = select(ArchiveCard).order_by(ArchiveCard.created_at.desc())
    if user and user.user_id:
        from app.models.chat_session import ChatSession
        q = q.join(ChatSession, ArchiveCard.session_id == ChatSession.id)
        q = q.where(ChatSession.user_id == user.user_id)
    elif session_id:
        q = q.where(ArchiveCard.session_id == session_id)
    else:
        return []
    
    result = await db.execute(q)
    return result.scalars().all()


# Static route MUST come before /{card_id} so FastAPI doesn't treat "generate-images" as an id
@router.get("/generate-images")
async def generate_missing_images(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Queue image generation for every archive card that doesn't have one yet."""
    result = await db.execute(
        select(ArchiveCard).where(ArchiveCard.image_base64 == "")
    )
    cards = result.scalars().all()
    for card in cards:
        prompt = (
            f"Jugaad DIY solution: {card.title}. "
            "Rustic hand-drawn schematic, Indian village style, blueprint paper background, no text"
        )
        background_tasks.add_task(_generate_and_store_image, card.id, prompt)
    return {"queued": len(cards)}


@router.get("/{card_id}")
async def get_card(card_id: str, db: AsyncSession = Depends(get_db)):
    card = await db.get(ArchiveCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    return card


@router.patch("/{card_id}")
async def update_card(card_id: str, body: ArchiveCardPatch, db: AsyncSession = Depends(get_db)):
    card = await db.get(ArchiveCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    await db.commit()
    await db.refresh(card)
    return card


@router.delete("/{card_id}")
async def delete_card(card_id: str, db: AsyncSession = Depends(get_db)):
    card = await db.get(ArchiveCard, card_id)
    if not card:
        raise HTTPException(404, "Card not found")
    await db.delete(card)
    await db.commit()
    return {"deleted": card_id}
