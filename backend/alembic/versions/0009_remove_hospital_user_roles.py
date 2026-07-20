"""remove hospital user roles, reassign users to institution_donor

Revision ID: 0009_remove_hospital_user_roles
Revises: 0008_rename_user_role_to_member
Create Date: 2026-07-20 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0009_remove_hospital_user_roles"
down_revision: Union[str, None] = "0008_rename_user_role_to_member"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PG_ENUM = "user_role"


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Reassign any existing hospital_admin / hospital_staff users to institution_donor
    # so no users are silently dropped during the enum change.
    op.execute(
        f"UPDATE users SET role = 'institution_donor' "
        f"WHERE role IN ('hospital_admin', 'hospital_staff')"
    )

    # PostgreSQL does not support ALTER TYPE ... DROP VALUE directly.
    # Recreate the enum type without the removed values.
    op.execute(f"ALTER TYPE {PG_ENUM} RENAME TO {PG_ENUM}_old")
    op.execute(
        f"CREATE TYPE {PG_ENUM} AS ENUM ("
        f"'member', 'institution_donor', 'admin', 'super_admin', "
        f"'operations_agent', 'blood_bank_admin', 'blood_bank_staff', 'auditor')"
    )
    op.execute(
        f"ALTER TABLE users ALTER COLUMN role TYPE {PG_ENUM} "
        f"USING role::text::{PG_ENUM}"
    )
    op.execute(f"DROP TYPE {PG_ENUM}_old")


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute(f"ALTER TYPE {PG_ENUM} RENAME TO {PG_ENUM}_old")
    op.execute(
        f"CREATE TYPE {PG_ENUM} AS ENUM ("
        f"'member', 'institution_donor', 'admin', 'super_admin', "
        f"'operations_agent', 'hospital_admin', 'hospital_staff', "
        f"'blood_bank_admin', 'blood_bank_staff', 'auditor')"
    )
    op.execute(
        f"ALTER TABLE users ALTER COLUMN role TYPE {PG_ENUM} "
        f"USING role::text::{PG_ENUM}"
    )
    op.execute(f"DROP TYPE {PG_ENUM}_old")
