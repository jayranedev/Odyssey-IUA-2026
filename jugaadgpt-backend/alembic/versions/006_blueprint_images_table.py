"""create blueprint_images table

Revision ID: 006
Revises: 005
Create Date: 2026-04-26
"""

import sqlalchemy as sa
from alembic import op

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "blueprint_images",
        sa.Column("title", sa.String(500), primary_key=True),
        sa.Column("image_base64", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("blueprint_images")
