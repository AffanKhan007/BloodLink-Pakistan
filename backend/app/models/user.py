from datetime import datetime
from enum import StrEnum
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(StrEnum):
    USER = "user"
    INSTITUTION_DONOR = "institution_donor"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    OPERATIONS_AGENT = "operations_agent"
    HOSPITAL_ADMIN = "hospital_admin"
    HOSPITAL_STAFF = "hospital_staff"
    BLOOD_BANK_ADMIN = "blood_bank_admin"
    BLOOD_BANK_STAFF = "blood_bank_staff"
    AUDITOR = "auditor"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), default=UserRole.USER, nullable=False, index=True
    )
    hospital_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    blood_bank_id: Mapped[Optional[int]] = mapped_column(ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False)
    institution_profile = relationship("Institution", back_populates="user", uselist=False, foreign_keys="Institution.user_id")
    created_requests = relationship("BloodRequest", back_populates="created_by_user", foreign_keys="BloodRequest.created_by_user_id")
    notifications = relationship("Notification", back_populates="user")
    filed_reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_user_id")
    received_reports = relationship("Report", back_populates="reported_user", foreign_keys="Report.reported_user_id")
    admin_logs = relationship("AuditLog", back_populates="admin_user")
    hospital = relationship("Hospital", back_populates="staff_users", foreign_keys=[hospital_id])
    blood_bank = relationship("BloodBank", back_populates="staff_users", foreign_keys=[blood_bank_id])
    sent_chats = relationship("Chat", back_populates="participant_one", foreign_keys="Chat.participant_one_id")
    received_chats = relationship("Chat", back_populates="participant_two", foreign_keys="Chat.participant_two_id")
    sent_messages = relationship("ChatMessage", back_populates="sender")
