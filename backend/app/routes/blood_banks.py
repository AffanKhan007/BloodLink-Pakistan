from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models import BloodBank, BloodRequest, BloodUnit, BloodUnitStatus, InventoryMovement, TestingStatus, User, UserRole
from app.schemas.blood_bank import (
    BloodBankCreate,
    BloodBankOut,
    BloodUnitCreate,
    BloodUnitIssue,
    BloodUnitOut,
    BloodUnitStatusUpdate,
    BloodUnitTransfer,
    InventoryMovementOut,
    InventorySummaryOut,
)
from app.schemas.blood_request import BloodRequestListOut
from app.services.audit import create_audit_log
from app.services.matching import count_confirmed_matches


router = APIRouter(tags=["blood_banks"])


def _ensure_blood_bank_scope(current_user: User, blood_bank_id: int) -> None:
    if current_user.role in {UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF} and current_user.blood_bank_id != blood_bank_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def _generate_unit_code(blood_bank_id: int, unit_id: int) -> tuple[str, str]:
    year = datetime.now(timezone.utc).year
    unit_code = f"BL-{year}-{unit_id:06d}"
    qr_code_value = f"bloodlink://unit/{blood_bank_id}/{unit_code}"
    return unit_code, qr_code_value


def _coerce_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("/blood-banks", response_model=list[BloodBankOut])
def list_blood_banks(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF, UserRole.USER)
    ),
) -> list[BloodBankOut]:
    banks = list(db.scalars(select(BloodBank).order_by(BloodBank.name.asc())).all())
    return [BloodBankOut.model_validate(item) for item in banks]


@router.post("/blood-banks", response_model=BloodBankOut, status_code=status.HTTP_201_CREATED)
def create_blood_bank(
    payload: BloodBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
) -> BloodBankOut:
    bank = BloodBank(**payload.model_dump())
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return BloodBankOut.model_validate(bank)


@router.get("/blood-banks/{blood_bank_id}/inventory-summary", response_model=InventorySummaryOut)
def inventory_summary(
    blood_bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> InventorySummaryOut:
    _ensure_blood_bank_scope(current_user, blood_bank_id)
    bank = db.get(BloodBank, blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    units = list(
        db.scalars(
            select(BloodUnit)
            .where(BloodUnit.blood_bank_id == blood_bank_id)
            .order_by(BloodUnit.created_at.desc())
        ).all()
    )
    expiring_threshold = datetime.now(timezone.utc) + timedelta(days=7)
    return InventorySummaryOut(
        blood_bank=BloodBankOut.model_validate(bank),
        total_units=sum(item.units_available for item in units),
        available_units=sum(item.units_available for item in units if item.status == BloodUnitStatus.AVAILABLE),
        reserved_units=sum(item.units_available for item in units if item.status == BloodUnitStatus.RESERVED),
        expiring_soon_units=sum(
            item.units_available for item in units if _coerce_utc(item.expires_at) <= expiring_threshold
        ),
        units=[BloodUnitOut.model_validate(item) for item in units[:20]],
    )


@router.get("/blood-banks/me/city-requests", response_model=list[BloodRequestListOut])
def blood_bank_city_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> list[BloodRequestListOut]:
    if not current_user.blood_bank_id:
        return []
    bank = db.get(BloodBank, current_user.blood_bank_id)
    if not bank:
        return []
    requests = list(
        db.scalars(
            select(BloodRequest).where(BloodRequest.city == bank.city).order_by(BloodRequest.required_by.asc())
        ).all()
    )
    return [
        BloodRequestListOut(**request.__dict__, confirmed_donor_count=count_confirmed_matches(request))
        for request in requests
    ]


@router.post("/blood-banks/{blood_bank_id}/blood-units", response_model=BloodUnitOut, status_code=status.HTTP_201_CREATED)
def create_blood_unit(
    blood_bank_id: int,
    payload: BloodUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> BloodUnitOut:
    _ensure_blood_bank_scope(current_user, blood_bank_id)
    bank = db.get(BloodBank, blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    unit = BloodUnit(
        unit_code="temp",
        qr_code_value="temp",
        blood_bank_id=blood_bank_id,
        **payload.model_dump(),
    )
    db.add(unit)
    db.flush()
    unit.unit_code, unit.qr_code_value = _generate_unit_code(blood_bank_id, unit.id)
    db.commit()
    db.refresh(unit)
    return BloodUnitOut.model_validate(unit)


@router.get("/blood-units/{unit_id}", response_model=BloodUnitOut)
def get_blood_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> BloodUnitOut:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    return BloodUnitOut.model_validate(unit)


@router.patch("/blood-units/{unit_id}/status", response_model=BloodUnitOut)
def update_blood_unit_status(
    unit_id: int,
    payload: BloodUnitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> BloodUnitOut:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    old_status = unit.status
    unit.status = payload.status
    if payload.testing_status is not None:
        unit.testing_status = payload.testing_status
    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_blood_unit_status",
        entity_type="blood_unit",
        entity_id=unit.id,
        details={"old_status": old_status.value, "new_status": unit.status.value},
    )
    db.commit()
    db.refresh(unit)
    return BloodUnitOut.model_validate(unit)


@router.post("/blood-units/{unit_id}/issue", response_model=InventoryMovementOut)
def issue_blood_unit(
    unit_id: int,
    payload: BloodUnitIssue,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> InventoryMovementOut:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    unit.status = BloodUnitStatus.ISSUED
    movement = InventoryMovement(
        blood_unit_id=unit.id,
        from_blood_bank_id=unit.blood_bank_id,
        issued_to_hospital_id=payload.hospital_id,
        movement_type="issued",
        performed_by=current_user.id,
        notes=payload.notes,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return InventoryMovementOut.model_validate(movement)


@router.post("/blood-units/{unit_id}/transfer", response_model=InventoryMovementOut)
def transfer_blood_unit(
    unit_id: int,
    payload: BloodUnitTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> InventoryMovementOut:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    movement = InventoryMovement(
        blood_unit_id=unit.id,
        from_blood_bank_id=unit.blood_bank_id,
        to_blood_bank_id=payload.to_blood_bank_id,
        movement_type="transferred",
        performed_by=current_user.id,
        notes=payload.notes,
    )
    unit.status = BloodUnitStatus.TRANSFERRED
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return InventoryMovementOut.model_validate(movement)


@router.get("/blood-units/{unit_id}/trace", response_model=list[InventoryMovementOut])
def trace_blood_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> list[InventoryMovementOut]:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    movements = list(
        db.scalars(
            select(InventoryMovement)
            .where(InventoryMovement.blood_unit_id == unit_id)
            .order_by(InventoryMovement.movement_time.desc())
        ).all()
    )
    return [InventoryMovementOut.model_validate(item) for item in movements]
