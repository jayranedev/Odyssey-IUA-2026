import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ArchiveCard(Base):
    __tablename__ = "archive_cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(100), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(100))
    status_color: Mapped[str] = mapped_column(String(100), default="bg-primary")
    annotation: Mapped[str] = mapped_column(Text)
    image: Mapped[str] = mapped_column(String(500), default="")
    rotation: Mapped[str] = mapped_column(String(50), default="rotate-1")
    bg_color: Mapped[str] = mapped_column(String(100), default="bg-white")
    starred: Mapped[bool] = mapped_column(Boolean, default=False)
    solution_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
