import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20))          # user | assistant
    type: Mapped[str] = mapped_column(String(30))          # user | solution | clarification | error
    content_json: Mapped[str] = mapped_column(Text)        # full JSON of the message payload
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
