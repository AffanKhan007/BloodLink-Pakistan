from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportedType(StrEnum):
    USER = "user"
    INSTITUTION = "institution"
    REQUEST = "request"
    CONVERSATION = "conversation"


class ReportReason(StrEnum):
    FAKE_REQUEST = "fake_request"
    SPAM = "spam"
    ABUSIVE_MESSAGES = "abusive_messages"
    HARASSMENT = "harassment"
    FAKE_INSTITUTION = "fake_institution"
    IMPERSONATION = "impersonation"
    OTHER = "other"


class ReportStatus(StrEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    ACTION_TAKEN = "action_taken"
    DISMISSED = "dismissed"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_type: Mapped[ReportedType] = mapped_column(Enum(ReportedType, name="reported_type"), nullable=False, index=True)
    reported_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    reason: Mapped[ReportReason] = mapped_column(Enum(ReportReason, name="report_reason"), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_file: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        default=ReportStatus.PENDING,
        nullable=False,
        index=True,
    )
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    reporter = relationship("User", back_populates="filed_reports", foreign_keys=[reporter_id])
