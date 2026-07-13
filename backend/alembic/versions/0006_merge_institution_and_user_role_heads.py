"""merge institution verification and user role heads

Revision ID: 0006_merge_inst_user_heads
Revises: 0005_inst_verify_details, 0005_merge_donor_receiver
Create Date: 2026-07-13 00:00:00.000000
"""

from typing import Sequence, Union


revision: str = "0006_merge_inst_user_heads"
down_revision: Union[str, Sequence[str], None] = ("0005_inst_verify_details", "0005_merge_donor_receiver")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
