"""reports moderation schema

Revision ID: 0007_reports_moderation
Revises: 0006_merge_inst_user_heads
Create Date: 2026-07-16 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_reports_moderation"
down_revision: Union[str, None] = "0006_merge_inst_user_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    for idx in ["ix_reports_status", "ix_reports_request_id", "ix_reports_reported_user_id", "ix_reports_reporter_user_id"]:
        try:
            op.drop_index(idx, table_name="reports")
        except Exception:
            pass

    try:
        op.drop_table("reports")
    except Exception:
        pass

    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS report_status")

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reporter_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reported_type", sa.String(length=32), nullable=False),
        sa.Column("reported_id", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=32), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("evidence_file", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"], unique=False)
    op.create_index("ix_reports_reported_type", "reports", ["reported_type"], unique=False)
    op.create_index("ix_reports_reported_id", "reports", ["reported_id"], unique=False)
    op.create_index("ix_reports_status", "reports", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_reported_id", table_name="reports")
    op.drop_index("ix_reports_reported_type", table_name="reports")
    op.drop_index("ix_reports_reporter_id", table_name="reports")
    op.drop_table("reports")

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reporter_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reported_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_reporter_user_id", "reports", ["reporter_user_id"], unique=False)
    op.create_index("ix_reports_reported_user_id", "reports", ["reported_user_id"], unique=False)
    op.create_index("ix_reports_request_id", "reports", ["request_id"], unique=False)
    op.create_index("ix_reports_status", "reports", ["status"], unique=False)
