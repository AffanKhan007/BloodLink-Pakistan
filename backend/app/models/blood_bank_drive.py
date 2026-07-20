from datetime import date, datetime, time
from enum import StrEnum
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DriveStatus(StrEnum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DriveRegistrationStatus(StrEnum):
    REGISTERED = "registered"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class SlotStatus(StrEnum):
    AVAILABLE = "available"
    FULL = "full"
    CANCELLED = "cancelled"


class BookingStatus(StrEnum):
    BOOKED = "booked"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class BloodBankDonationDrive(Base):
    __tablename__ = "blood_bank_donation_drives"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    blood_bank_id: Mapped[int] = mapped_column(ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    location_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    target_blood_groups: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    expected_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[DriveStatus] = mapped_column(
        String(20), default=DriveStatus.UPCOMING, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    blood_bank = relationship("BloodBank", back_populates="donation_drives")
    registrations = relationship("BloodBankDonationDriveRegistration", back_populates="drive", cascade="all, delete-orphan")


class BloodBankDonationDriveRegistration(Base):
    __tablename__ = "blood_bank_donation_drive_registrations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    drive_id: Mapped[int] = mapped_column(ForeignKey("blood_bank_donation_drives.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[DriveRegistrationStatus] = mapped_column(
        String(20), default=DriveRegistrationStatus.REGISTERED, nullable=False
    )
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    drive = relationship("BloodBankDonationDrive", back_populates="registrations")
    donor = relationship("DonorProfile")


class BloodBankAppointmentSlot(Base):
    __tablename__ = "blood_bank_appointment_slots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    blood_bank_id: Mapped[int] = mapped_column(ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    max_donors: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    booked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[SlotStatus] = mapped_column(
        String(20), default=SlotStatus.AVAILABLE, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    blood_bank = relationship("BloodBank", back_populates="appointment_slots")
    bookings = relationship("BloodBankAppointmentBooking", back_populates="slot", cascade="all, delete-orphan")


class BloodBankAppointmentBooking(Base):
    __tablename__ = "blood_bank_appointment_bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("blood_bank_appointment_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[BookingStatus] = mapped_column(
        String(20), default=BookingStatus.BOOKED, nullable=False, index=True
    )
    booked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    slot = relationship("BloodBankAppointmentSlot", back_populates="bookings")
    donor = relationship("DonorProfile")
