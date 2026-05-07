"""initial tables

Revision ID: 0001_initial_tables
Revises:
Create Date: 2026-05-07 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_initial_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role = sa.Enum("DONOR", "RECEIVER", "ADMIN", name="user_role")
donor_verification_status = sa.Enum("PENDING", "APPROVED", "REJECTED", "BLOCKED", name="donor_verification_status")
urgency_level = sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="urgency_level")
request_status = sa.Enum(
    "PENDING_REVIEW", "APPROVED", "MATCHED", "FULFILLED", "REJECTED", "CANCELLED", name="request_status"
)
match_status = sa.Enum("PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED", name="match_status")
report_status = sa.Enum("PENDING", "REVIEWED", "RESOLVED", "DISMISSED", name="report_status")

user_role_pg = postgresql.ENUM("DONOR", "RECEIVER", "ADMIN", name="user_role", create_type=False)
donor_verification_status_pg = postgresql.ENUM(
    "PENDING", "APPROVED", "REJECTED", "BLOCKED", name="donor_verification_status", create_type=False
)
urgency_level_pg = postgresql.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL", name="urgency_level", create_type=False)
request_status_pg = postgresql.ENUM(
    "PENDING_REVIEW", "APPROVED", "MATCHED", "FULFILLED", "REJECTED", "CANCELLED", name="request_status", create_type=False
)
match_status_pg = postgresql.ENUM(
    "PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED", name="match_status", create_type=False
)
report_status_pg = postgresql.ENUM(
    "PENDING", "REVIEWED", "RESOLVED", "DISMISSED", name="report_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"
    if is_postgres:
        user_role_pg.create(bind, checkfirst=True)
        donor_verification_status_pg.create(bind, checkfirst=True)
        urgency_level_pg.create(bind, checkfirst=True)
        request_status_pg.create(bind, checkfirst=True)
        match_status_pg.create(bind, checkfirst=True)
        report_status_pg.create(bind, checkfirst=True)

    role_type = user_role_pg if is_postgres else user_role
    donor_verification_type = donor_verification_status_pg if is_postgres else donor_verification_status
    urgency_type = urgency_level_pg if is_postgres else urgency_level
    request_status_type = request_status_pg if is_postgres else request_status
    match_status_type = match_status_pg if is_postgres else match_status
    report_status_type = report_status_pg if is_postgres else report_status

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", role_type, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)
    op.create_index("ix_users_role", "users", ["role"], unique=False)

    op.create_table(
        "donor_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("blood_group", sa.String(length=5), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("area", sa.String(length=120), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("gender", sa.String(length=30), nullable=False),
        sa.Column("last_donation_date", sa.Date(), nullable=True),
        sa.Column("availability_status", sa.String(length=20), nullable=False, server_default="available"),
        sa.Column("verification_status", donor_verification_type, nullable=False, server_default="PENDING"),
        sa.Column("health_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_donor_profiles_blood_group", "donor_profiles", ["blood_group"], unique=False)
    op.create_index("ix_donor_profiles_city", "donor_profiles", ["city"], unique=False)
    op.create_index("ix_donor_profiles_verification_status", "donor_profiles", ["verification_status"], unique=False)
    op.create_index("ix_donor_profiles_availability_status", "donor_profiles", ["availability_status"], unique=False)

    op.create_table(
        "blood_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("patient_name", sa.String(length=150), nullable=False),
        sa.Column("blood_group_needed", sa.String(length=5), nullable=False),
        sa.Column("units_required", sa.Integer(), nullable=False),
        sa.Column("hospital_name", sa.String(length=200), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("area", sa.String(length=120), nullable=False),
        sa.Column("ward_room", sa.String(length=120), nullable=False),
        sa.Column("urgency_level", urgency_type, nullable=False),
        sa.Column("attendant_name", sa.String(length=150), nullable=False),
        sa.Column("attendant_phone", sa.String(length=20), nullable=False),
        sa.Column("required_by", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", request_status_type, nullable=False, server_default="PENDING_REVIEW"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_blood_requests_created_by_user_id", "blood_requests", ["created_by_user_id"], unique=False)
    op.create_index("ix_blood_requests_blood_group_needed", "blood_requests", ["blood_group_needed"], unique=False)
    op.create_index("ix_blood_requests_city", "blood_requests", ["city"], unique=False)
    op.create_index("ix_blood_requests_required_by", "blood_requests", ["required_by"], unique=False)
    op.create_index("ix_blood_requests_status", "blood_requests", ["status"], unique=False)

    op.create_table(
        "request_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("file_url", sa.String(length=255), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_request_documents_request_id", "request_documents", ["request_id"], unique=False)

    op.create_table(
        "donation_matches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("donor_id", sa.Integer(), sa.ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", match_status_type, nullable=False, server_default="PENDING"),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_donation_matches_request_id", "donation_matches", ["request_id"], unique=False)
    op.create_index("ix_donation_matches_donor_id", "donation_matches", ["donor_id"], unique=False)
    op.create_index("ix_donation_matches_status", "donation_matches", ["status"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"], unique=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reporter_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reported_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", report_status_type, nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_reports_reporter_user_id", "reports", ["reporter_user_id"], unique=False)
    op.create_index("ix_reports_reported_user_id", "reports", ["reported_user_id"], unique=False)
    op.create_index("ix_reports_request_id", "reports", ["request_id"], unique=False)
    op.create_index("ix_reports_status", "reports", ["status"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("entity_type", sa.String(length=120), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("details", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_audit_logs_admin_user_id", "audit_logs", ["admin_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_audit_logs_admin_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_request_id", table_name="reports")
    op.drop_index("ix_reports_reported_user_id", table_name="reports")
    op.drop_index("ix_reports_reporter_user_id", table_name="reports")
    op.drop_table("reports")

    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_donation_matches_status", table_name="donation_matches")
    op.drop_index("ix_donation_matches_donor_id", table_name="donation_matches")
    op.drop_index("ix_donation_matches_request_id", table_name="donation_matches")
    op.drop_table("donation_matches")

    op.drop_index("ix_request_documents_request_id", table_name="request_documents")
    op.drop_table("request_documents")

    op.drop_index("ix_blood_requests_status", table_name="blood_requests")
    op.drop_index("ix_blood_requests_required_by", table_name="blood_requests")
    op.drop_index("ix_blood_requests_city", table_name="blood_requests")
    op.drop_index("ix_blood_requests_blood_group_needed", table_name="blood_requests")
    op.drop_index("ix_blood_requests_created_by_user_id", table_name="blood_requests")
    op.drop_table("blood_requests")

    op.drop_index("ix_donor_profiles_availability_status", table_name="donor_profiles")
    op.drop_index("ix_donor_profiles_verification_status", table_name="donor_profiles")
    op.drop_index("ix_donor_profiles_city", table_name="donor_profiles")
    op.drop_index("ix_donor_profiles_blood_group", table_name="donor_profiles")
    op.drop_table("donor_profiles")

    op.drop_index("ix_users_role", table_name="users")
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        report_status_pg.drop(bind, checkfirst=True)
        match_status_pg.drop(bind, checkfirst=True)
        request_status_pg.drop(bind, checkfirst=True)
        urgency_level_pg.drop(bind, checkfirst=True)
        donor_verification_status_pg.drop(bind, checkfirst=True)
        user_role_pg.drop(bind, checkfirst=True)
