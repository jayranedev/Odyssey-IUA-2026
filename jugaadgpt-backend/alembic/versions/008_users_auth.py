"""users table + user_id/device_id ownership columns on chat_sessions

Revision ID: 008
Revises: 007
Create Date: 2026-07-07
"""

import sqlalchemy as sa
from alembic import op

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),  # Supabase JWT sub
        sa.Column("email", sa.String(320), server_default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.add_column("chat_sessions", sa.Column("user_id", sa.String(), nullable=True))
    op.add_column("chat_sessions", sa.Column("device_id", sa.String(64), nullable=True))
    op.create_foreign_key(
        "fk_chat_sessions_user_id", "chat_sessions", "users", ["user_id"], ["id"]
    )
    op.create_index("idx_chat_sessions_user_id", "chat_sessions", ["user_id"])
    op.create_index("idx_chat_sessions_device_id", "chat_sessions", ["device_id"])


def downgrade() -> None:
    op.drop_index("idx_chat_sessions_device_id", table_name="chat_sessions")
    op.drop_index("idx_chat_sessions_user_id", table_name="chat_sessions")
    op.drop_constraint("fk_chat_sessions_user_id", "chat_sessions", type_="foreignkey")
    op.drop_column("chat_sessions", "device_id")
    op.drop_column("chat_sessions", "user_id")
    op.drop_table("users")
