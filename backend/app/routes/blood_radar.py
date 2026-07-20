import math
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import BloodBank, BloodBankDonationDrive, BloodUnit, DonorProfile, DriveStatus, User
from app.services.matching import compatible_donor_groups

router = APIRouter(tags=["blood-radar"])

EARTH_RADIUS_KM = 6371.0
DONATION_COOLDOWN_DAYS = 90


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in km between two lat/lng points."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlng / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


class BloodBankRadarItem(BaseModel):
    id: int
    name: str
    city: str
    area: str | None = None
    address: str | None = None
    contact_number: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    available_units: int
    blood_group: str
    distance_km: float | None = None
    last_updated: str | None = None


class DonorRadarItem(BaseModel):
    anon_id: str
    blood_group: str
    city: str
    area: str | None = None
    verified: bool
    distance_km: float | None = None
    latitude: float | None = None
    longitude: float | None = None


class DriveRadarItem(BaseModel):
    id: int
    blood_bank_name: str
    title: str
    event_date: date
    start_time: str
    end_time: str
    city: str
    location_address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    target_blood_groups: str | None = None
    days_until: int


class BloodRadarResponse(BaseModel):
    blood_group: str
    city: str
    user_lat: float | None = None
    user_lng: float | None = None
    blood_banks: list[BloodBankRadarItem] = []
    donors: list[DonorRadarItem] = []
    drives: list[DriveRadarItem] = []


@router.get("/blood-radar", response_model=BloodRadarResponse)
def get_blood_radar(
    blood_group: str = Query(..., min_length=2, max_length=5),
    city: str = Query(..., min_length=1, max_length=120),
    lat: float | None = Query(default=None),
    lng: float | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> BloodRadarResponse:
    user_lat = _safe_float(lat)
    user_lng = _safe_float(lng)
    has_coords = user_lat is not None and user_lng is not None

    today = date.today()
    cooldown_cutoff = today - timedelta(days=DONATION_COOLDOWN_DAYS)

    compatible_groups = compatible_donor_groups(blood_group)

    # ── Blood Banks ──────────────────────────────────────────────────
    bank_rows = db.scalars(
        select(BloodBank)
        .where(BloodBank.city == city)
        .where(BloodBank.verification_status == "approved")
    ).all()

    bank_results: list[BloodBankRadarItem] = []
    for bank in bank_rows:
        bank_lat = _safe_float(bank.latitude)
        bank_lng = _safe_float(bank.longitude)
        total_available = 0
        latest_unit_time: str | None = None

        units = db.scalars(
            select(BloodUnit)
            .where(BloodUnit.blood_bank_id == bank.id)
            .where(BloodUnit.blood_group == blood_group)
            .where(BloodUnit.status == "available")
        ).all()
        total_available = len(units)
        if units and bank.updated_at:
            diff = datetime.now(timezone.utc) - bank.updated_at.replace(tzinfo=timezone.utc)
            hours = int(diff.total_seconds() // 3600)
            if hours < 1:
                latest_unit_time = "just now"
            elif hours < 24:
                latest_unit_time = f"{hours}h ago"
            else:
                latest_unit_time = f"{hours // 24}d ago"

        dist = None
        if has_coords and bank_lat is not None and bank_lng is not None:
            dist = round(_haversine(user_lat, user_lng, bank_lat, bank_lng), 1)

        bank_results.append(BloodBankRadarItem(
            id=bank.id,
            name=bank.name,
            city=bank.city,
            area=bank.area,
            address=bank.address,
            contact_number=bank.contact_number,
            latitude=bank_lat,
            longitude=bank_lng,
            available_units=total_available,
            blood_group=blood_group,
            distance_km=dist,
            last_updated=latest_unit_time,
        ))

    if has_coords:
        bank_results.sort(key=lambda b: b.distance_km if b.distance_km is not None else 9999)
    else:
        bank_results.sort(key=lambda b: b.available_units, reverse=True)

    # ── Donors ───────────────────────────────────────────────────────
    donor_rows = db.scalars(
        select(DonorProfile)
        .where(DonorProfile.city == city)
        .where(DonorProfile.blood_group.in_(compatible_groups))
        .where(DonorProfile.availability_status == "available")
        .where(DonorProfile.verification_status == "approved")
        .where(DonorProfile.location_opt_in == True)  # noqa: E712
        .where(DonorProfile.latitude.isnot(None))
        .where(DonorProfile.longitude.isnot(None))
        .where(or_(DonorProfile.last_donation_date.is_(None), DonorProfile.last_donation_date <= cooldown_cutoff))
    ).all()

    donor_results: list[DonorRadarItem] = []
    for dp in donor_rows:
        dp_lat = _safe_float(dp.latitude)
        dp_lng = _safe_float(dp.longitude)
        dist = None
        display_lat = None
        display_lng = None
        if has_coords and dp_lat is not None and dp_lng is not None:
            dist = round(_haversine(user_lat, user_lng, dp_lat, dp_lng), 1)
            jitter_lat = dp_lat + (hash(str(dp.id)) % 100 - 50) * 0.001
            jitter_lng = dp_lng + (hash(str(dp.id + 9999)) % 100 - 50) * 0.001
            display_lat = round(jitter_lat, 6)
            display_lng = round(jitter_lng, 6)

        donor_results.append(DonorRadarItem(
            anon_id=f"D-{dp.id:04d}",
            blood_group=dp.blood_group,
            city=dp.city,
            area=dp.area,
            verified=dp.verification_status == "approved",
            distance_km=dist,
            latitude=display_lat,
            longitude=display_lng,
        ))

    if has_coords:
        donor_results.sort(key=lambda d: d.distance_km if d.distance_km is not None else 9999)
    else:
        pass

    # ── Drives ───────────────────────────────────────────────────────
    drive_rows = db.scalars(
        select(BloodBankDonationDrive)
        .where(BloodBankDonationDrive.city == city)
        .where(BloodBankDonationDrive.status.in_([DriveStatus.UPCOMING, DriveStatus.ACTIVE]))
        .where(BloodBankDonationDrive.event_date >= today)
    ).all()

    drive_results: list[DriveRadarItem] = []
    for drive in drive_rows:
        target_groups = (drive.target_blood_groups or "").replace(" ", "").split(",")
        if blood_group not in target_groups and "*" not in target_groups and "" not in target_groups:
            continue
        bank = db.get(BloodBank, drive.blood_bank_id)
        bank_lat = _safe_float(bank.latitude) if bank else None
        bank_lng = _safe_float(bank.longitude) if bank else None
        diff_days = (drive.event_date - today).days
        drive_results.append(DriveRadarItem(
            id=drive.id,
            blood_bank_name=bank.name if bank else "",
            title=drive.title,
            event_date=drive.event_date,
            start_time=str(drive.start_time),
            end_time=str(drive.end_time),
            city=drive.city,
            location_address=drive.location_address,
            latitude=bank_lat,
            longitude=bank_lng,
            target_blood_groups=drive.target_blood_groups,
            days_until=diff_days,
        ))

    drive_results.sort(key=lambda d: d.days_until)

    return BloodRadarResponse(
        blood_group=blood_group,
        city=city,
        user_lat=user_lat,
        user_lng=user_lng,
        blood_banks=bank_results,
        donors=donor_results,
        drives=drive_results,
    )
