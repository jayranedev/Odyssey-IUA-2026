"""add chat_sessions, chat_messages, blueprints tables

Revision ID: 003
Revises: 002
Create Date: 2026-04-26
"""

import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False, server_default="New Chat"),
        sa.Column("lang", sa.String(50), server_default="hinglish"),
        sa.Column("message_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(100), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("content_json", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_chat_messages_session_id", "chat_messages", ["session_id"])

    op.create_table(
        "blueprints",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(100), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("topic", sa.String(255), server_default=""),
        sa.Column("steps_json", sa.Text(), server_default="[]"),
        sa.Column("materials_json", sa.Text(), server_default="[]"),
        sa.Column("expected_outcome", sa.Text(), server_default=""),
        sa.Column("total_cost_inr", sa.Float(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("idx_blueprints_session_id", "blueprints", ["session_id"])


def downgrade() -> None:
    op.drop_table("blueprints")
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
