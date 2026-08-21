from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import (
    RequestSession,
    clear_session_cookie,
    get_current_admin,
    get_current_user,
    get_or_create_session,
    get_request_session,
    set_session_cookie,
)
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.admin_user import AdminUser
from app.models.session import AuthSession
from app.models.user import User
from app.schemas import (
    AdminOut,
    CustomerLogin,
    CustomerOut,
    CustomerProfileUpdate,
    CustomerRegister,
    MessageResponse,
    SessionResponse,
)
from app.services import sessions as session_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _session_payload(
    auth: AuthSession,
    *,
    display_name: str | None = None,
    email: str | None = None,
) -> SessionResponse:
    return SessionResponse(
        session_id=auth.id,
        role=auth.role,  # type: ignore[arg-type]
        expires_at=auth.expires_at,
        display_name=display_name,
        email=email,
    )


def _admin_display(admin: AdminUser) -> str:
    name = f"{admin.first_name} {admin.last_name}".strip()
    return name or admin.email


def _user_display(user: User) -> str:
    name = f"{user.first_name} {user.last_name}".strip()
    return name or user.email


@router.post("/session", response_model=SessionResponse)
def ensure_session(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Create or return the current guest/auth session id."""
    auth = get_or_create_session(request, response, db)
    set_session_cookie(response, auth.id)
    display_name = None
    email = None
    if auth.role == "customer" and auth.user_id:
        user = db.get(User, auth.user_id)
        if user:
            display_name = _user_display(user)
            email = user.email
    elif auth.role == "admin" and auth.admin_id:
        admin = db.get(AdminUser, auth.admin_id)
        if admin:
            display_name = _admin_display(admin)
            email = admin.email
    return _session_payload(auth, display_name=display_name, email=email)


@router.get("/session", response_model=SessionResponse)
def current_session(
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    display_name = None
    email = None
    if ctx.user:
        display_name = _user_display(ctx.user)
        email = ctx.user.email
    elif ctx.admin:
        display_name = _admin_display(ctx.admin)
        email = ctx.admin.email
    return _session_payload(ctx.auth, display_name=display_name, email=email)


@router.post("/register", response_model=SessionResponse)
def register(
    payload: CustomerRegister,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower().strip()
    existing = db.scalar(
        select(User).where(or_(User.email == email, User.mobile == payload.mobile))
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ایمیل یا موبایل قبلاً ثبت شده است",
        )

    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        mobile=payload.mobile,
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    guest = get_or_create_session(request, response, db)
    auth = session_service.attach_customer(db, guest, user.id, rotate=True)
    set_session_cookie(response, auth.id)
    return _session_payload(
        auth, display_name=_user_display(user), email=user.email
    )


@router.post("/login", response_model=SessionResponse)
def login(
    payload: CustomerLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Unified login: admin_users first, then customers. Same panel for everyone."""
    identifier = payload.email_or_mobile.strip()
    identifier_lower = identifier.lower()
    guest = get_or_create_session(request, response, db)

    admin = db.scalar(
        select(AdminUser).where(AdminUser.email == identifier_lower)
    )
    if admin and verify_password(payload.password, admin.password_hash):
        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="حساب ادمین غیرفعال است",
            )
        auth = session_service.attach_admin(
            db, guest, admin.id, rotate=True, remember_me=payload.remember_me
        )
        set_session_cookie(response, auth.id, remember_me=payload.remember_me)
        return _session_payload(
            auth, display_name=_admin_display(admin), email=admin.email
        )

    user = db.scalar(
        select(User).where(
            or_(User.email == identifier_lower, User.mobile == identifier)
        )
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ایمیل/موبایل یا رمز عبور اشتباه است",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="حساب کاربری غیرفعال است",
        )

    auth = session_service.attach_customer(
        db, guest, user.id, rotate=True, remember_me=payload.remember_me
    )
    set_session_cookie(response, auth.id, remember_me=payload.remember_me)
    return _session_payload(
        auth, display_name=_user_display(user), email=user.email
    )


@router.get("/me", response_model=CustomerOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=CustomerOut)
def update_me(
    payload: CustomerProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if isinstance(value, str):
            value = value.strip()
            if key in ("province", "city", "address", "postal_code") and value == "":
                value = None
        setattr(user, key, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me/address", response_model=CustomerOut)
def clear_address(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.province = None
    user.city = None
    user.address = None
    user.postal_code = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/admin/login", response_model=SessionResponse)
def admin_login(
    payload: CustomerLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Alias of unified login for backwards compatibility."""
    return login(payload, request, response, db)


@router.get("/admin/me", response_model=AdminOut)
def admin_me(admin: AdminUser = Depends(get_current_admin)):
    return admin


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    session_service.revoke_session(db, ctx.auth)
    clear_session_cookie(response)
    ip = ctx.auth.ip_address
    ua = ctx.auth.user_agent
    fresh = session_service.create_guest_session(db, ip_address=ip, user_agent=ua)
    set_session_cookie(response, fresh.id)
    return MessageResponse(message="خروج انجام شد")
