from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.feedback import Feedback

router = APIRouter()


class FeedbackRequest(BaseModel):
    query_log_id: str
    session_id: str
    rating: str  # worked | partial | didnt_work
    notes: str = ""


@router.post("/feedback")
async def submit_feedback(body: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    fb = Feedback(
        query_log_id=body.query_log_id,
        session_id=body.session_id,
        rating=body.rating,
        notes=body.notes,
    )
    db.add(fb)
    await db.commit()
    return {"status": "ok"}
