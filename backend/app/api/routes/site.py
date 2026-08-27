import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.site_page import SitePage
from app.models.site_setting import SiteSetting
from app.schemas import (
    MessageResponse,
    SitePageCreate,
    SitePageOut,
    SitePageUpdate,
    SiteSettingsOut,
    SiteSettingsUpdate,
)
from app.services.site import get_or_create_settings

router = APIRouter(tags=["site"])

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def _normalize_slug(value: str) -> str:
    slug = value.strip().lower().replace("_", "-")
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    if not slug or not SLUG_RE.fullmatch(slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شناسه صفحه باید فقط حروف انگلیسی کوچک، عدد و خط تیره باشد",
        )
    return slug


def _serialize_settings(row: SiteSetting) -> SiteSettingsOut:
    return SiteSettingsOut.model_validate(
        {
            "brand_name": row.brand_name,
            "brand_tagline": row.brand_tagline,
            "copyright_text": row.copyright_text,
            "contact_phone": row.contact_phone,
            "contact_phone_link": row.contact_phone_link,
            "contact_email": row.contact_email,
            "contact_address": row.contact_address,
            "working_hours": row.working_hours,
            "social_links": list(row.social_links or []),
            "hero_images": list(row.hero_images or []),
            "stats": list(row.stats or []),
            "features": list(row.features or []),
            "footer_badges": list(row.footer_badges or []),
            "promo_banner": dict(row.promo_banner or {}),
            "shipping_time_text": row.shipping_time_text,
            "warranty_text": row.warranty_text,
            "origin_country": row.origin_country,
            "product_highlights": list(row.product_highlights or []),
            "free_shipping_threshold": row.free_shipping_threshold,
            "brand_subtitle": row.brand_subtitle,
            "shipping_cost": row.shipping_cost,
        }
    )


def _serialize_page(page: SitePage) -> SitePageOut:
    return SitePageOut.model_validate(
        {
            "id": page.id,
            "slug": page.slug,
            "title": page.title,
            "description": page.description,
            "sections": list(page.sections or []),
            "faqs": list(page.faqs or []),
            "cta_label": page.cta_label,
            "cta_href": page.cta_href,
            "published": page.published,
        }
    )


# ---------- Public ----------


@router.get("/settings", response_model=SiteSettingsOut)
def read_settings(db: Session = Depends(get_db)):
    return _serialize_settings(get_or_create_settings(db))


@router.get("/pages", response_model=list[SitePageOut])
def list_pages(db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SitePage).where(SitePage.published.is_(True)).order_by(SitePage.slug)
    ).all()
    return [_serialize_page(row) for row in rows]


@router.get("/pages/{slug}", response_model=SitePageOut)
def read_page(slug: str, db: Session = Depends(get_db)):
    page = db.scalar(
        select(SitePage).where(SitePage.slug == slug, SitePage.published.is_(True))
    )
    if not page:
        raise HTTPException(status_code=404, detail="صفحه یافت نشد")
    return _serialize_page(page)


# ---------- Admin ----------


@router.patch("/admin/settings", response_model=SiteSettingsOut)
def admin_update_settings(
    payload: SiteSettingsUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    row = get_or_create_settings(db)
    data = payload.updates()

    for field, value in data.items():
        if value is None:
            continue
        if isinstance(value, str):
            value = value.strip()
        setattr(row, field, value)

    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_settings(row)


@router.get("/admin/pages", response_model=list[SitePageOut])
def admin_list_pages(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    rows = db.scalars(select(SitePage).order_by(SitePage.slug)).all()
    return [_serialize_page(row) for row in rows]


@router.post("/admin/pages", response_model=SitePageOut, status_code=201)
def admin_create_page(
    payload: SitePageCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    slug = _normalize_slug(payload.slug)
    if db.scalar(select(SitePage.id).where(SitePage.slug == slug)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شناسه صفحه تکراری است",
        )
    page = SitePage(
        slug=slug,
        title=payload.title.strip(),
        description=(payload.description or "").strip(),
        sections=[s.model_dump() for s in (payload.sections or [])],
        faqs=[f.model_dump() for f in (payload.faqs or [])],
        cta_label=(payload.cta_label or "").strip(),
        cta_href=(payload.cta_href or "").strip(),
        published=True if payload.published is None else bool(payload.published),
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return _serialize_page(page)


@router.patch("/admin/pages/{page_id}", response_model=SitePageOut)
def admin_update_page(
    page_id: int,
    payload: SitePageUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    page = db.get(SitePage, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="صفحه یافت نشد")

    data = payload.updates()

    if data.get("title") is not None:
        page.title = data["title"].strip()
    if data.get("description") is not None:
        page.description = data["description"].strip()
    if data.get("sections") is not None:
        page.sections = data["sections"]
    if data.get("faqs") is not None:
        page.faqs = data["faqs"]
    if data.get("cta_label") is not None:
        page.cta_label = data["cta_label"].strip()
    if data.get("cta_href") is not None:
        page.cta_href = data["cta_href"].strip()
    if data.get("published") is not None:
        page.published = bool(data["published"])

    db.add(page)
    db.commit()
    db.refresh(page)
    return _serialize_page(page)


@router.delete("/admin/pages/{page_id}", response_model=MessageResponse)
def admin_delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    page = db.get(SitePage, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="صفحه یافت نشد")
    db.delete(page)
    db.commit()
    return MessageResponse(message="صفحه حذف شد")
