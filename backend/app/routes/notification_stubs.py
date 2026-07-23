from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notification-stubs", tags=["notification-stubs"])

@router.post("/sms/send")
def mock_send_sms(
    phone: str = "",
    message: str = "",
    current_user: User = Depends(get_current_user),
):
    """MOCKED — SMS notification stub. Does NOT actually send SMS."""
    return {
        "status": "mocked",
        "provider": "local",
        "detail": "SMS sending is mocked in this MVP. No real message was sent.",
        "to": phone,
        "body_preview": message[:80],
    }

@router.post("/whatsapp/send")
def mock_send_whatsapp(
    phone: str = "",
    message: str = "",
    current_user: User = Depends(get_current_user),
):
    """MOCKED — WhatsApp notification stub. Does NOT actually send WhatsApp messages."""
    wa_link = f"https://wa.me/{phone.replace('+', '').replace('-', '').replace(' ', '')}?text={message[:100]}"
    return {
        "status": "mocked",
        "provider": "wa.me-deep-link",
        "detail": "WhatsApp notifications are mocked in this MVP. Returning a wa.me deep link instead.",
        "wa_link": wa_link,
        "to": phone,
        "body_preview": message[:80],
    }

@router.get("/delivery-log")
def mock_delivery_log(
    current_user: User = Depends(get_current_user),
):
    """MOCKED — Returns a hardcoded notification delivery log."""
    return [
        {"id": 1, "channel": "sms", "to": "+92-300-1234567", "status": "delivered", "preview": "Your blood request has been matched...", "sent_at": "2025-12-15T10:30:00"},
        {"id": 2, "channel": "whatsapp", "to": "+92-321-7654321", "status": "delivered", "preview": "Donor Ali accepted your match...", "sent_at": "2025-12-15T11:00:00"},
        {"id": 3, "channel": "sms", "to": "+92-333-1111222", "status": "failed", "preview": "Reminder: Your donation drive...", "sent_at": "2025-12-15T14:00:00"},
        {"id": 4, "channel": "whatsapp", "to": "+92-345-9998888", "status": "pending", "preview": "New urgent request in your city...", "sent_at": "2025-12-15T15:30:00"},
        {"id": 5, "channel": "in_app", "to": "user:5", "status": "delivered", "preview": "Your blood request status changed to fulfilled", "sent_at": "2025-12-15T16:00:00"},
    ]
