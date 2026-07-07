"""merge donor/receiver roles into single user role

Revision ID: 0005_merge_donor_receiver
Revises: 0004_inst_approval_flow
Create Date: 2026-07-07 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision: str = "0005_merge_donor_receiver"
down_revision: Union[str, None] = "0004_inst_approval_flow"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PG_ENUM = "user_role"


def _enum_has_value(bind, enum_name: str, value: str) -> bool:
    result = bind.execute(
        sa.text(
            "SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid"
            " WHERE t.typname = :enum AND e.enumlabel = :val"
        ),
        {"enum": enum_name, "val": value},
    )
    return result.first() is not None


def upgrade() -> None:
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # 1. Add USER to PostgreSQL enum
    #    PostgreSQL requires ALTER TYPE ... ADD VALUE to be outside a transaction
    #    because new enum values can't be referenced until committed.
    if is_pg:
        with op.get_context().autocommit_block():
            if not _enum_has_value(op.get_bind(), PG_ENUM, "USER"):
                op.execute(f"ALTER TYPE {PG_ENUM} ADD VALUE 'USER'")

    # 2. Migrate any existing DONOR/RECEIVER users to USER
    if is_pg and _enum_has_value(bind, PG_ENUM, "DONOR"):
        op.execute("UPDATE users SET role = 'USER' WHERE role IN ('DONOR', 'RECEIVER')")

    # 3. Drop receiver_profiles table (may already be gone from a partial run)
    inspector = inspect(bind)
    if "receiver_profiles" in inspector.get_table_names():
        op.drop_index("ix_receiver_profiles_user_id", table_name="receiver_profiles")
        op.drop_table("receiver_profiles")
    else:
        op.execute("DROP INDEX IF EXISTS ix_receiver_profiles_user_id")

    # Note: We do NOT DROP VALUE 'DONOR' / 'RECEIVER' from the enum because
    # PostgreSQL 16 does not support ALTER TYPE ... DROP VALUE (requires PG17+).
    # The unused enum values remain in the type definition but are never assigned.


def downgrade() -> None:
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # 1. Re-create receiver_profiles table (only if it doesn't exist)
    inspector = inspect(bind)
    if "receiver_profiles" not in inspector.get_table_names():
        op.create_table(
            "receiver_profiles",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
            sa.Column("city", sa.String(length=120), nullable=True),
            sa.Column("area", sa.String(length=120), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_receiver_profiles_user_id", "receiver_profiles", ["user_id"], unique=True)
