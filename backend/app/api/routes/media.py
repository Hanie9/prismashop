from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.models.admin_user import AdminUser
from app.models.media_asset import MediaAsset
from app.schemas import MessageResponse
from app.services.media import purge_orphan_media

router = APIRouter(tags=["media"])


@router.get("/media/{asset_id}")
def get_media(asset_id: str, db: Session = Depends(get_db)):
    # Allow "<id>.webp" style URLs so browsers infer a sensible file name.
    asset_id = asset_id.split(".")[0]
    asset = db.get(MediaAsset, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="تصویر یافت نشد")

    return Response(
        content=asset.data,
        media_type=asset.content_type,
        headers={
            # Ids are unique per upload, so the bytes never change.
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Length": str(len(asset.data)),
        },
    )


@router.delete("/admin/media/{asset_id}", response_model=MessageResponse)
def delete_media(
    asset_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    asset = db.get(MediaAsset, asset_id.split(".")[0])
    if asset is None:
        raise HTTPException(status_code=404, detail="تصویر یافت نشد")
    db.delete(asset)
    db.commit()
    return MessageResponse(message="تصویر حذف شد")


@router.post("/admin/media/purge", response_model=MessageResponse)
def purge_media(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    removed = purge_orphan_media(db)
    return MessageResponse(message=f"{removed} تصویر بدون استفاده حذف شد")
