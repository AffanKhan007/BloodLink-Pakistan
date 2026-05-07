import re
from datetime import date, datetime, timezone

from fastapi import HTTPException, status


BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
PAKISTANI_PHONE_PATTERN = re.compile(r"^(?:\+92|0)3[0-9]{9}$")
ALLOWED_UPLOAD_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}


def validate_phone_number(phone: str) -> str:
    normalized = phone.strip()
    if not PAKISTANI_PHONE_PATTERN.match(normalized):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone number must be a valid Pakistani mobile number",
        )
    return normalized


def validate_blood_group(blood_group: str) -> str:
    normalized = blood_group.strip().upper()
    if normalized not in BLOOD_GROUPS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid blood group")
    return normalized


def validate_last_donation_date(last_donation_date: date | None) -> date | None:
    if last_donation_date and last_donation_date > date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Last donation date cannot be in the future")
    return last_donation_date


def validate_required_by(required_by: datetime) -> datetime:
    now = datetime.now(timezone.utc)
    if required_by.tzinfo is None:
        required_by = required_by.replace(tzinfo=timezone.utc)
    if required_by < now:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Required by date/time cannot be in the past")
    return required_by

