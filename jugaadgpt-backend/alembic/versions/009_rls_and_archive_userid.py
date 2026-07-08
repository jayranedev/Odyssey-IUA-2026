"""Add user_id to archive_cards, query_logs, feedback + enable RLS on all tables

Revision ID: 009
Revises: 008
Create Date: 2026-07-08
"""

import sqlalchemy as sa
from alembic import op

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


# Tables that need RLS + the policies for each.
# Our FastAPI backend connects via the Postgres superuser / service role,
# so RLS does NOT block backend queries.  These policies protect against
# direct access via the Supabase anon/authenticated client.

def upgrade() -> None:
    # ── 1. Schema changes: add user_id columns ──────────────────────
    op.add_column("archive_cards", sa.Column("user_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_archive_cards_user_id", "archive_cards", "users", ["user_id"], ["id"]
    )
    op.create_index("idx_archive_cards_user_id", "archive_cards", ["user_id"])

    op.add_column("query_logs", sa.Column("user_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_query_logs_user_id", "query_logs", "users", ["user_id"], ["id"]
    )
    op.create_index("idx_query_logs_user_id", "query_logs", ["user_id"])

    op.add_column("feedback", sa.Column("user_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_feedback_user_id", "feedback", "users", ["user_id"], ["id"]
    )
    op.create_index("idx_feedback_user_id", "feedback", ["user_id"])

    # ── 2. Enable RLS on all user-facing tables ─────────────────────
    rls_tables = [
        "users",
        "chat_sessions",
        "chat_messages",
        "archive_cards",
        "blueprints",
        "query_logs",
        "feedback",
        "jugaad_cases",
        "blueprint_images",
    ]
    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")

    # ── 3. RLS policies ─────────────────────────────────────────────

    # -- users: read/update own row only
    op.execute("""
        CREATE POLICY users_own_access ON users
        FOR ALL USING (auth.uid()::text = id)
        WITH CHECK (auth.uid()::text = id)
    """)

    # -- chat_sessions: owner access by user_id; device_id sessions are
    #    handled by the backend (anonymous users don't use Supabase client)
    op.execute("""
        CREATE POLICY sessions_owner_access ON chat_sessions
        FOR ALL USING (auth.uid()::text = user_id)
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # -- chat_messages: access via session ownership
    op.execute("""
        CREATE POLICY messages_via_session ON chat_messages
        FOR ALL USING (
            session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()::text)
        )
        WITH CHECK (
            session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()::text)
        )
    """)

    # -- archive_cards: owner access by user_id
    op.execute("""
        CREATE POLICY archive_owner_access ON archive_cards
        FOR ALL USING (auth.uid()::text = user_id)
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # -- blueprints: access via session ownership
    op.execute("""
        CREATE POLICY blueprints_via_session ON blueprints
        FOR ALL USING (
            session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()::text)
        )
        WITH CHECK (
            session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()::text)
        )
    """)

    # -- query_logs: owner access
    op.execute("""
        CREATE POLICY query_logs_owner ON query_logs
        FOR ALL USING (auth.uid()::text = user_id)
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # -- feedback: owner access
    op.execute("""
        CREATE POLICY feedback_owner ON feedback
        FOR ALL USING (auth.uid()::text = user_id)
        WITH CHECK (auth.uid()::text = user_id)
    """)

    # -- jugaad_cases: public read (reference data)
    op.execute("""
        CREATE POLICY jugaad_cases_public_read ON jugaad_cases
        FOR SELECT USING (true)
    """)

    # -- blueprint_images: public read/write (shared cache, no user-scoping)
    op.execute("""
        CREATE POLICY blueprint_images_public ON blueprint_images
        FOR ALL USING (true)
        WITH CHECK (true)
    """)


def downgrade() -> None:
    # Drop all policies
    policies = [
        ("users", "users_own_access"),
        ("chat_sessions", "sessions_owner_access"),
        ("chat_messages", "messages_via_session"),
        ("archive_cards", "archive_owner_access"),
        ("blueprints", "blueprints_via_session"),
        ("query_logs", "query_logs_owner"),
        ("feedback", "feedback_owner"),
        ("jugaad_cases", "jugaad_cases_public_read"),
        ("blueprint_images", "blueprint_images_public"),
    ]
    for table, policy in policies:
        op.execute(f"DROP POLICY IF EXISTS {policy} ON {table}")

    # Disable RLS
    rls_tables = [
        "users", "chat_sessions", "chat_messages", "archive_cards",
        "blueprints", "query_logs", "feedback", "jugaad_cases", "blueprint_images",
    ]
    for table in rls_tables:
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    # Drop columns
    op.drop_index("idx_feedback_user_id", table_name="feedback")
    op.drop_constraint("fk_feedback_user_id", "feedback", type_="foreignkey")
    op.drop_column("feedback", "user_id")

    op.drop_index("idx_query_logs_user_id", table_name="query_logs")
    op.drop_constraint("fk_query_logs_user_id", "query_logs", type_="foreignkey")
    op.drop_column("query_logs", "user_id")

    op.drop_index("idx_archive_cards_user_id", table_name="archive_cards")
    op.drop_constraint("fk_archive_cards_user_id", "archive_cards", type_="foreignkey")
    op.drop_column("archive_cards", "user_id")
