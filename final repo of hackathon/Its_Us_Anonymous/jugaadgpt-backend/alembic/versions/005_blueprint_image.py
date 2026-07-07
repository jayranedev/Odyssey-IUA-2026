"""add image_base64 to blueprints

Revision ID: 005
Revises: 004
Create Date: 2026-04-26
"""

import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "blueprints",
        sa.Column("image_base64", sa.Text(), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("blueprints", "image_base64")
