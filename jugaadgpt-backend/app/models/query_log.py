import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(100), index=True)
    user_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("users.id"), nullable=True, index=True, default=None
    )
    raw_input: Mapped[str] = mapped_column(Text)
    constraints_json: Mapped[str] = mapped_column(Text, default="{}")
    retrieved_case_ids: Mapped[str] = mapped_column(Text, default="[]")  # JSON list
    solution_json: Mapped[str] = mapped_column(Text, default="{}")
    validator_passed: Mapped[bool] = mapped_column(default=True)
    retry_count: Mapped[int] = mapped_column(default=0)
    latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    channel: Mapped[str] = mapped_column(String(50), default="web")  # web | whatsapp
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
