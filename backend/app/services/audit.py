from sqlalchemy.orm import Session

from app.models import AuditLog


def create_audit_log(
    db: Session,
    *,
    admin_user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int,
    details: dict,
) -> AuditLog:
    log = AuditLog(
        admin_user_id=admin_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(log)
    db.flush()
    return log

