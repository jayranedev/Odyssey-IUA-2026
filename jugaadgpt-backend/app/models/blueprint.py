import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Blueprint(Base):
    __tablename__ = "blueprints"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255))
    topic: Mapped[str] = mapped_column(String(255), default="")     # problem_type / topic key for dedup
    steps_json: Mapped[str] = mapped_column(Text, default="[]")     # JSON array of step strings
    materials_json: Mapped[str] = mapped_column(Text, default="[]") # JSON array of material objects
    expected_outcome: Mapped[str] = mapped_column(Text, default="")
    total_cost_inr: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
