import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import RequestDocument, User, UserRole


router = APIRouter(prefix="/uploads", tags=["uploads"])
settings = get_settings()


@router.get("/request-documents/{document_id}")
def get_request_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.get(RequestDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    request = document.request
    if current_user.role == UserRole.USER and request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = os.path.join(settings.upload_dir, document.file_url)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Stored file missing")
    return FileResponse(path=file_path, filename=document.file_url)

