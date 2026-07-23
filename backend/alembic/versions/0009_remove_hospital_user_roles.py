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

    # Reassign any existing HOSPITAL_ADMIN / HOSPITAL_STAFF users to MEMBER
    # (the only valid target that exists in the current enum).
    # Note: PG enum values are UPPERCASE at this point in the migration chain.
    op.execute(
        "UPDATE users SET role = 'MEMBER' "
        "WHERE role IN ('HOSPITAL_ADMIN', 'HOSPITAL_STAFF')"
    )

    # PostgreSQL does not support ALTER TYPE ... DROP VALUE directly.
    # Recreate the enum type without HOSPITAL_ADMIN/HOSPITAL_STAFF (and
    # the unused DONOR/RECEIVER from the original schema).
    # Values are UPPERCASE to match what SQLAlchemy's Enum(UserRole) sends
    # by default (enum member names).
    op.execute(f"ALTER TYPE {PG_ENUM} RENAME TO {PG_ENUM}_old")
    op.execute(
        f"CREATE TYPE {PG_ENUM} AS ENUM ("
        f"'MEMBER', 'INSTITUTION_DONOR', 'ADMIN', 'SUPER_ADMIN', "
        f"'OPERATIONS_AGENT', 'BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF', 'AUDITOR')"
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
        f"'MEMBER', 'INSTITUTION_DONOR', 'ADMIN', 'SUPER_ADMIN', "
        f"'OPERATIONS_AGENT', 'HOSPITAL_ADMIN', 'HOSPITAL_STAFF', "
        f"'BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF', 'AUDITOR')"
    )
    op.execute(
        f"ALTER TABLE users ALTER COLUMN role TYPE {PG_ENUM} "
        f"USING role::text::{PG_ENUM}"
    )
    op.execute(f"DROP TYPE {PG_ENUM}_old")
