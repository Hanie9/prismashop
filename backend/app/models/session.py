import secrets
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def generate_session_id() -> str:
    return secrets.token_urlsafe(32)


class AuthSession(Base):
    """Server-side session for guests, customers, and admins."""

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(
        String(64), primary_key=True, default=generate_session_id
    )
    role: Mapped[str] = mapped_column(String(16), default="guest", index=True)
    # guest | customer | admin

    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    admin_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("admin_users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    user = relationship("User")
    admin = relationship("AdminUser")

    def is_expired(self) -> bool:
        now = datetime.now(UTC)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        return (not self.is_active) or expires <= now
