from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
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
    contact_person_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_person_cnic: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    operating_hours: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    public_stock_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    accepts_walkins: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(40), default="pending", nullable=False, index=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_verified_by_admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    stock_update_frequency: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    hospital = relationship("Hospital", back_populates="blood_banks")
    staff_users = relationship("User", back_populates="blood_bank", foreign_keys="User.blood_bank_id")
    blood_units = relationship("BloodUnit", back_populates="blood_bank")
    donation_drives = relationship("BloodBankDonationDrive", back_populates="blood_bank", cascade="all, delete-orphan")
    appointment_slots = relationship("BloodBankAppointmentSlot", back_populates="blood_bank", cascade="all, delete-orphan")
