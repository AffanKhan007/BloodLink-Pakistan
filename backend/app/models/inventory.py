from datetime import datetime
from enum import StrEnum
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BloodUnitStatus(StrEnum):
    COLLECTED = "collected"
    TESTING_PENDING = "testing_pending"
    CLEARED = "cleared"
    QUARANTINED = "quarantined"
    AVAILABLE = "available"
    RESERVED = "reserved"
    ISSUED = "issued"
    TRANSFUSED = "transfused"
    EXPIRED = "expired"
    DISCARDED = "discarded"
    TRANSFERRED = "transferred"


class TestingStatus(StrEnum):
    PENDING = "pending"
    CLEARED = "cleared"
    FAILED = "failed"
    INCONCLUSIVE = "inconclusive"


class BloodUnit(Base):
    __tablename__ = "blood_units"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    unit_code: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    qr_code_value: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    donor_profile_id: Mapped[Optional[int]] = mapped_column(ForeignKey("donor_profiles.id", ondelete="SET NULL"), nullable=True)
    blood_bank_id: Mapped[int] = mapped_column(ForeignKey("blood_banks.id", ondelete="CASCADE"), nullable=False, index=True)
    blood_group: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    units_available: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    component_type: Mapped[str] = mapped_column(String(60), nullable=False, default="whole_blood")
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    testing_status: Mapped[TestingStatus] = mapped_column(
        Enum(TestingStatus, name="testing_status"), default=TestingStatus.PENDING, nullable=False, index=True
    )
    status: Mapped[BloodUnitStatus] = mapped_column(
        Enum(BloodUnitStatus, name="blood_unit_status"), default=BloodUnitStatus.COLLECTED, nullable=False, index=True
    )
    storage_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    donor_profile = relationship("DonorProfile")
    blood_bank = relationship("BloodBank", back_populates="blood_units")
    movements = relationship("InventoryMovement", back_populates="blood_unit", cascade="all, delete-orphan")


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    blood_unit_id: Mapped[int] = mapped_column(ForeignKey("blood_units.id", ondelete="CASCADE"), nullable=False, index=True)
    from_blood_bank_id: Mapped[Optional[int]] = mapped_column(ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True)
    to_blood_bank_id: Mapped[Optional[int]] = mapped_column(ForeignKey("blood_banks.id", ondelete="SET NULL"), nullable=True)
    issued_to_hospital_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    movement_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    performed_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    blood_unit = relationship("BloodUnit", back_populates="movements")
    from_blood_bank = relationship("BloodBank", foreign_keys=[from_blood_bank_id])
    to_blood_bank = relationship("BloodBank", foreign_keys=[to_blood_bank_id])
    issued_to_hospital = relationship("Hospital", foreign_keys=[issued_to_hospital_id])
