import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_admin
from app.core.config import get_settings
from app.models.admin_user import AdminUser
from app.schemas import UploadResponse
from app.services.images import MAX_UPLOAD_BYTES, compress_image

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    _: AdminUser = Depends(get_current_admin),
):
    settings = get_settings()
    if file.content_type not in ALLOWED_CONTENT:
        raise HTTPException(status_code=400, detail="فرمت تصویر مجاز نیست")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="حجم فایل بیش از حد مجاز است")

    try:
        data, ext = compress_image(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="پردازش تصویر ناموفق بود") from exc

    upload_dir = settings.upload_path
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest: Path = upload_dir / filename
    dest.write_bytes(data)

    url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{filename}"
    return UploadResponse(url=url)
