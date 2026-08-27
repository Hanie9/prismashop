from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.site_page import SitePage
from app.models.site_setting import SiteSetting
from app.seed.site_data import DEFAULT_SITE_PAGES, DEFAULT_SITE_SETTINGS


def get_or_create_settings(db: Session) -> SiteSetting:
    row = db.scalar(select(SiteSetting).order_by(SiteSetting.id).limit(1))
    if row:
        return row
    row = SiteSetting(**DEFAULT_SITE_SETTINGS)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def seed_site_pages_if_missing(db: Session) -> None:
    existing = set(db.scalars(select(SitePage.slug)).all())
    added = False
    for page in DEFAULT_SITE_PAGES:
        if page["slug"] in existing:
            continue
        db.add(SitePage(**page))
        added = True
    if added:
        db.commit()
