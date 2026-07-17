"""rename USER role value to MEMBER

Revision ID: 0008_rename_user_role_to_member
Revises: 0007_reports_moderation
Create Date: 2026-07-17 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0008_rename_user_role_to_member"
down_revision: Union[str, None] = "0007_reports_moderation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PG_ENUM = "user_role"


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(f"ALTER TYPE {PG_ENUM} RENAME VALUE 'USER' TO 'MEMBER'")


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(f"ALTER TYPE {PG_ENUM} RENAME VALUE 'MEMBER' TO 'USER'")
