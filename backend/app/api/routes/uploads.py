from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.admin_user import AdminUser
from app.schemas import UploadResponse
from app.services.images import MAX_UPLOAD_BYTES, compress_image
from app.services.media import media_url, store_image

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    if file.content_type not in ALLOWED_CONTENT:
        raise HTTPException(status_code=400, detail="فرمت تصویر مجاز نیست")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="حجم فایل بیش از حد مجاز است")

    try:
        data, ext = compress_image(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="پردازش تصویر ناموفق بود") from exc

    asset = store_image(db, data, ext)
    db.commit()
    return UploadResponse(url=media_url(asset.id))
