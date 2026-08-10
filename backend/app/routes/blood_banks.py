from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.security import get_password_hash
from app.models import (
    BloodBank,
    BloodBankAppointmentBooking,
    BloodBankAppointmentSlot,
    BloodBankDonationDrive,
    BloodBankDonationDriveRegistration,
    BloodRequest,
    BloodUnit,
    BloodUnitStatus,
    BookingStatus,
    DonationMatch,
    DonorProfile,
    DriveRegistrationStatus,
    DriveStatus,
    InventoryMovement,
    MatchStatus,
    RequestStatus,
    SlotStatus,
    TestingStatus,
    User,
    UserRole,
)
from app.schemas.blood_bank import (
    BloodBankAdminStatusUpdate,
    BloodBankAnalyticsOut,
    BloodBankCreate,
    BloodBankOut,
    BloodBankProfileUpdate,
    BloodBankRegistration,
    BloodBankRegistrationOut,
    BloodUnitCreate,
    BloodUnitIssue,
    BloodUnitOut,
    BloodUnitStatusUpdate,
    BloodUnitTransfer,
    BookingOut,
    BookingStatusUpdate,
    BulkStockUpdate,
    BloodBankFulfillRequest,
    DriveCreate,
    DriveOut,
    DriveRegistrationOut,
    DriveStatusUpdate,
    InventoryMovementOut,
    InventorySummaryOut,
    SlotCreate,
    SlotOut,
    TransparencyStatsOut,
)
from app.schemas.blood_request import BloodRequestListOut
from app.schemas.common import ConfirmDonorArrivalOut, GovtVerifiedOut
from app.services.audit import create_audit_log
from app.services.matching import compatible_donor_groups, count_confirmed_matches
from app.services.notifications import create_notification


router = APIRouter(tags=["blood_banks"])


class BloodBankAdminListItem(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    hospital_id: int | None
    city: str
    area: str | None
    contact_number: str | None
    email: str | None
    address: str | None
    license_number: str | None
    verification_status: str
    created_at: datetime
    updated_at: datetime
    contact_person_name: str | None = None
    contact_person_cnic: str | None = None
    operating_hours: str | None = None
    description: str | None = None
    logo_url: str | None = None
    public_stock_visible: bool = True
    accepts_walkins: bool = True
    govt_verified: bool = False
    verified_at: datetime | None = None
    last_verified_by_admin_id: int | None = None
    needs_reverification: bool = False


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


def _get_own_blood_bank(db: Session, current_user: User) -> BloodBank:
    if not current_user.blood_bank_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No blood bank associated with your account")
    bank = db.get(BloodBank, current_user.blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")
    return bank


def _touch_stock_update(bank: BloodBank) -> None:
    bank.stock_update_frequency = datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# 1. GET /blood-banks – list approved blood banks (auth required, optional city filter)
# ---------------------------------------------------------------------------
@router.get("/blood-banks", response_model=list[BloodBankOut])
def list_blood_banks(
    city: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF, UserRole.MEMBER)
    ),
) -> list[BloodBankOut]:
    statement = (
        select(BloodBank)
        .where(BloodBank.verification_status == "approved")
        .order_by(BloodBank.name.asc())
    )
    if city:
        statement = statement.where(BloodBank.city == city)
    banks = list(db.scalars(statement).all())
    return [BloodBankOut.model_validate(item) for item in banks]


