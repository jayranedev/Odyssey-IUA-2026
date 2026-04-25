"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "jugaad_cases",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("problem_type", sa.String(100), nullable=False),
        sa.Column("problem_description", sa.Text(), nullable=False),
        sa.Column("solution_summary", sa.Text(), nullable=False),
        sa.Column("materials_json", sa.Text(), nullable=False),
        sa.Column("build_steps_json", sa.Text(), nullable=False),
        sa.Column("total_cost_inr", sa.Float(), nullable=False),
        sa.Column("climate_tags", sa.String(255), default=""),
        sa.Column("region_tags", sa.String(255), default=""),
        sa.Column("power_required", sa.Boolean(), default=False),
        sa.Column("skill_level", sa.String(50), default="basic"),
        sa.Column("source_url", sa.String(500), default=""),
        sa.Column("failure_modes", sa.Text(), default=""),
        sa.Column("embedding", Vector(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_jugaad_cases_problem_type", "jugaad_cases", ["problem_type"])

    op.create_table(
        "query_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(100), nullable=False, index=True),
        sa.Column("raw_input", sa.Text(), nullable=False),
        sa.Column("constraints_json", sa.Text(), default="{}"),
        sa.Column("retrieved_case_ids", sa.Text(), default="[]"),
        sa.Column("solution_json", sa.Text(), default="{}"),
        sa.Column("validator_passed", sa.Boolean(), default=True),
        sa.Column("retry_count", sa.Integer(), default=0),
        sa.Column("latency_ms", sa.Float(), default=0.0),
        sa.Column("channel", sa.String(50), default="web"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "feedback",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("query_log_id", sa.String(), nullable=False, index=True),
        sa.Column("session_id", sa.String(100), nullable=False),
        sa.Column("rating", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text(), default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("query_logs")
    op.drop_table("jugaad_cases")
