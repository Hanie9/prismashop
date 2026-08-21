from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.session import AuthSession, generate_session_id


def _expiry(*, role: str, remember_me: bool = True) -> datetime:
    settings = get_settings()
    if role in ("customer", "admin"):
        days = (
            settings.SESSION_EXPIRE_DAYS
            if remember_me
            else settings.SESSION_SHORT_EXPIRE_DAYS
        )
    else:
        days = settings.SESSION_GUEST_EXPIRE_DAYS
    return datetime.now(UTC) + timedelta(days=days)


def create_guest_session(
    db: Session,
    *,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuthSession:
    session = AuthSession(
        id=generate_session_id(),
        role="guest",
        ip_address=ip_address,
        user_agent=(user_agent or "")[:500] or None,
        expires_at=_expiry(role="guest"),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_valid_session(db: Session, session_id: str | None) -> AuthSession | None:
    if not session_id:
        return None
    session = db.get(AuthSession, session_id)
    if not session or session.is_expired():
        return None
    session.last_seen_at = datetime.now(UTC)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def attach_customer(
    db: Session,
    session: AuthSession,
    user_id: int,
    *,
    rotate: bool = True,
    remember_me: bool = True,
) -> AuthSession:
    """Bind session to customer; rotate id on login to prevent fixation."""
    if rotate:
        session.is_active = False
        db.add(session)
        db.flush()
        session = AuthSession(
            id=generate_session_id(),
            role="customer",
            user_id=user_id,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            expires_at=_expiry(role="customer", remember_me=remember_me),
        )
        db.add(session)
    else:
        session.role = "customer"
        session.user_id = user_id
        session.admin_id = None
        session.expires_at = _expiry(role="customer", remember_me=remember_me)
        db.add(session)
    db.commit()
    db.refresh(session)
    return session


def attach_admin(
    db: Session,
    session: AuthSession,
    admin_id: int,
    *,
    rotate: bool = True,
    remember_me: bool = True,
) -> AuthSession:
    if rotate:
        session.is_active = False
        db.add(session)
        db.flush()
        session = AuthSession(
            id=generate_session_id(),
            role="admin",
            admin_id=admin_id,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            expires_at=_expiry(role="admin", remember_me=remember_me),
        )
        db.add(session)
    else:
        session.role = "admin"
        session.admin_id = admin_id
        session.user_id = None
        session.expires_at = _expiry(role="admin", remember_me=remember_me)
        db.add(session)
    db.commit()
    db.refresh(session)
    return session


def revoke_session(db: Session, session: AuthSession | None) -> None:
    if not session:
        return
    session.is_active = False
    db.add(session)
    db.commit()


def cleanup_expired_sessions(db: Session, limit: int = 500) -> int:
    now = datetime.now(UTC)
    rows = db.scalars(
        select(AuthSession.id)
        .where(
            (AuthSession.is_active.is_(False)) | (AuthSession.expires_at <= now)
        )
        .limit(limit)
    ).all()
    if not rows:
        return 0
    result = db.execute(delete(AuthSession).where(AuthSession.id.in_(rows)))
    db.commit()
    return result.rowcount or 0
