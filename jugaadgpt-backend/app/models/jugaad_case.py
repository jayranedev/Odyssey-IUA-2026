import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.config import settings
from app.db import Base


class JugaadCase(Base):
    __tablename__ = "jugaad_cases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))
    problem_type: Mapped[str] = mapped_column(String(100))
    problem_description: Mapped[str] = mapped_column(Text)
    solution_summary: Mapped[str] = mapped_column(Text)
    materials_json: Mapped[str] = mapped_column(Text)  # JSON string of [{item, cost_inr, source}]
    build_steps_json: Mapped[str] = mapped_column(Text)  # JSON string of steps
    total_cost_inr: Mapped[float] = mapped_column(Float)
    climate_tags: Mapped[str] = mapped_column(String(255), default="")  # comma-separated
    region_tags: Mapped[str] = mapped_column(String(255), default="")
    power_required: Mapped[bool] = mapped_column(default=False)
    skill_level: Mapped[str] = mapped_column(String(50), default="basic")
    source_url: Mapped[str] = mapped_column(String(500), default="")
    failure_modes: Mapped[str] = mapped_column(Text, default="")
    embedding: Mapped[list[float]] = mapped_column(Vector(settings.embedding_dim), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
