from datetime import datetime
from enum import StrEnum

from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RequestStatus(StrEnum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    MATCHED = "matched"
    FULFILLED = "fulfilled"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class UrgencyLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    blood_group_needed: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    units_required: Mapped[int] = mapped_column(Integer, nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    area: Mapped[str] = mapped_column(String(120), nullable=False)
    ward_room: Mapped[str] = mapped_column(String(120), nullable=False)
    urgency_level: Mapped[UrgencyLevel] = mapped_column(Enum(UrgencyLevel, name="urgency_level"), nullable=False)
    attendant_name: Mapped[str] = mapped_column(String(150), nullable=False)
    attendant_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    required_by: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    additional_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status"),
        default=RequestStatus.PENDING_REVIEW,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    created_by_user = relationship("User", back_populates="created_requests", foreign_keys=[created_by_user_id])
    hospital = relationship("Hospital", back_populates="blood_requests")
    documents = relationship("RequestDocument", back_populates="request", cascade="all, delete-orphan")
    matches = relationship("DonationMatch", back_populates="request", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="request")


class RequestDocument(Base):
    __tablename__ = "request_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    request = relationship("BloodRequest", back_populates="documents")
