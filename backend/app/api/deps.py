from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.session import AuthSession
from app.models.user import User
from app.services import sessions as session_service

settings = get_settings()


@dataclass
class RequestSession:
    auth: AuthSession
    user: User | None = None
    admin: AdminUser | None = None


def _client_meta(request: Request) -> tuple[str | None, str | None]:
    forwarded = request.headers.get("x-forwarded-for")
    ip = (forwarded.split(",")[0].strip() if forwarded else None) or (
        request.client.host if request.client else None
    )
    ua = request.headers.get("user-agent")
    return ip, ua


def read_session_id(request: Request) -> str | None:
    header = request.headers.get(settings.SESSION_HEADER_NAME)
    if header and header.strip():
        return header.strip()
    cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if cookie and cookie.strip():
        return cookie.strip()
    return None


def set_session_cookie(
    response: Response,
    session_id: str,
    *,
    remember_me: bool = True,
) -> None:
    """Set auth cookie. remember_me=False → browser-session cookie (no max_age)."""
    kwargs: dict = {
        "key": settings.SESSION_COOKIE_NAME,
        "value": session_id,
        "httponly": True,
        "samesite": "lax",
        "secure": settings.SESSION_COOKIE_SECURE,
        "path": "/",
    }
    if remember_me:
        kwargs["max_age"] = settings.SESSION_EXPIRE_DAYS * 24 * 3600
    response.set_cookie(**kwargs)
    response.headers[settings.SESSION_HEADER_NAME] = session_id


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.SESSION_COOKIE_NAME,
        path="/",
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
    )


def get_or_create_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthSession:
    session_id = read_session_id(request)
    session = session_service.get_valid_session(db, session_id)
    if session:
        return session

    ip, ua = _client_meta(request)
    session = session_service.create_guest_session(db, ip_address=ip, user_agent=ua)
    set_session_cookie(response, session.id)
    return session


def get_request_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> RequestSession:
    auth = get_or_create_session(request, response, db)
    user = db.get(User, auth.user_id) if auth.user_id else None
    admin = db.get(AdminUser, auth.admin_id) if auth.admin_id else None
    if user and not user.is_active:
        user = None
    if admin and not admin.is_active:
        admin = None
    return RequestSession(auth=auth, user=user, admin=admin)


def get_current_user(
    ctx: RequestSession = Depends(get_request_session),
) -> User:
    if ctx.auth.role != "customer" or not ctx.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ورود مشتری لازم است",
        )
    return ctx.user


def get_optional_user(
    ctx: RequestSession = Depends(get_request_session),
) -> User | None:
    if ctx.auth.role == "customer":
        return ctx.user
    return None


def get_current_admin(
    ctx: RequestSession = Depends(get_request_session),
) -> AdminUser:
    if ctx.auth.role != "admin" or not ctx.admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ورود ادمین لازم است",
        )
    return ctx.admin
