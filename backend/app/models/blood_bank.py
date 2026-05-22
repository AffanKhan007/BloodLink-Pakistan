from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BloodBank(Base):
    __tablename__ = "blood_banks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hospital_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    area: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    contact_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    hospital = relationship("Hospital", back_populates="blood_banks")
    staff_users = relationship("User", back_populates="blood_bank")
    blood_units = relationship("BloodUnit", back_populates="blood_bank")
