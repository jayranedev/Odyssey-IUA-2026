"""add image_base64 to archive_cards

Revision ID: 004
Revises: 003
Create Date: 2026-04-26
"""

import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "archive_cards",
        sa.Column("image_base64", sa.Text(), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("archive_cards", "image_base64")
