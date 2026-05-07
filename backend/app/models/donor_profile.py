from datetime import date, datetime
from enum import StrEnum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DonorVerificationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class DonorProfile(Base):
    __tablename__ = "donor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    blood_group: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String(120), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(30), nullable=False)
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    availability_status: Mapped[str] = mapped_column(String(20), default="available", nullable=False, index=True)
    verification_status: Mapped[DonorVerificationStatus] = mapped_column(
        Enum(DonorVerificationStatus, name="donor_verification_status"),
        default=DonorVerificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    health_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="donor_profile")
    matches = relationship("DonationMatch", back_populates="donor")