# ---------------------------------------------------------------------------
# 2. POST /blood-banks – admin-only creation
# ---------------------------------------------------------------------------
@router.post("/blood-banks", response_model=BloodBankOut, status_code=status.HTTP_201_CREATED)
def create_blood_bank(
    payload: BloodBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> BloodBankOut:
    bank = BloodBank(**payload.model_dump())
    db.add(bank)
    db.commit()
    db.refresh(bank)
    return BloodBankOut.model_validate(bank)


# ---------------------------------------------------------------------------
# 3. GET /blood-banks/{blood_bank_id}/inventory-summary
# ---------------------------------------------------------------------------
@router.get("/blood-banks/{blood_bank_id}/inventory-summary", response_model=InventorySummaryOut)
def inventory_summary(
    blood_bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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


# ---------------------------------------------------------------------------
# 4. GET /blood-banks/me/city-requests
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# 5. POST /blood-banks/{blood_bank_id}/blood-units
# ---------------------------------------------------------------------------
@router.post("/blood-banks/{blood_bank_id}/blood-units", response_model=BloodUnitOut, status_code=status.HTTP_201_CREATED)
def create_blood_unit(
    blood_bank_id: int,
    payload: BloodUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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
    _touch_stock_update(bank)
    db.commit()
    db.refresh(unit)
    return BloodUnitOut.model_validate(unit)


# ---------------------------------------------------------------------------
# 6. GET /blood-units/{unit_id}
# ---------------------------------------------------------------------------
@router.get("/blood-units/{unit_id}", response_model=BloodUnitOut)
def get_blood_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
    ),
) -> BloodUnitOut:
    unit = db.get(BloodUnit, unit_id)
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood unit not found")
    _ensure_blood_bank_scope(current_user, unit.blood_bank_id)
    return BloodUnitOut.model_validate(unit)


# ---------------------------------------------------------------------------
# 7. PATCH /blood-units/{unit_id}/status
# ---------------------------------------------------------------------------
@router.patch("/blood-units/{unit_id}/status", response_model=BloodUnitOut)
def update_blood_unit_status(
    unit_id: int,
    payload: BloodUnitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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


# ---------------------------------------------------------------------------
# 8. POST /blood-units/{unit_id}/issue
# ---------------------------------------------------------------------------
@router.post("/blood-units/{unit_id}/issue", response_model=InventoryMovementOut)
def issue_blood_unit(
    unit_id: int,
    payload: BloodUnitIssue,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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


# ---------------------------------------------------------------------------
# 9. POST /blood-units/{unit_id}/transfer
# ---------------------------------------------------------------------------
@router.post("/blood-units/{unit_id}/transfer", response_model=InventoryMovementOut)
def transfer_blood_unit(
    unit_id: int,
    payload: BloodUnitTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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


# ---------------------------------------------------------------------------
# 10. GET /blood-units/{unit_id}/trace
# ---------------------------------------------------------------------------
@router.get("/blood-units/{unit_id}/trace", response_model=list[InventoryMovementOut])
def trace_blood_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)
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


# ---------------------------------------------------------------------------
# 11. POST /blood-banks/register – PUBLIC registration
# ---------------------------------------------------------------------------
@router.post("/blood-banks/register", response_model=BloodBankRegistrationOut, status_code=status.HTTP_201_CREATED)
def register_blood_bank(
    payload: BloodBankRegistration,
    db: Session = Depends(get_db),
) -> BloodBankRegistrationOut:
    existing_email = db.scalar(select(User).where(User.email == payload.email))
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    bank = BloodBank(
        name=payload.name,
        license_number=payload.license_number,
        contact_person_name=payload.contact_person_name,
        contact_person_cnic=payload.contact_person_cnic,
        contact_number=payload.contact_number,
        email=payload.email,
        city=payload.city,
        area=payload.area,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        hospital_id=payload.hospital_id,
        operating_hours=payload.operating_hours,
        description=payload.description,
        verification_status="pending",
    )
    db.add(bank)
    db.flush()

    admin_user = User(
        full_name=payload.contact_person_name,
        email=payload.email,
        phone=payload.contact_number,
        password_hash=get_password_hash(payload.password),
        role=UserRole.BLOOD_BANK_ADMIN,
        blood_bank_id=bank.id,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(bank)

    return BloodBankRegistrationOut(
        id=bank.id,
        name=bank.name,
        verification_status=bank.verification_status,
        created_at=bank.created_at,
    )


# ---------------------------------------------------------------------------
# 12. GET /blood-banks/public – PUBLIC list approved banks
# ---------------------------------------------------------------------------
@router.get("/blood-banks/public", response_model=list[BloodBankOut])
def list_public_blood_banks(
    city: str | None = None,
    db: Session = Depends(get_db),
) -> list[BloodBankOut]:
    statement = (
        select(BloodBank)
        .where(BloodBank.verification_status == "approved")
        .order_by(BloodBank.name.asc())
    )
    if city:
        statement = statement.where(BloodBank.city == city)
    banks = list(db.scalars(statement).all())
    return [BloodBankOut.model_validate(item) for item in banks]


# ---------------------------------------------------------------------------
# 13. GET /blood-banks/public/{blood_bank_id} – PUBLIC single bank profile
# ---------------------------------------------------------------------------
@router.get("/blood-banks/public/{blood_bank_id}", response_model=BloodBankOut)
def get_public_blood_bank(
    blood_bank_id: int,
    db: Session = Depends(get_db),
) -> BloodBankOut:
    bank = db.get(BloodBank, blood_bank_id)
    if not bank or bank.verification_status != "approved":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")
    return BloodBankOut.model_validate(bank)


# ---------------------------------------------------------------------------
# 14. GET /blood-banks/me – own blood bank profile
# ---------------------------------------------------------------------------
@router.get("/blood-banks/me", response_model=BloodBankOut)
def get_my_blood_bank(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> BloodBankOut:
    bank = _get_own_blood_bank(db, current_user)
    return BloodBankOut.model_validate(bank)


# ---------------------------------------------------------------------------
# 15. PATCH /blood-banks/me – update own blood bank profile
# ---------------------------------------------------------------------------
@router.patch("/blood-banks/me", response_model=BloodBankOut)
def update_my_blood_bank(
    payload: BloodBankProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN)),
) -> BloodBankOut:
    bank = _get_own_blood_bank(db, current_user)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bank, field, value)
    db.commit()
    db.refresh(bank)
    return BloodBankOut.model_validate(bank)


# ---------------------------------------------------------------------------
# 16. PATCH /blood-banks/{blood_bank_id}/admin/status – admin approve/reject/suspend
# ---------------------------------------------------------------------------
@router.patch("/blood-banks/{blood_bank_id}/admin/status", response_model=BloodBankOut)
def update_blood_bank_admin_status(
    blood_bank_id: int,
    payload: BloodBankAdminStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> BloodBankOut:
    bank = db.get(BloodBank, blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    old_status = bank.verification_status
    bank.verification_status = payload.status

    if payload.status == "approved":
        bank.verified_at = datetime.now(timezone.utc)
        bank.last_verified_by_admin_id = current_user.id
        bank.rejection_reason = None
    elif payload.status == "rejected":
        bank.rejection_reason = payload.rejection_reason
        bank.verified_at = None
    elif payload.status == "suspended":
        bank.rejection_reason = payload.rejection_reason

    create_audit_log(
        db,
        admin_user_id=current_user.id,
        action="update_blood_bank_status",
        entity_type="blood_bank",
        entity_id=bank.id,
        details={"old_status": old_status, "new_status": payload.status, "reason": payload.rejection_reason},
    )
    db.commit()
    db.refresh(bank)
    return BloodBankOut.model_validate(bank)


# ---------------------------------------------------------------------------
# 17. GET /blood-banks/admin/all – admin list all banks
# ---------------------------------------------------------------------------
@router.get("/blood-banks/admin/all", response_model=list[BloodBankAdminListItem])
def list_all_blood_banks_admin(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> list[BloodBankAdminListItem]:
    statement = select(BloodBank).order_by(BloodBank.created_at.desc())
    if status_filter:
        statement = statement.where(BloodBank.verification_status == status_filter)
    banks = list(db.scalars(statement).all())

    now = datetime.now(timezone.utc)
    twelve_months = timedelta(days=365)
    results: list[BloodBankAdminListItem] = []
    for bank in banks:
        needs_reverification = True
        if bank.verified_at:
            verified_utc = _coerce_utc(bank.verified_at)
            needs_reverification = (now - verified_utc) > twelve_months
        results.append(
            BloodBankAdminListItem(
                id=bank.id,
                name=bank.name,
                hospital_id=bank.hospital_id,
                city=bank.city,
                area=bank.area,
                contact_number=bank.contact_number,
                email=bank.email,
                address=bank.address,
                license_number=bank.license_number,
                verification_status=bank.verification_status,
                created_at=bank.created_at,
                updated_at=bank.updated_at,
                contact_person_name=bank.contact_person_name,
                contact_person_cnic=bank.contact_person_cnic,
                operating_hours=bank.operating_hours,
                description=bank.description,
                logo_url=bank.logo_url,
                public_stock_visible=bank.public_stock_visible,
                accepts_walkins=bank.accepts_walkins,
                govt_verified=bank.govt_verified,
                verified_at=bank.verified_at,
                last_verified_by_admin_id=bank.last_verified_by_admin_id,
                needs_reverification=needs_reverification,
            )
        )
    return results


# ---------------------------------------------------------------------------
# 18. POST /blood-banks/{blood_bank_id}/quick-stock – bulk stock update
# ---------------------------------------------------------------------------
@router.post("/blood-banks/{blood_bank_id}/quick-stock", response_model=InventorySummaryOut)
def quick_stock_update(
    blood_bank_id: int,
    payload: BulkStockUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> InventorySummaryOut:
    _ensure_blood_bank_scope(current_user, blood_bank_id)
    bank = db.get(BloodBank, blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    for item in payload.units:
        existing_unit = db.scalar(
            select(BloodUnit).where(
                BloodUnit.blood_bank_id == blood_bank_id,
                BloodUnit.blood_group == item.blood_group,
                BloodUnit.status == BloodUnitStatus.AVAILABLE,
                BloodUnit.testing_status == TestingStatus.CLEARED,
            )
        )
        if existing_unit:
            existing_unit.units_available = item.units_available
        else:
            now = datetime.now(timezone.utc)
            new_unit = BloodUnit(
                unit_code="temp",
                qr_code_value="temp",
                blood_bank_id=blood_bank_id,
                blood_group=item.blood_group,
                units_available=item.units_available,
                component_type="whole_blood",
                collected_at=now,
                expires_at=now + timedelta(days=35),
                testing_status=TestingStatus.CLEARED,
                status=BloodUnitStatus.AVAILABLE,
            )
            db.add(new_unit)
            db.flush()
            new_unit.unit_code, new_unit.qr_code_value = _generate_unit_code(blood_bank_id, new_unit.id)

    _touch_stock_update(bank)
    db.commit()

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
        total_units=sum(u.units_available for u in units),
        available_units=sum(u.units_available for u in units if u.status == BloodUnitStatus.AVAILABLE),
        reserved_units=sum(u.units_available for u in units if u.status == BloodUnitStatus.RESERVED),
        expiring_soon_units=sum(u.units_available for u in units if _coerce_utc(u.expires_at) <= expiring_threshold),
        units=[BloodUnitOut.model_validate(u) for u in units[:20]],
    )


# ---------------------------------------------------------------------------
# 19. POST /blood-requests/{request_id}/fulfill – fulfill a request from blood bank
# ---------------------------------------------------------------------------
@router.post("/blood-requests/{request_id}/fulfill", response_model=BloodRequestListOut)
def fulfill_blood_request(
    request_id: int,
    payload: BloodBankFulfillRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> BloodRequestListOut:
    if not current_user.blood_bank_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No blood bank associated")

    bank = db.get(BloodBank, current_user.blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood request not found")
    if request.city != bank.city:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not in your blood bank's city")
    if request.status not in {RequestStatus.APPROVED, RequestStatus.MATCHED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request cannot be fulfilled in its current status")

    compatible_groups = compatible_donor_groups(request.blood_group_needed)
    units_needed = request.units_required

    available_units = list(
        db.scalars(
            select(BloodUnit).where(
                BloodUnit.blood_bank_id == bank.id,
                BloodUnit.blood_group.in_(compatible_groups),
                BloodUnit.status == BloodUnitStatus.AVAILABLE,
                BloodUnit.testing_status == TestingStatus.CLEARED,
            ).order_by(BloodUnit.expires_at.asc())
        ).all()
    )

    total_available = sum(u.units_available for u in available_units)
    if total_available < units_needed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Need {units_needed} units, only {total_available} available.",
        )

    remaining = units_needed
    for unit in available_units:
        if remaining <= 0:
            break
        take = min(unit.units_available, remaining)
        unit.units_available -= take
        remaining -= take

        if unit.units_available == 0:
            unit.status = BloodUnitStatus.ISSUED
        else:
            unit.status = BloodUnitStatus.RESERVED

        movement = InventoryMovement(
            blood_unit_id=unit.id,
            from_blood_bank_id=bank.id,
            issued_to_hospital_id=payload.hospital_id,
            movement_type="issued",
            performed_by=current_user.id,
            notes=payload.notes or f"Fulfilled request #{request.id}",
        )
        db.add(movement)

    request.status = RequestStatus.FULFILLED

    create_notification(
        db,
        user_id=request.created_by_user_id,
        title="Blood request fulfilled",
        message=f"Your blood request #{request.id} for {request.units_required} units of {request.blood_group_needed} has been fulfilled by {bank.name}.",
    )

    _touch_stock_update(bank)
    db.commit()
    db.refresh(request)

    return BloodRequestListOut(**request.__dict__, confirmed_donor_count=count_confirmed_matches(request))


# ---------------------------------------------------------------------------
# 20. POST /blood-requests/{request_id}/confirm-donor-arrival
# ---------------------------------------------------------------------------
@router.post("/blood-requests/{request_id}/confirm-donor-arrival", response_model=ConfirmDonorArrivalOut)
def confirm_donor_arrival(
    request_id: int,
    match_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> ConfirmDonorArrivalOut:
    if not current_user.blood_bank_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No blood bank associated")

    bank = db.get(BloodBank, current_user.blood_bank_id)
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank not found")

    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood request not found")
    if request.city != bank.city:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not in your blood bank's city")

    match = db.get(DonationMatch, match_id)
    if not match or match.request_id != request.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation match not found for this request")

    match.status = MatchStatus.COMPLETED
    match.completed_at = datetime.now(timezone.utc)

    donor = db.get(DonorProfile, match.donor_id)
    if donor:
        create_notification(
            db,
            user_id=donor.user_id,
            title="Donation confirmed",
            message=f"Your donation for request #{request.id} has been confirmed at {bank.name}. Thank you!",
        )

    db.commit()
    return ConfirmDonorArrivalOut(message="Donor arrival confirmed", match_id=match.id)


# ---------------------------------------------------------------------------
# 21. POST /blood-banks/me/drives – create donation drive
# ---------------------------------------------------------------------------
@router.post("/blood-banks/me/drives", response_model=DriveOut, status_code=status.HTTP_201_CREATED)
def create_donation_drive(
    payload: DriveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN)),
) -> DriveOut:
    bank = _get_own_blood_bank(db, current_user)
    drive = BloodBankDonationDrive(
        blood_bank_id=bank.id,
        **payload.model_dump(),
        status=DriveStatus.UPCOMING,
    )
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return DriveOut.model_validate(drive)


# ---------------------------------------------------------------------------
# 22. GET /blood-banks/me/drives – list own donation drives
# ---------------------------------------------------------------------------
@router.get("/blood-banks/me/drives", response_model=list[DriveOut])
def list_donation_drives(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> list[DriveOut]:
    bank = _get_own_blood_bank(db, current_user)
    drives = list(
        db.scalars(
            select(BloodBankDonationDrive)
            .where(BloodBankDonationDrive.blood_bank_id == bank.id)
            .order_by(BloodBankDonationDrive.event_date.desc())
        ).all()
    )
    return [DriveOut.model_validate(d) for d in drives]


# ---------------------------------------------------------------------------
# 23. PATCH /blood-banks/me/drives/{drive_id} – update drive status
# ---------------------------------------------------------------------------
@router.patch("/blood-banks/me/drives/{drive_id}", response_model=DriveOut)
def update_donation_drive(
    drive_id: int,
    payload: DriveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN)),
) -> DriveOut:
    bank = _get_own_blood_bank(db, current_user)
    drive = db.get(BloodBankDonationDrive, drive_id)
    if not drive or drive.blood_bank_id != bank.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    drive.status = payload.status
    db.commit()
    db.refresh(drive)
    return DriveOut.model_validate(drive)


# ---------------------------------------------------------------------------
# 24. POST /blood-banks/me/drives/{drive_id}/register – register for a drive
# ---------------------------------------------------------------------------
@router.post("/blood-banks/me/drives/{drive_id}/register", response_model=DriveRegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_drive(
    drive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> DriveRegistrationOut:
    donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not donor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Donor profile required to register for a drive")

    drive = db.get(BloodBankDonationDrive, drive_id)
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    if drive.status != DriveStatus.UPCOMING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only register for upcoming drives")

    existing = db.scalar(
        select(BloodBankDonationDriveRegistration).where(
            BloodBankDonationDriveRegistration.drive_id == drive_id,
            BloodBankDonationDriveRegistration.donor_id == donor.id,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already registered for this drive")

    registration = BloodBankDonationDriveRegistration(
        drive_id=drive_id,
        donor_id=donor.id,
        status=DriveRegistrationStatus.REGISTERED,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)

    return DriveRegistrationOut(
        id=registration.id,
        drive_id=registration.drive_id,
        donor_id=registration.donor_id,
        status=registration.status.value,
        registered_at=registration.registered_at,
        donor_name=current_user.full_name,
    )


# ---------------------------------------------------------------------------
# 25. GET /blood-banks/me/slots – list appointment slots
# ---------------------------------------------------------------------------
@router.get("/blood-banks/me/slots", response_model=list[SlotOut])
def list_appointment_slots(
    date_filter: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> list[SlotOut]:
    bank = _get_own_blood_bank(db, current_user)
    statement = (
        select(BloodBankAppointmentSlot)
        .where(BloodBankAppointmentSlot.blood_bank_id == bank.id)
        .order_by(BloodBankAppointmentSlot.slot_date.desc(), BloodBankAppointmentSlot.start_time.desc())
    )
    if date_filter:
        statement = statement.where(BloodBankAppointmentSlot.slot_date == date_filter)
    slots = list(db.scalars(statement).all())
    return [SlotOut.model_validate(s) for s in slots]


# ---------------------------------------------------------------------------
# 26. POST /blood-banks/me/slots – create appointment slot
# ---------------------------------------------------------------------------
@router.post("/blood-banks/me/slots", response_model=SlotOut, status_code=status.HTTP_201_CREATED)
def create_appointment_slot(
    payload: SlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN)),
) -> SlotOut:
    bank = _get_own_blood_bank(db, current_user)
    slot = BloodBankAppointmentSlot(
        blood_bank_id=bank.id,
        **payload.model_dump(),
        status=SlotStatus.AVAILABLE,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return SlotOut.model_validate(slot)


# ---------------------------------------------------------------------------
# 27. POST /blood-banks/me/slots/{slot_id}/book – book a slot
# ---------------------------------------------------------------------------
@router.post("/blood-banks/me/slots/{slot_id}/book", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def book_appointment_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
) -> BookingOut:
    donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == current_user.id))
    if not donor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Donor profile required to book an appointment")

    slot = db.get(BloodBankAppointmentSlot, slot_id)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    if slot.status == SlotStatus.FULL:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot is full")
    if slot.status == SlotStatus.CANCELLED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slot is cancelled")

    existing = db.scalar(
        select(BloodBankAppointmentBooking).where(
            BloodBankAppointmentBooking.slot_id == slot_id,
            BloodBankAppointmentBooking.donor_id == donor.id,
            BloodBankAppointmentBooking.status != BookingStatus.CANCELLED,
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already booked this slot")

    booking = BloodBankAppointmentBooking(
        slot_id=slot_id,
        donor_id=donor.id,
        status=BookingStatus.BOOKED,
    )
    db.add(booking)
    slot.booked_count += 1
    if slot.booked_count >= slot.max_donors:
        slot.status = SlotStatus.FULL
    db.commit()
    db.refresh(booking)

    return BookingOut(
        id=booking.id,
        slot_id=booking.slot_id,
        donor_id=booking.donor_id,
        status=booking.status.value,
        booked_at=booking.booked_at,
    )


# ---------------------------------------------------------------------------
# 28. PATCH /blood-banks/me/slots/{slot_id}/bookings/{booking_id} – update booking status
# ---------------------------------------------------------------------------
@router.patch("/blood-banks/me/slots/{slot_id}/bookings/{booking_id}", response_model=BookingOut)
def update_booking_status(
    slot_id: int,
    booking_id: int,
    payload: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> BookingOut:
    bank = _get_own_blood_bank(db, current_user)
    slot = db.get(BloodBankAppointmentSlot, slot_id)
    if not slot or slot.blood_bank_id != bank.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")

    booking = db.get(BloodBankAppointmentBooking, booking_id)
    if not booking or booking.slot_id != slot_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    old_status = booking.status
    booking.status = payload.status

    if payload.status in {BookingStatus.CANCELLED, BookingStatus.NO_SHOW}:
        slot.booked_count = max(0, slot.booked_count - 1)
        if slot.status == SlotStatus.FULL and slot.booked_count < slot.max_donors:
            slot.status = SlotStatus.AVAILABLE

    db.commit()
    db.refresh(booking)

    return BookingOut(
        id=booking.id,
        slot_id=booking.slot_id,
        donor_id=booking.donor_id,
        status=booking.status.value,
        booked_at=booking.booked_at,
    )


# ---------------------------------------------------------------------------
# 29. GET /blood-banks/me/analytics – blood bank analytics
# ---------------------------------------------------------------------------
@router.get("/blood-banks/me/analytics", response_model=BloodBankAnalyticsOut)
def get_blood_bank_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF)),
) -> BloodBankAnalyticsOut:
    bank = _get_own_blood_bank(db, current_user)

    all_units = list(
        db.scalars(
            select(BloodUnit).where(BloodUnit.blood_bank_id == bank.id)
        ).all()
    )
    total_units = len(all_units)
    total_expired = sum(1 for u in all_units if u.status == BloodUnitStatus.EXPIRED)
    expiry_rate = (total_expired / total_units * 100) if total_units > 0 else 0.0

    donations_by_group: dict[str, int] = {}
    for u in all_units:
        donations_by_group[u.blood_group] = donations_by_group.get(u.blood_group, 0) + u.units_available
    total_donations = sum(donations_by_group.values())

    now = datetime.now(timezone.utc)
    donations_by_month: list[dict] = []
    for months_ago in range(11, -1, -1):
        month_start = (now - timedelta(days=30 * months_ago)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if months_ago == 0:
            month_end = now
        else:
            month_end = (now - timedelta(days=30 * (months_ago - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_count = sum(
            1 for u in all_units
            if u.blood_bank_id == bank.id
            and month_start <= _coerce_utc(u.created_at) < month_end
        )
        donations_by_month.append({
            "month": month_start.strftime("%Y-%m"),
            "count": month_count,
        })

    fulfilled_requests = db.scalar(
        select(func.count(BloodRequest.id)).where(
            BloodRequest.city == bank.city,
            BloodRequest.status == RequestStatus.FULFILLED,
        )
    ) or 0
    total_city_requests = db.scalar(
        select(func.count(BloodRequest.id)).where(BloodRequest.city == bank.city)
    ) or 0
    fulfillment_rate = (fulfilled_requests / total_city_requests * 100) if total_city_requests > 0 else 0.0

    return BloodBankAnalyticsOut(
        total_donations=total_donations,
        donations_by_group=donations_by_group,
        donations_by_month=donations_by_month,
        fulfillment_rate=round(fulfillment_rate, 2),
        total_fulfilled=fulfilled_requests,
        total_requests=total_city_requests,
        expiry_rate=round(expiry_rate, 2),
        total_expired=total_expired,
        total_units=total_units,
    )


# ---------------------------------------------------------------------------
# 30. GET /transparency-stats – public transparency and impact statistics
# ---------------------------------------------------------------------------
@router.get("/transparency-stats", response_model=TransparencyStatsOut)
def get_transparency_stats(db: Session = Depends(get_db)):
    """Public transparency and impact statistics — real data from the database."""
    from app.models.user import User, UserRole
    from app.models.donor_profile import DonorProfile
    from app.models.blood_request import BloodRequest
    from app.models.blood_bank import BloodBank
    from app.models.inventory import BloodUnit
    from app.models.institution import Institution
    from app.models.donation_match import DonationMatch
    from app.models.city import City
    from sqlalchemy import func

    total_donors = db.query(func.count(DonorProfile.id)).scalar() or 0
    total_requests_fulfilled = db.query(func.count(BloodRequest.id)).filter(BloodRequest.status == "fulfilled").scalar() or 0
    total_blood_banks = db.query(func.count(BloodBank.id)).filter(BloodBank.verification_status == "approved").scalar() or 0
    govt_verified_banks = db.query(func.count(BloodBank.id)).filter(
        BloodBank.verification_status == "approved", BloodBank.govt_verified == True
    ).scalar() or 0
    total_institutions = db.query(func.count(Institution.id)).filter(Institution.status == "approved").scalar() or 0
    approved_institutions = total_institutions
    total_blood_units = db.query(func.count(BloodUnit.id)).filter(BloodUnit.status == "available").scalar() or 0
    total_matches = db.query(func.count(DonationMatch.id)).scalar() or 0
    cities_covered = db.query(func.count(City.id)).scalar() or 0

    total_requests = db.query(func.count(BloodRequest.id)).scalar() or 0
    fulfillment_rate = round(total_requests_fulfilled / total_requests * 100, 1) if total_requests > 0 else 0.0

    completed_donors = db.query(func.count(DonorProfile.id)).filter(DonorProfile.matches_completed > 0).scalar() or 0
    total_completed = db.query(func.sum(DonorProfile.matches_completed)).scalar() or 0
    total_accepted = db.query(func.sum(DonorProfile.matches_accepted)).scalar() or 0
    avg_reliability = round(total_completed / total_accepted * 100, 1) if total_accepted > 0 else 0.0

    return TransparencyStatsOut(
        total_donors=total_donors,
        total_requests_fulfilled=total_requests_fulfilled,
        total_blood_banks=total_blood_banks,
        govt_verified_blood_banks=govt_verified_banks,
        total_institutions=total_institutions,
        approved_institutions=approved_institutions,
        total_blood_units_available=total_blood_units,
        total_matches_made=total_matches,
        cities_covered=cities_covered,
        requester_fulfillment_rate=fulfillment_rate,
        avg_reliability_score=avg_reliability,
    )


# ---------------------------------------------------------------------------
# 31. PATCH /blood-banks/{blood_bank_id}/admin/govt-verified – admin toggle
# ---------------------------------------------------------------------------
@router.patch("/blood-banks/{blood_bank_id}/admin/govt-verified", response_model=GovtVerifiedOut)
def toggle_govt_verified(
    blood_bank_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
) -> GovtVerifiedOut:
    """Admin-only toggle for Government Health Authority Verified badge."""
    bank = db.query(BloodBank).filter(BloodBank.id == blood_bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Blood bank not found")
    bank.govt_verified = not bank.govt_verified
    db.commit()
    db.refresh(bank)
    create_audit_log(db, current_user.id, "toggle_govt_verified", "blood_bank", blood_bank_id,
                     f"govt_verified={bank.govt_verified}")
    return GovtVerifiedOut(govt_verified=bank.govt_verified)
