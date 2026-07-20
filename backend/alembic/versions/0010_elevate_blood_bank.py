"""elevate blood bank to first-class self-registering user type

Revision ID: 0010_elevate_blood_bank
Revises: 0009_remove_hospital_user_roles
Create Date: 2026-07-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_elevate_blood_bank"
down_revision: Union[str, None] = "0009_remove_hospital_user_roles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── New columns on blood_banks ───────────────────────────────────
    op.add_column("blood_banks", sa.Column("contact_person_name", sa.String(150), nullable=True))
    op.add_column("blood_banks", sa.Column("contact_person_cnic", sa.String(20), nullable=True))
    op.add_column("blood_banks", sa.Column("operating_hours", sa.String(255), nullable=True))
    op.add_column("blood_banks", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("blood_banks", sa.Column("logo_url", sa.String(255), nullable=True))
    op.add_column("blood_banks", sa.Column("public_stock_visible", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("blood_banks", sa.Column("accepts_walkins", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("blood_banks", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "blood_banks",
        sa.Column("last_verified_by_admin_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )

    # ── Blood bank donation drives ───────────────────────────────────
    op.create_table(
        "blood_bank_donation_drives",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("blood_bank_id", sa.Integer(), sa.ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("location_address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(120), nullable=False, index=True),
        sa.Column("target_blood_groups", sa.String(255), nullable=True),
        sa.Column("expected_capacity", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(20), server_default="upcoming", nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Drive registrations ──────────────────────────────────────────
    op.create_table(
        "blood_bank_donation_drive_registrations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("drive_id", sa.Integer(), sa.ForeignKey("blood_bank_donation_drives.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("donor_id", sa.Integer(), sa.ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("status", sa.String(20), server_default="registered", nullable=False),
        sa.Column("registered_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Appointment slots ────────────────────────────────────────────
    op.create_table(
        "blood_bank_appointment_slots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("blood_bank_id", sa.Integer(), sa.ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("slot_date", sa.Date(), nullable=False, index=True),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("max_donors", sa.Integer(), server_default="5", nullable=False),
        sa.Column("booked_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(20), server_default="available", nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Appointment bookings ─────────────────────────────────────────
    op.create_table(
        "blood_bank_appointment_bookings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slot_id", sa.Integer(), sa.ForeignKey("blood_bank_appointment_slots.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("donor_id", sa.Integer(), sa.ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("status", sa.String(20), server_default="booked", nullable=False, index=True),
        sa.Column("booked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("blood_bank_appointment_bookings")
    op.drop_table("blood_bank_appointment_slots")
    op.drop_table("blood_bank_donation_drive_registrations")
    op.drop_table("blood_bank_donation_drives")
    op.drop_column("blood_banks", "last_verified_by_admin_id")
    op.drop_column("blood_banks", "verified_at")
    op.drop_column("blood_banks", "accepts_walkins")
    op.drop_column("blood_banks", "public_stock_visible")
    op.drop_column("blood_banks", "logo_url")
    op.drop_column("blood_banks", "description")
    op.drop_column("blood_banks", "operating_hours")
    op.drop_column("blood_banks", "contact_person_cnic")
    op.drop_column("blood_banks", "contact_person_name")
