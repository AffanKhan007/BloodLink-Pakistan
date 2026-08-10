"""remove super_admin, operations_agent, and auditor roles

Revision ID: 0014_remove_extra_admin_roles
Revises: 0013_govt_verified_transparency
Create Date: 2026-07-23 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0014_remove_extra_admin_roles"
down_revision: Union[str, None] = "0013_govt_verified_transparency"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PG_ENUM = "user_role"


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Reassign any existing super_admin / operations_agent / auditor users
    # to the single platform admin role. Values are UPPERCASE to match the
    # Postgres enum created by migration 0009.
    op.execute(
        "UPDATE users SET role = 'ADMIN' "
        "WHERE role IN ('SUPER_ADMIN', 'OPERATIONS_AGENT', 'AUDITOR')"
    )

    # PostgreSQL does not support ALTER TYPE ... DROP VALUE directly.
    # Recreate the enum type with only the roles that remain in the model.
    op.execute(f"ALTER TYPE {PG_ENUM} RENAME TO {PG_ENUM}_old")
    op.execute(
        f"CREATE TYPE {PG_ENUM} AS ENUM ("
        f"'MEMBER', 'INSTITUTION_DONOR', 'ADMIN', "
        f"'BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF')"
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
        f"'OPERATIONS_AGENT', 'BLOOD_BANK_ADMIN', 'BLOOD_BANK_STAFF', 'AUDITOR')"
    )
    op.execute(
        f"ALTER TABLE users ALTER COLUMN role TYPE {PG_ENUM} "
        f"USING role::text::{PG_ENUM}"
    )
    op.execute(f"DROP TYPE {PG_ENUM}_old")