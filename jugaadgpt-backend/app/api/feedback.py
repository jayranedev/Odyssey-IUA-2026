from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import AuthUser, get_current_user_optional
from app.db import get_db
from app.models.feedback import Feedback

router = APIRouter()


class FeedbackRequest(BaseModel):
    query_log_id: str
    session_id: str
    rating: str  # worked | partial | didnt_work
    notes: str = ""


@router.post("/feedback")
async def submit_feedback(
    body: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
    user: AuthUser | None = Depends(get_current_user_optional),
):
    fb = Feedback(
        query_log_id=body.query_log_id,
        session_id=body.session_id,
        user_id=user.id if user else None,
        rating=body.rating,
        notes=body.notes,
    )
    db.add(fb)
    await db.commit()
    return {"status": "ok"}
