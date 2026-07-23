"""add govt_verified badge to blood_banks

Revision ID: 0013_govt_verified_transparency
Revises: 0012_trust_data_freshness
Create Date: 2026-07-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0013_govt_verified_transparency"
down_revision: Union[str, None] = "0012_trust_data_freshness"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "blood_banks",
        sa.Column("govt_verified", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("blood_banks", "govt_verified")
