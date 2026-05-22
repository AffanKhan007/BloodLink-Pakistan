from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.models import BloodBank, BloodRequest, Chat, ChatMessage, DonationMatch, DonorProfile, Institution, InstitutionStatus, User, UserRole
from app.schemas.chat import ChatCreate, ChatDetailOut, ChatMessageCreate, ChatMessageOut, ChatSummaryOut
from app.schemas.user import ChatUserSummary
from app.services.chat_realtime import chat_connection_manager
from app.services.matching import compatible_donor_groups
from app.services.notifications import create_notification


router = APIRouter(prefix="/chats", tags=["chats"])


def _counterpart(chat: Chat, current_user_id: int) -> User:
    return chat.participant_two if chat.participant_one_id == current_user_id else chat.participant_one


def _build_chat_summary(chat: Chat, current_user_id: int) -> ChatSummaryOut:
    counterpart = _counterpart(chat, current_user_id)
    last_message = chat.messages[-1] if chat.messages else None
    return ChatSummaryOut(
        id=chat.id,
        request_id=chat.request_id,
        subject=chat.subject,
        counterpart=ChatUserSummary.model_validate(counterpart),
        last_message=last_message.message if last_message else None,
        last_message_at=last_message.created_at if last_message else None,
        unread_count=0,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
    )


def _build_chat_detail(chat: Chat, current_user_id: int) -> ChatDetailOut:
    counterpart = _counterpart(chat, current_user_id)
    return ChatDetailOut(
        id=chat.id,
        request_id=chat.request_id,
        subject=chat.subject,
        counterpart=ChatUserSummary.model_validate(counterpart),
        messages=[ChatMessageOut.model_validate(message) for message in chat.messages],
        created_at=chat.created_at,
        updated_at=chat.updated_at,
    )


def _serialize_message(message: ChatMessage) -> dict:
    return ChatMessageOut.model_validate(message).model_dump(mode="json")


def _get_institution_profile(db: Session, user_id: int) -> Institution | None:
    return db.scalar(select(Institution).where(Institution.user_id == user_id))


def _ensure_institution_approved(db: Session, user: User) -> None:
    if user.role != UserRole.INSTITUTION_DONOR:
        return
    institution = _get_institution_profile(db, user.id)
    if institution is None or institution.status != InstitutionStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Institution approval is required before using messaging.",
        )


async def _broadcast_chat_message(chat: Chat, message: ChatMessage) -> None:
    await chat_connection_manager.broadcast(
        chat.id,
        {
            "type": "chat.message",
            "chat_id": chat.id,
            "request_id": chat.request_id,
            "subject": chat.subject,
            "message": _serialize_message(message),
        },
    )


def _schedule_broadcast(chat: Chat, message: ChatMessage) -> None:
    awaitable = _broadcast_chat_message(chat, message)
    try:
        import asyncio

        loop = asyncio.get_running_loop()
        loop.create_task(awaitable)
    except RuntimeError:
        import asyncio

        asyncio.run(awaitable)


def _validate_receiver_chat_target(db: Session, receiver: User, target_user: User, request_id: int | None) -> str | None:
    if request_id is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Request context is required")
    request = db.get(BloodRequest, request_id)
    if not request or request.created_by_user_id != receiver.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    if target_user.role == UserRole.DONOR:
        donor = db.scalar(select(DonorProfile).where(DonorProfile.user_id == target_user.id))
        if donor is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donor profile not found")
        existing_match = db.scalar(
            select(DonationMatch)
            .where(DonationMatch.request_id == request.id)
            .where(DonationMatch.donor_id == donor.id)
        )
        compatible_groups = compatible_donor_groups(request.blood_group_needed)
        if existing_match or (
            donor.is_publicly_available
            and donor.availability_status == "available"
            and donor.city == request.city
            and donor.blood_group in compatible_groups
        ):
            return request.patient_name
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot contact this donor")

    if target_user.role in {UserRole.BLOOD_BANK_ADMIN, UserRole.BLOOD_BANK_STAFF}:
        if not target_user.blood_bank_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blood bank contact not found")
        bank = db.get(BloodBank, target_user.blood_bank_id)
        if not bank or bank.city != request.city:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot contact this blood bank")
        return request.patient_name

    if target_user.role == UserRole.INSTITUTION_DONOR:
        institution = _get_institution_profile(db, target_user.id)
        if (
            not institution
            or institution.city != request.city
            or institution.status != InstitutionStatus.APPROVED
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot contact this institution")
        return request.patient_name

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unsupported chat target")


@router.get("", response_model=list[ChatSummaryOut])
def list_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatSummaryOut]:
    _ensure_institution_approved(db, current_user)
    chats = list(
        db.scalars(
            select(Chat)
            .options(
                joinedload(Chat.participant_one),
                joinedload(Chat.participant_two),
                joinedload(Chat.messages),
            )
            .where(or_(Chat.participant_one_id == current_user.id, Chat.participant_two_id == current_user.id))
            .order_by(Chat.updated_at.desc())
        ).unique().all()
    )
    return [_build_chat_summary(chat, current_user.id) for chat in chats]


