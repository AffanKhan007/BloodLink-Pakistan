from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import BloodRequest, Chat, DonationMatch, DonorProfile, Institution, User, UserRole
from app.models.report import Report, ReportedType
from app.schemas.chat import ChatMessageOut
from app.schemas.report import AdminConversationPreview
from app.schemas.user import ChatUserSummary


ADMIN_ROLES = (UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_AGENT)
REPORTS_MAX_PER_HOUR = 10
DUPLICATE_WINDOW = timedelta(hours=1)



def build_conversation_preview_for_admin(chat: Chat) -> AdminConversationPreview:
    return AdminConversationPreview(
        id=chat.id,
        request_id=chat.request_id,
        subject=chat.subject,
        participant_one=ChatUserSummary.model_validate(chat.participant_one),
        participant_two=ChatUserSummary.model_validate(chat.participant_two),
        messages=[ChatMessageOut.model_validate(message) for message in chat.messages],
    )


def ensure_can_report_request(db: Session, user: User, request_id: int) -> BloodRequest:
    request = db.get(BloodRequest, request_id)
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if user.role in ADMIN_ROLES:
        return request
    if request.created_by_user_id == user.id:
        return request
    donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == user.id))
    if donor:
        owned_match = db.scalar(
            select(DonationMatch).where(DonationMatch.request_id == request_id, DonationMatch.donor_id == donor.id)
        )
        if owned_match:
            return request
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def ensure_can_report_conversation(db: Session, user: User, chat_id: int) -> Chat:
    chat = db.scalar(
        select(Chat)
        .options(
            joinedload(Chat.participant_one),
            joinedload(Chat.participant_two),
            joinedload(Chat.messages),
        )
        .where(Chat.id == chat_id)
    )
    if not chat or user.id not in {chat.participant_one_id, chat.participant_two_id}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return chat


def validate_report_target(db: Session, user: User, reported_type: ReportedType, reported_id: int) -> None:
    if reported_type == ReportedType.REQUEST:
        ensure_can_report_request(db, user, reported_id)
        return
    if reported_type == ReportedType.CONVERSATION:
        ensure_can_report_conversation(db, user, reported_id)
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="This report type is not supported yet",
    )


def enforce_rate_limits(db: Session, reporter_id: int, reported_type: ReportedType, reported_id: int) -> None:
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_count = db.scalar(
        select(func.count(Report.id)).where(
            Report.reporter_id == reporter_id,
            Report.created_at >= one_hour_ago,
        )
    )
    if (recent_count or 0) >= REPORTS_MAX_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many reports submitted recently. Please try again later.",
        )

    duplicate_cutoff = datetime.now(timezone.utc) - DUPLICATE_WINDOW
    duplicate = db.scalar(
        select(Report.id).where(
            Report.reporter_id == reporter_id,
            Report.reported_type == reported_type,
            Report.reported_id == reported_id,
            Report.created_at >= duplicate_cutoff,
        )
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already reported this recently. Please wait before submitting again.",
        )


def notify_admins_of_report(db: Session, report: Report, reporter: User) -> None:
    admin_ids = list(
        db.scalars(select(User.id).where(User.role.in_(ADMIN_ROLES), User.is_active.is_(True))).all()
    )
    entity_label = resolve_entity_label(db, report.reported_type, report.reported_id)
    for admin_id in admin_ids:
        from app.services.notifications import create_notification

        create_notification(
            db,
            user_id=admin_id,
            title="New moderation report",
            message=(
                f"{reporter.full_name} reported {report.reported_type.value.replace('_', ' ')} "
                f"#{report.reported_id} ({entity_label}) for {report.reason.value.replace('_', ' ')}."
            ),
        )


def resolve_entity_label(db: Session, reported_type: ReportedType, reported_id: int) -> str:
    if reported_type == ReportedType.REQUEST:
        request = db.get(BloodRequest, reported_id)
        if request:
            return f"{request.patient_name} · {request.blood_group_needed} · {request.city}"
        return f"Request #{reported_id}"
    if reported_type == ReportedType.CONVERSATION:
        chat = db.scalar(
            select(Chat)
            .options(joinedload(Chat.participant_one), joinedload(Chat.participant_two))
            .where(Chat.id == reported_id)
        )
        if chat:
            return f"{chat.participant_one.full_name} ↔ {chat.participant_two.full_name}"
        return f"Conversation #{reported_id}"
    if reported_type == ReportedType.USER:
        user = db.get(User, reported_id)
        return user.full_name if user else f"User #{reported_id}"
    if reported_type == ReportedType.INSTITUTION:
        institution = db.scalar(select(Institution).where(Institution.id == reported_id))
        return institution.institution_name if institution else f"Institution #{reported_id}"
    return f"{reported_type.value} #{reported_id}"


def resolve_entity_admin_path(reported_type: ReportedType, reported_id: int, request_id: int | None = None) -> str | None:
    if reported_type == ReportedType.REQUEST:
        return f"/admin/requests?open={reported_id}"
    if reported_type == ReportedType.CONVERSATION and request_id:
        return f"/admin/requests?open={request_id}"
    return None


def resolve_reported_entity(db: Session, report: Report) -> dict:
    label = resolve_entity_label(db, report.reported_type, report.reported_id)
    summary = None
    admin_path = resolve_entity_admin_path(report.reported_type, report.reported_id)
    request_id = None
    conversation = None

    if report.reported_type == ReportedType.REQUEST:
        request = db.get(BloodRequest, report.reported_id)
        if request:
            summary = f"{request.hospital_name} · {request.status.value.replace('_', ' ')}"
            admin_path = resolve_entity_admin_path(ReportedType.REQUEST, request.id)
    elif report.reported_type == ReportedType.CONVERSATION:
        chat = db.scalar(
            select(Chat)
            .options(
                joinedload(Chat.participant_one),
                joinedload(Chat.participant_two),
                joinedload(Chat.messages),
            )
            .where(Chat.id == report.reported_id)
        )
        if chat:
            request_id = chat.request_id
            summary = chat.subject or "BloodLink conversation"
            admin_path = resolve_entity_admin_path(ReportedType.CONVERSATION, chat.id, chat.request_id)
            conversation = build_conversation_preview_for_admin(chat)

    return {
        "reported_type": report.reported_type,
        "reported_id": report.reported_id,
        "label": label,
        "summary": summary,
        "admin_path": admin_path,
        "request_id": request_id,
        "conversation": conversation,
    }
