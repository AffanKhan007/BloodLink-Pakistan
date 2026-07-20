"""trust and data-freshness: blood_group_verified, reliability counters, stock_update_frequency

Revision ID: 0012_trust_data_freshness
Revises: 0011_blood_radar_location_fields
Create Date: 2026-07-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012_trust_data_freshness"
down_revision: Union[str, None] = "0011_blood_radar_location_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Donor profile trust + reliability fields ─────────────────────
    op.add_column(
        "donor_profiles",
        sa.Column("blood_group_verified", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "donor_profiles",
        sa.Column("matches_accepted", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "donor_profiles",
        sa.Column("matches_completed", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "donor_profiles",
        sa.Column("matches_no_show", sa.Integer(), server_default="0", nullable=False),
    )

    # ── Blood bank stock freshness ──────────────────────────────────
    op.add_column(
        "blood_banks",
        sa.Column("stock_update_frequency", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("blood_banks", "stock_update_frequency")
    op.drop_column("donor_profiles", "matches_no_show")
    op.drop_column("donor_profiles", "matches_completed")
    op.drop_column("donor_profiles", "matches_accepted")
    op.drop_column("donor_profiles", "blood_group_verified")
