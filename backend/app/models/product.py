from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    original_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image: Mapped[str] = mapped_column(Text)
    images: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    category_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("categories.id"), index=True
    )
    # denormalized display name (same as site)
    category_name: Mapped[str] = mapped_column(String(200))
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    discount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    detail_paragraphs: Mapped[list] = mapped_column(JSON, default=list)
    highlights: Mapped[list] = mapped_column(JSON, default=list)
    specs: Mapped[list] = mapped_column(JSON, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category_rel = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
