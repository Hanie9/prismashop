from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SitePage(Base):
    """Editable static/marketing page (about, faq, privacy, returns, ...)."""

    __tablename__ = "site_pages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(Text, default="")
    # [{"heading": str, "paragraphs": [str, ...]}]
    sections: Mapped[list] = mapped_column(JSON, default=list)
    # [{"question": str, "answer": str}]
    faqs: Mapped[list] = mapped_column(JSON, default=list)
    cta_label: Mapped[str] = mapped_column(String(160), default="")
    cta_href: Mapped[str] = mapped_column(String(300), default="")
    published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
