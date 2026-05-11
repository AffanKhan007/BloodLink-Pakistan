"""organization and inventory foundation

Revision ID: 0002_org_inventory_foundation
Revises: 0001_initial_tables
Create Date: 2026-05-11 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_org_inventory_foundation"
down_revision: Union[str, None] = "0001_initial_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


blood_unit_status = sa.Enum(
    "COLLECTED",
    "TESTING_PENDING",
    "CLEARED",
    "QUARANTINED",
    "AVAILABLE",
    "RESERVED",
    "ISSUED",
    "TRANSFUSED",
    "EXPIRED",
    "DISCARDED",
    "TRANSFERRED",
    name="blood_unit_status",
)
testing_status = sa.Enum("PENDING", "CLEARED", "FAILED", "INCONCLUSIVE", name="testing_status")
blood_unit_status_pg = postgresql.ENUM(
    "COLLECTED",
    "TESTING_PENDING",
    "CLEARED",
    "QUARANTINED",
    "AVAILABLE",
    "RESERVED",
    "ISSUED",
    "TRANSFUSED",
    "EXPIRED",
    "DISCARDED",
    "TRANSFERRED",
    name="blood_unit_status",
    create_type=False,
)
testing_status_pg = postgresql.ENUM(
    "PENDING", "CLEARED", "FAILED", "INCONCLUSIVE", name="testing_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for value in [
            "SUPER_ADMIN",
            "OPERATIONS_AGENT",
            "HOSPITAL_ADMIN",
            "HOSPITAL_STAFF",
            "BLOOD_BANK_ADMIN",
            "BLOOD_BANK_STAFF",
            "AUDITOR",
        ]:
            op.execute(f"ALTER TYPE user_role ADD VALUE IF NOT EXISTS '{value}'")
        blood_unit_status_pg.create(bind, checkfirst=True)
        testing_status_pg.create(bind, checkfirst=True)

    blood_unit_status_type = blood_unit_status_pg if bind.dialect.name == "postgresql" else blood_unit_status
    testing_status_type = testing_status_pg if bind.dialect.name == "postgresql" else testing_status

    op.create_table(
        "hospitals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("area", sa.String(length=120), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("verification_status", sa.String(length=40), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_hospitals_city", "hospitals", ["city"], unique=False)
    op.create_index("ix_hospitals_verification_status", "hospitals", ["verification_status"], unique=False)

    op.create_table(
        "blood_banks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("hospital_id", sa.Integer(), sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("area", sa.String(length=120), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("license_number", sa.String(length=120), nullable=True),
        sa.Column("verification_status", sa.String(length=40), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_blood_banks_city", "blood_banks", ["city"], unique=False)
    op.create_index("ix_blood_banks_verification_status", "blood_banks", ["verification_status"], unique=False)

    op.add_column("users", sa.Column("hospital_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("blood_bank_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_users_hospital_id", "users", "hospitals", ["hospital_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_users_blood_bank_id", "users", "blood_banks", ["blood_bank_id"], ["id"], ondelete="SET NULL")

    op.add_column("blood_requests", sa.Column("hospital_id", sa.Integer(), nullable=True))
    op.create_index("ix_blood_requests_hospital_id", "blood_requests", ["hospital_id"], unique=False)
    op.create_foreign_key(
        "fk_blood_requests_hospital_id", "blood_requests", "hospitals", ["hospital_id"], ["id"], ondelete="SET NULL"
    )

    op.create_table(
        "blood_units",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("unit_code", sa.String(length=80), nullable=False),
        sa.Column("qr_code_value", sa.String(length=255), nullable=False),
        sa.Column("donor_profile_id", sa.Integer(), sa.ForeignKey("donor_profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("blood_bank_id", sa.Integer(), sa.ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False),
        sa.Column("blood_group", sa.String(length=3), nullable=False),
        sa.Column("component_type", sa.String(length=60), nullable=False),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("testing_status", testing_status_type, nullable=False, server_default="PENDING"),
        sa.Column("status", blood_unit_status_type, nullable=False, server_default="COLLECTED"),
        sa.Column("storage_location", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_blood_units_unit_code", "blood_units", ["unit_code"], unique=True)
    op.create_index("ix_blood_units_blood_bank_id", "blood_units", ["blood_bank_id"], unique=False)
    op.create_index("ix_blood_units_blood_group", "blood_units", ["blood_group"], unique=False)
    op.create_index("ix_blood_units_status", "blood_units", ["status"], unique=False)
    op.create_index("ix_blood_units_testing_status", "blood_units", ["testing_status"], unique=False)
    op.create_index("ix_blood_units_expires_at", "blood_units", ["expires_at"], unique=False)
    op.create_unique_constraint("uq_blood_units_qr_code_value", "blood_units", ["qr_code_value"])

    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("blood_unit_id", sa.Integer(), sa.ForeignKey("blood_units.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_blood_bank_id", sa.Integer(), sa.ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("to_blood_bank_id", sa.Integer(), sa.ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True),
        sa.Column("issued_to_hospital_id", sa.Integer(), sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("movement_type", sa.String(length=50), nullable=False),
        sa.Column("movement_time", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("performed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index("ix_inventory_movements_blood_unit_id", "inventory_movements", ["blood_unit_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_inventory_movements_blood_unit_id", table_name="inventory_movements")
    op.drop_table("inventory_movements")

    op.drop_constraint("uq_blood_units_qr_code_value", "blood_units", type_="unique")
    op.drop_index("ix_blood_units_expires_at", table_name="blood_units")
    op.drop_index("ix_blood_units_testing_status", table_name="blood_units")
    op.drop_index("ix_blood_units_status", table_name="blood_units")
    op.drop_index("ix_blood_units_blood_group", table_name="blood_units")
    op.drop_index("ix_blood_units_blood_bank_id", table_name="blood_units")
    op.drop_index("ix_blood_units_unit_code", table_name="blood_units")
    op.drop_table("blood_units")

    op.drop_constraint("fk_blood_requests_hospital_id", "blood_requests", type_="foreignkey")
    op.drop_index("ix_blood_requests_hospital_id", table_name="blood_requests")
    op.drop_column("blood_requests", "hospital_id")

    op.drop_constraint("fk_users_blood_bank_id", "users", type_="foreignkey")
    op.drop_constraint("fk_users_hospital_id", "users", type_="foreignkey")
    op.drop_column("users", "blood_bank_id")
    op.drop_column("users", "hospital_id")

    op.drop_index("ix_blood_banks_verification_status", table_name="blood_banks")
    op.drop_index("ix_blood_banks_city", table_name="blood_banks")
    op.drop_table("blood_banks")

    op.drop_index("ix_hospitals_verification_status", table_name="hospitals")
    op.drop_index("ix_hospitals_city", table_name="hospitals")
    op.drop_table("hospitals")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        testing_status_pg.drop(bind, checkfirst=True)
        blood_unit_status_pg.drop(bind, checkfirst=True)
