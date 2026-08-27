"""Move images that still live on disk into the database.

Run with: python -m app.seed.migrate_media [--public-dir ../public]

Rewrites every image reference (products, categories, blog covers, hero images,
promo banner) from a file path / uploads URL to an /api/media/<id> URL.
Safe to run repeatedly — already-migrated references are skipped.
"""

from __future__ import annotations

import base64
import sys
from pathlib import Path
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.schema import ensure_schema
from app.models.blog_post import BlogPost
from app.models.category import Category
from app.models.product import Product
from app.models.site_setting import SiteSetting
from app.services.images import compress_image
from app.services.media import media_url, store_image

EXT_BY_SUFFIX = {".jpg": "jpeg", ".jpeg": "jpeg", ".png": "png", ".webp": "webp", ".gif": "gif"}


def _local_path(ref: str, public_dir: Path, upload_dir: Path) -> Path | None:
    """Map an image reference to a file on disk, or None if not local."""
    if not ref or "/api/media/" in ref:
        return None

    path = urlparse(ref).path if ref.startswith("http") else ref
    if not path.startswith("/"):
        return None

    if path.startswith("/uploads/"):
        candidate = upload_dir / path[len("/uploads/") :]
    else:
        candidate = public_dir / path.lstrip("/")

    return candidate if candidate.is_file() else None


class Migrator:
    def __init__(self, db, public_dir: Path, upload_dir: Path):
        self.db = db
        self.public_dir = public_dir
        self.upload_dir = upload_dir
        self.cache: dict[str, str] = {}
        self.moved = 0
        self.missing: list[str] = []

    def _read_source(self, ref: str) -> tuple[bytes, str] | None:
        """Fetch the raw bytes behind a reference and a fallback extension."""
        if ref.startswith("data:"):
            header, _, payload = ref.partition(",")
            if not payload:
                return None
            try:
                raw = base64.b64decode(payload)
            except Exception:
                return None
            ext = "webp"
            if "/" in header:
                ext = header.split("/")[1].split(";")[0] or "webp"
            return raw, ext

        source = _local_path(ref, self.public_dir, self.upload_dir)
        if source is not None:
            return source.read_bytes(), EXT_BY_SUFFIX.get(source.suffix.lower(), "webp")

        if ref.startswith("http"):
            try:
                import httpx

                res = httpx.get(ref, timeout=30, follow_redirects=True)
                res.raise_for_status()
                return res.content, "webp"
            except Exception as exc:
                print(f"  ! download failed: {ref} ({exc})")
                return None

        return None

    def convert(self, ref: str) -> str:
        """Return the /api/media URL for a reference, importing it if needed."""
        if not isinstance(ref, str) or not ref.strip():
            return ref
        if "/api/media/" in ref:
            return ref
        if ref in self.cache:
            return self.cache[ref]

        found = self._read_source(ref)
        if found is None:
            self.missing.append(ref[:80])
            return ref

        raw, fallback_ext = found
        try:
            data, ext = compress_image(raw)
        except Exception:
            data, ext = raw, fallback_ext

        asset = store_image(self.db, data, ext)
        url = media_url(asset.id)
        self.cache[ref] = url
        self.moved += 1
        print(f"  {ref[:70]} -> {url}")
        return url


def migrate(public_dir: Path) -> None:
    ensure_schema()
    upload_dir = get_settings().upload_path

    with SessionLocal() as db:
        m = Migrator(db, public_dir, upload_dir)

        print("Products:")
        for product in db.scalars(select(Product)):
            product.image = m.convert(product.image)
            product.images = [m.convert(i) for i in (product.images or [])]

        print("Categories:")
        for category in db.scalars(select(Category)):
            category.image = m.convert(category.image)

        print("Blog covers:")
        for post in db.scalars(select(BlogPost)):
            post.cover = m.convert(post.cover)

        print("Site settings:")
        row = db.scalar(select(SiteSetting))
        if row is not None:
            row.hero_images = [m.convert(i) for i in (row.hero_images or [])]
            flag_modified(row, "hero_images")

            banner = dict(row.promo_banner or {})
            if banner.get("images"):
                banner["images"] = [m.convert(i) for i in banner["images"]]
                row.promo_banner = banner
                flag_modified(row, "promo_banner")

        db.commit()

        print(f"\nMoved {m.moved} image(s) into the database.")
        if m.missing:
            print("Could not find these files on disk (left unchanged):")
            for ref in dict.fromkeys(m.missing):
                print(f"  {ref}")


if __name__ == "__main__":
    args = sys.argv[1:]
    default_public = Path(__file__).resolve().parents[3] / "public"
    if "--public-dir" in args:
        default_public = Path(args[args.index("--public-dir") + 1]).resolve()
    print(f"Public dir: {default_public}")
    migrate(default_public)
