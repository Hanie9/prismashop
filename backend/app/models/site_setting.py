from datetime import datetime

from sqlalchemy import DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SiteSetting(Base):
    """Singleton row (id=1) holding editable site-wide content."""

    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    brand_name: Mapped[str] = mapped_column(String(120), default="پریسما شاپ")
    brand_subtitle: Mapped[str] = mapped_column(String(160), default="")
    brand_tagline: Mapped[str] = mapped_column(Text, default="")
    copyright_text: Mapped[str] = mapped_column(String(300), default="")

    contact_phone: Mapped[str] = mapped_column(String(60), default="")
    contact_phone_link: Mapped[str] = mapped_column(String(60), default="")
    contact_email: Mapped[str] = mapped_column(String(160), default="")
    contact_address: Mapped[str] = mapped_column(Text, default="")
    working_hours: Mapped[str] = mapped_column(String(200), default="")

    social_links: Mapped[list] = mapped_column(JSON, default=list)
    hero_images: Mapped[list] = mapped_column(JSON, default=list)
    stats: Mapped[list] = mapped_column(JSON, default=list)
    features: Mapped[list] = mapped_column(JSON, default=list)
    footer_badges: Mapped[list] = mapped_column(JSON, default=list)
    promo_banner: Mapped[dict] = mapped_column(JSON, default=dict)

    shipping_time_text: Mapped[str] = mapped_column(String(200), default="")
    warranty_text: Mapped[str] = mapped_column(String(200), default="")
    origin_country: Mapped[str] = mapped_column(String(120), default="")
    product_highlights: Mapped[list] = mapped_column(JSON, default=list)
    free_shipping_threshold: Mapped[int] = mapped_column(Integer, default=0)
    shipping_cost: Mapped[int] = mapped_column(Integer, default=0)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
