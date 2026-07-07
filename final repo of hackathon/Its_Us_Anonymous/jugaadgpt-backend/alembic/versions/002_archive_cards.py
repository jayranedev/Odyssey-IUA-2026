"""add archive_cards table

Revision ID: 002
Revises: 001
Create Date: 2026-04-25
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "archive_cards",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(100), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("status", sa.String(100), nullable=False),
        sa.Column("status_color", sa.String(100), default="bg-primary"),
        sa.Column("annotation", sa.Text(), nullable=False),
        sa.Column("image", sa.String(500), default=""),
        sa.Column("rotation", sa.String(50), default="rotate-1"),
        sa.Column("bg_color", sa.String(100), default="bg-white"),
        sa.Column("starred", sa.Boolean(), default=False),
        sa.Column("solution_json", sa.Text(), default="{}"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_archive_cards_session_id", "archive_cards", ["session_id"])


def downgrade() -> None:
    op.drop_table("archive_cards")
