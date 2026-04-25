import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.archive_card import ArchiveCard

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


@router.post("")
async def create_card(body: ArchiveCardIn, db: AsyncSession = Depends(get_db)):
    card = ArchiveCard(
        id=body.id or str(uuid.uuid4()),
        session_id=body.session_id,
        title=body.title,
        status=body.status,
        status_color=body.status_color,
        annotation=body.annotation,
        image=body.image,
        rotation=body.rotation,
        bg_color=body.bg_color,
        starred=body.starred,
        solution_json=body.solution_json,
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card


@router.get("")
async def list_cards(session_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(ArchiveCard).order_by(ArchiveCard.created_at.desc())
    if session_id:
        q = q.where(ArchiveCard.session_id == session_id)
    result = await db.execute(q)
    return result.scalars().all()


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
