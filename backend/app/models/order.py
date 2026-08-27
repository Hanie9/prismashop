from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tracking_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    status: Mapped[str] = mapped_column(
        String(32), default="pending", index=True
    )  # pending|processing|shipped|delivered|cancelled
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )
    admin_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admin_users.id"), nullable=True, index=True
    )

    customer_first_name: Mapped[str] = mapped_column(String(100))
    customer_last_name: Mapped[str] = mapped_column(String(100))
    customer_phone: Mapped[str] = mapped_column(String(11), index=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_province: Mapped[str] = mapped_column(String(100))
    customer_city: Mapped[str] = mapped_column(String(100))
    customer_address: Mapped[str] = mapped_column(Text)
    customer_postal_code: Mapped[str] = mapped_column(String(10))
    customer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    subtotal: Mapped[int] = mapped_column(Integer)
    shipping: Mapped[int] = mapped_column(Integer)
    discount: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    coupon_code: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    user = relationship("User", back_populates="orders")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    qty: Mapped[int] = mapped_column(Integer)
    image: Mapped[str] = mapped_column(Text)

    order = relationship("Order", back_populates="items")
