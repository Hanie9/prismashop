"""Image storage in the database, plus cleanup of unreferenced assets."""

import re
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.blog_post import BlogPost
from app.models.category import Category
from app.models.media_asset import MediaAsset
from app.models.product import Product
from app.models.site_setting import SiteSetting

CONTENT_TYPES = {
    "webp": "image/webp",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
}

_MEDIA_ID_RE = re.compile(r"/api/media/([0-9a-f]{32})")


def media_url(asset_id: str) -> str:
    base = get_settings().PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/api/media/{asset_id}"


def store_image(db: Session, data: bytes, ext: str) -> MediaAsset:
    asset = MediaAsset(
        id=uuid.uuid4().hex,
        data=data,
        content_type=CONTENT_TYPES.get(ext, "application/octet-stream"),
        ext=ext,
        size=len(data),
    )
    db.add(asset)
    db.flush()
    return asset


def _extract_ids(value) -> set[str]:
    """Collect media ids from a string, list or dict of URLs."""
    found: set[str] = set()
    if isinstance(value, str):
        found.update(_MEDIA_ID_RE.findall(value))
    elif isinstance(value, (list, tuple)):
        for item in value:
            found |= _extract_ids(item)
    elif isinstance(value, dict):
        for item in value.values():
            found |= _extract_ids(item)
    return found


def referenced_media_ids(db: Session) -> set[str]:
    used: set[str] = set()

    for image, images in db.execute(select(Product.image, Product.images)):
        used |= _extract_ids(image)
        used |= _extract_ids(images)

    for (image,) in db.execute(select(Category.image)):
        used |= _extract_ids(image)

    for (cover,) in db.execute(select(BlogPost.cover)):
        used |= _extract_ids(cover)

    row = db.scalar(select(SiteSetting))
    if row is not None:
        used |= _extract_ids(row.hero_images)
        used |= _extract_ids(row.promo_banner)

    return used


def purge_orphan_media(db: Session, *, min_age_hours: int = 24) -> int:
    """Delete stored images that nothing points at anymore.

    Assets newer than ``min_age_hours`` are kept so an image uploaded into a
    form that hasn't been saved yet doesn't disappear underneath the admin.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=min_age_hours)
    candidates = set(
        db.scalars(select(MediaAsset.id).where(MediaAsset.created_at < cutoff)).all()
    )
    orphans = candidates - referenced_media_ids(db)
    if not orphans:
        return 0
    db.execute(delete(MediaAsset).where(MediaAsset.id.in_(orphans)))
    db.commit()
    return len(orphans)
