"""messaging institutions and cities

Revision ID: 0003_msg_institutions_cities
Revises: 0002_org_inventory_foundation
Create Date: 2026-05-21 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_msg_institutions_cities"
down_revision: Union[str, None] = "0002_org_inventory_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'INSTITUTION_DONOR'")

    op.create_table(
        "receiver_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("area", sa.String(length=120), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_receiver_profiles_user_id", "receiver_profiles", ["user_id"], unique=True)

    op.create_table(
        "cities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("province", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cities_name", "cities", ["name"], unique=True)

    op.create_table(
        "institutions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("institution_name", sa.String(length=255), nullable=False),
        sa.Column("institution_type", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("area", sa.String(length=120), nullable=True),
        sa.Column("contact_person", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("available_blood_groups", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_institutions_city", "institutions", ["city"], unique=False)

    op.create_table(
        "chats",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("participant_one_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("participant_two_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("request_id", sa.Integer(), sa.ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chats_participant_one_id", "chats", ["participant_one_id"], unique=False)
    op.create_index("ix_chats_participant_two_id", "chats", ["participant_two_id"], unique=False)
    op.create_index("ix_chats_request_id", "chats", ["request_id"], unique=False)

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("chat_id", sa.Integer(), sa.ForeignKey("chats.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chat_messages_chat_id", "chat_messages", ["chat_id"], unique=False)
    op.create_index("ix_chat_messages_sender_id", "chat_messages", ["sender_id"], unique=False)

    op.add_column("donor_profiles", sa.Column("is_publicly_available", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index("ix_donor_profiles_is_publicly_available", "donor_profiles", ["is_publicly_available"], unique=False)

    op.add_column("blood_requests", sa.Column("additional_notes", sa.Text(), nullable=True))

    op.add_column("blood_banks", sa.Column("contact_number", sa.String(length=20), nullable=True))
    op.add_column("blood_banks", sa.Column("email", sa.String(length=255), nullable=True))

    op.add_column("blood_units", sa.Column("units_available", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    op.drop_column("blood_units", "units_available")

    op.drop_column("blood_banks", "email")
    op.drop_column("blood_banks", "contact_number")

    op.drop_column("blood_requests", "additional_notes")

    op.drop_index("ix_donor_profiles_is_publicly_available", table_name="donor_profiles")
    op.drop_column("donor_profiles", "is_publicly_available")

    op.drop_index("ix_chat_messages_sender_id", table_name="chat_messages")
    op.drop_index("ix_chat_messages_chat_id", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index("ix_chats_request_id", table_name="chats")
    op.drop_index("ix_chats_participant_two_id", table_name="chats")
    op.drop_index("ix_chats_participant_one_id", table_name="chats")
    op.drop_table("chats")

    op.drop_index("ix_institutions_city", table_name="institutions")
    op.drop_table("institutions")

    op.drop_index("ix_cities_name", table_name="cities")
    op.drop_table("cities")

    op.drop_index("ix_receiver_profiles_user_id", table_name="receiver_profiles")
    op.drop_table("receiver_profiles")
