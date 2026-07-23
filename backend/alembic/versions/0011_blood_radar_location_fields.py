"""add lat/lng/location_opt_in to donor_profiles for blood radar

Revision ID: 0011_blood_radar_location_fields
Revises: 0010_elevate_blood_bank
Create Date: 2026-07-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0011_blood_radar_location_fields"
down_revision: Union[str, None] = "0010_elevate_blood_bank"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("donor_profiles", sa.Column("latitude", sa.Numeric(9, 6), nullable=True))
    op.add_column("donor_profiles", sa.Column("longitude", sa.Numeric(9, 6), nullable=True))
    op.add_column(
        "donor_profiles",
        sa.Column("location_opt_in", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("donor_profiles", "location_opt_in")
    op.drop_column("donor_profiles", "longitude")
    op.drop_column("donor_profiles", "latitude")
