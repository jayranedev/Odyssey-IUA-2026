"""switch jugaad_cases embedding to the configured embedding dimension

Dimension resolution matches app.config: explicit EMBEDDING_DIM wins,
otherwise 768 for EMBEDDING_PROVIDER=gemini (text-embedding-004, default)
or 384 for provider=local (bge-small-en-v1.5). Existing embeddings are
dropped — run scripts/reembed_cases.py afterwards to repopulate.

Revision ID: 007
Revises: 006
Create Date: 2026-07-07
"""

import os

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None

_provider = os.environ.get("EMBEDDING_PROVIDER", "gemini")
EMBEDDING_DIM = int(os.environ.get("EMBEDDING_DIM", "0")) or (768 if _provider == "gemini" else 384)


def upgrade() -> None:
    # Drop any vector index on the embedding column (none in 001, but be safe)
    op.execute("DROP INDEX IF EXISTS idx_jugaad_cases_embedding")
    op.drop_column("jugaad_cases", "embedding")
    op.add_column("jugaad_cases", sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True))
    # HNSW cosine index — pgvector ≥0.5 (pgvector/pgvector:pg16 image ships it)
    op.execute(
        "CREATE INDEX idx_jugaad_cases_embedding ON jugaad_cases "
        "USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_jugaad_cases_embedding")
    op.drop_column("jugaad_cases", "embedding")
    op.add_column("jugaad_cases", sa.Column("embedding", Vector(1024), nullable=True))