@router.post("", response_model=ChatDetailOut, status_code=status.HTTP_201_CREATED)
def create_chat(
    payload: ChatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatDetailOut:
    if current_user.role != UserRole.RECEIVER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only receivers can start new conversations")
    target_user = db.get(User, payload.target_user_id)
    if not target_user or not target_user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")

    subject = payload.subject or _validate_receiver_chat_target(db, current_user, target_user, payload.request_id)
    chat = db.scalar(
        select(Chat)
        .options(joinedload(Chat.participant_one), joinedload(Chat.participant_two), joinedload(Chat.messages))
        .where(
            or_(
                and_(Chat.participant_one_id == current_user.id, Chat.participant_two_id == target_user.id),
                and_(Chat.participant_one_id == target_user.id, Chat.participant_two_id == current_user.id),
            )
        )
        .where(Chat.request_id == payload.request_id)
    )
    if chat is None:
        chat = Chat(
            participant_one_id=current_user.id,
            participant_two_id=target_user.id,
            request_id=payload.request_id,
            subject=subject,
        )
        db.add(chat)
        db.flush()

    message = ChatMessage(chat_id=chat.id, sender_id=current_user.id, message=payload.initial_message)
    db.add(message)
    chat.updated_at = datetime.now(timezone.utc)
    create_notification(
        db,
        user_id=target_user.id,
        title="New chat message",
        message=f"{current_user.full_name} sent you a message in BloodLink.",
    )
    db.commit()
    db.refresh(chat)
    db.refresh(message)
    chat = db.scalar(
        select(Chat)
        .options(joinedload(Chat.participant_one), joinedload(Chat.participant_two), joinedload(Chat.messages))
        .where(Chat.id == chat.id)
    )
    _schedule_broadcast(chat, message)
    return _build_chat_detail(chat, current_user.id)


@router.get("/{chat_id}", response_model=ChatDetailOut)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatDetailOut:
    _ensure_institution_approved(db, current_user)
    chat = db.scalar(
        select(Chat)
        .options(joinedload(Chat.participant_one), joinedload(Chat.participant_two), joinedload(Chat.messages))
        .where(Chat.id == chat_id)
    )
    if not chat or current_user.id not in {chat.participant_one_id, chat.participant_two_id}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return _build_chat_detail(chat, current_user.id)


@router.post("/{chat_id}/messages", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def send_message(
    chat_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageOut:
    _ensure_institution_approved(db, current_user)
    chat = db.get(Chat, chat_id)
    if not chat or current_user.id not in {chat.participant_one_id, chat.participant_two_id}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    other_user_id = chat.participant_two_id if chat.participant_one_id == current_user.id else chat.participant_one_id
    message = ChatMessage(chat_id=chat.id, sender_id=current_user.id, message=payload.message)
    db.add(message)
    chat.updated_at = datetime.now(timezone.utc)
    create_notification(
        db,
        user_id=other_user_id,
        title="New chat reply",
        message=f"{current_user.full_name} replied in your BloodLink conversation.",
    )
    db.commit()
    db.refresh(message)
    db.refresh(chat)
    _schedule_broadcast(chat, message)
    return ChatMessageOut.model_validate(message)


def _get_websocket_user(db: Session, token: str | None) -> User:
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except Exception as exc:
        raise credentials_exception from exc

    user = db.get(User, int(subject))
    if not user or not user.is_active:
        raise credentials_exception
    return user


@router.websocket("/ws/{chat_id}")
async def chat_websocket(
    websocket: WebSocket,
    chat_id: int,
    db: Session = Depends(get_db),
    token: str = Query(default=""),
) -> None:
    try:
        current_user = _get_websocket_user(db, token)
        _ensure_institution_approved(db, current_user)
    except HTTPException:
        await websocket.close(code=1008)
        return

    chat = db.scalar(select(Chat).where(Chat.id == chat_id))
    if not chat or current_user.id not in {chat.participant_one_id, chat.participant_two_id}:
        await websocket.close(code=1008)
        return

    try:
        await chat_connection_manager.connect(chat_id, websocket)
        await websocket.send_json({"type": "chat.connected", "chat_id": chat_id})

        while True:
            payload = await websocket.receive_json()
            message_text = str(payload.get("message", "")).strip()
            if not message_text:
                await websocket.send_json({"type": "chat.error", "detail": "Message cannot be empty"})
                continue

            message = ChatMessage(chat_id=chat.id, sender_id=current_user.id, message=message_text)
            db.add(message)
            other_user_id = chat.participant_two_id if chat.participant_one_id == current_user.id else chat.participant_one_id
            chat.updated_at = datetime.now(timezone.utc)
            create_notification(
                db,
                user_id=other_user_id,
                title="New chat reply",
                message=f"{current_user.full_name} replied in your BloodLink conversation.",
            )
            db.commit()
            db.refresh(message)
            db.refresh(chat)
            await _broadcast_chat_message(chat, message)
    except WebSocketDisconnect:
        pass
    finally:
        chat_connection_manager.disconnect(chat_id, websocket)
