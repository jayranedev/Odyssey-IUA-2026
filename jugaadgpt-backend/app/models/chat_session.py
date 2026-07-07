import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), default="New Chat")
    lang: Mapped[str] = mapped_column(String(50), default="hinglish")
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    # Owner (Supabase user) — NULL for anonymous sessions
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True, index=True, default=None
    )
    # Anonymous device UUID (X-Device-Id header) — lets a login "claim" past chats
    device_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
