import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image

from app.api.deps import get_current_admin
from app.core.config import get_settings
from app.models.admin_user import AdminUser
from app.schemas import UploadResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024
MAX_DIMENSION = 1200


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    _: AdminUser = Depends(get_current_admin),
):
    settings = get_settings()
    if file.content_type not in ALLOWED_CONTENT:
        raise HTTPException(status_code=400, detail="فرمت تصویر مجاز نیست")

    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="حجم فایل بیش از حد مجاز است")

    upload_dir = settings.upload_path
    filename = f"{uuid.uuid4().hex}.jpg"
    dest: Path = upload_dir / filename

    try:
        from io import BytesIO

        img = Image.open(BytesIO(raw))
        img = img.convert("RGB")
        w, h = img.size
        scale = min(1.0, MAX_DIMENSION / max(w, h))
        if scale < 1.0:
            img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

        quality = 85
        while quality >= 40:
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=quality, optimize=True)
            data = buf.getvalue()
            if len(data) <= 900_000 or quality <= 40:
                dest.write_bytes(data)
                break
            quality -= 10
    except Exception as exc:
        raise HTTPException(status_code=400, detail="پردازش تصویر ناموفق بود") from exc

    url = f"{settings.PUBLIC_BASE_URL.rstrip('/')}/uploads/{filename}"
    return UploadResponse(url=url)
