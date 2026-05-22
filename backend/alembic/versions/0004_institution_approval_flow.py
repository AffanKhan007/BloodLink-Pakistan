"""institution approval flow

Revision ID: 0004_inst_approval_flow
Revises: 0003_msg_institutions_cities
Create Date: 2026-05-22 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_inst_approval_flow"
down_revision: Union[str, None] = "0003_msg_institutions_cities"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    institution_status = sa.Enum(
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
        name="institution_status",
    )
    bind = op.get_bind()
    institution_status.create(bind, checkfirst=True)

    op.add_column("institutions", sa.Column("contact_person_designation", sa.String(length=120), nullable=True))
    op.add_column("institutions", sa.Column("website_social_link", sa.String(length=255), nullable=True))
    op.add_column("institutions", sa.Column("proof_document_url", sa.String(length=255), nullable=True))
    op.add_column(
        "institutions",
        sa.Column("status", institution_status, nullable=False, server_default="APPROVED"),
    )
    op.add_column("institutions", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.create_index("ix_institutions_status", "institutions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_institutions_status", table_name="institutions")
    op.drop_column("institutions", "rejection_reason")
    op.drop_column("institutions", "status")
    op.drop_column("institutions", "proof_document_url")
    op.drop_column("institutions", "website_social_link")
    op.drop_column("institutions", "contact_person_designation")

    bind = op.get_bind()
    institution_status = sa.Enum(
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "SUSPENDED",
        name="institution_status",
    )
    institution_status.drop(bind, checkfirst=True)
