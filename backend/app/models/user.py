from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(StrEnum):
    DONOR = "donor"
    RECEIVER = "receiver"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False)
    created_requests = relationship("BloodRequest", back_populates="created_by_user", foreign_keys="BloodRequest.created_by_user_id")
    notifications = relationship("Notification", back_populates="user")
    filed_reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_user_id")
    received_reports = relationship("Report", back_populates="reported_user", foreign_keys="Report.reported_user_id")
    admin_logs = relationship("AuditLog", back_populates="admin_user")

