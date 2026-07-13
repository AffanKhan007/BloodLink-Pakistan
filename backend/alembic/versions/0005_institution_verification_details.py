"""institution verification details

Revision ID: 0005_inst_verify_details
Revises: 0004_inst_approval_flow
Create Date: 2026-07-13 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_inst_verify_details"
down_revision: Union[str, None] = "0004_inst_approval_flow"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE institution_status ADD VALUE IF NOT EXISTS 'PENDING'")
        op.execute("UPDATE institutions SET status = 'PENDING' WHERE status = 'PENDING_APPROVAL'")
        op.execute("ALTER TABLE institutions ALTER COLUMN status SET DEFAULT 'PENDING'")
    else:
        op.execute("UPDATE institutions SET status = 'PENDING' WHERE status = 'PENDING_APPROVAL'")

    op.add_column("institutions", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("institutions", sa.Column("approved_by_user_id", sa.Integer(), nullable=True))
    op.add_column("institutions", sa.Column("status_changed_by_user_id", sa.Integer(), nullable=True))
    op.add_column("institutions", sa.Column("operating_hours", sa.String(length=120), nullable=True))
    op.create_foreign_key(
        "fk_institutions_approved_by_user_id_users",
        "institutions",
        "users",
        ["approved_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_institutions_status_changed_by_user_id_users",
        "institutions",
        "users",
        ["status_changed_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_institutions_status_changed_by_user_id_users", "institutions", type_="foreignkey")
    op.drop_constraint("fk_institutions_approved_by_user_id_users", "institutions", type_="foreignkey")
    op.drop_column("institutions", "operating_hours")
    op.drop_column("institutions", "status_changed_by_user_id")
    op.drop_column("institutions", "approved_by_user_id")
    op.drop_column("institutions", "approved_at")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("UPDATE institutions SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING'")
        op.execute("ALTER TABLE institutions ALTER COLUMN status SET DEFAULT 'PENDING_APPROVAL'")
    else:
        op.execute("UPDATE institutions SET status = 'PENDING_APPROVAL' WHERE status = 'PENDING'")
