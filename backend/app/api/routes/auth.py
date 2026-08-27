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
    ChangePasswordRequest,
    CustomerLogin,
    CustomerOut,
    CustomerProfileUpdate,
    CustomerRegister,
    MessageResponse,
    OtpRequest,
    OtpRequestResponse,
    OtpVerify,
    OtpVerifySignupResponse,
    SessionResponse,
)
from app.services import otp as otp_service
from app.services import sessions as session_service
from app.services.otp import OTP_TTL_SECONDS

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
    return name or user.mobile or (user.email or "")


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


def _resolve_admin_by_mobile(db: Session, mobile: str) -> AdminUser | None:
    admin = db.scalar(select(AdminUser).where(AdminUser.mobile == mobile))
    if admin:
        return admin

    # Auto-heal: attach configured ADMIN_MOBILE to the seed admin account
    from app.core.config import get_settings
    from app.schemas import normalize_iran_mobile as norm_mobile

    settings = get_settings()
    try:
        configured = norm_mobile(settings.ADMIN_MOBILE)
    except Exception:
        configured = None
    if not configured or configured != mobile:
        return None

    seed_admin = db.scalar(
        select(AdminUser).where(AdminUser.email == settings.ADMIN_EMAIL.lower())
    )
    if not seed_admin:
        return None
    seed_admin.mobile = mobile
    db.add(seed_admin)
    db.commit()
    db.refresh(seed_admin)
    return seed_admin


@router.post("/otp/request", response_model=OtpRequestResponse)
def request_otp(payload: OtpRequest, db: Session = Depends(get_db)):
    mobile = payload.mobile
    existing = db.scalar(select(User).where(User.mobile == mobile))
    admin = _resolve_admin_by_mobile(db, mobile)

    if payload.purpose == "signup":
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این شماره موبایل قبلاً ثبت شده است. وارد شوید",
            )
        if admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این شماره برای حساب ادمین رزرو شده است",
            )
    elif payload.purpose == "login":
        # Unified login: customer or admin mobile
        if admin:
            if not admin.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="حساب ادمین غیرفعال است",
                )
        elif existing:
            if not existing.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="حساب کاربری غیرفعال است",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید",
            )
    elif payload.purpose == "admin":
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ادمین با این شماره یافت نشد",
            )
        if not admin.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="حساب ادمین غیرفعال است",
            )

    _, code = otp_service.create_otp_challenge(
        db, mobile=mobile, purpose=payload.purpose
    )
    return OtpRequestResponse(
        message="کد تأیید ارسال شد",
        expires_in=OTP_TTL_SECONDS,
        # Local/dev convenience — wire a real SMS provider in production
        dev_code=code,
    )


@router.post("/otp/verify")
def verify_otp(
    payload: OtpVerify,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    challenge = otp_service.verify_otp_challenge(
        db,
        mobile=payload.mobile,
        purpose=payload.purpose,
        code=payload.code,
    )

    if payload.purpose == "signup":
        return OtpVerifySignupResponse(
            message="شماره موبایل تأیید شد",
            signup_token=challenge.signup_token or "",
            mobile=payload.mobile,
        )

    guest = get_or_create_session(request, response, db)

    # Unified login: admin mobile takes priority; dedicated purpose=admin also supported
    if payload.purpose in ("admin", "login"):
        admin = _resolve_admin_by_mobile(db, payload.mobile)
        if admin:
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
        if payload.purpose == "admin":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ادمین یافت نشد",
            )

    user = db.scalar(select(User).where(User.mobile == payload.mobile))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="حساب کاربری یافت نشد",
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


@router.post("/register", response_model=SessionResponse)
def register(
    payload: CustomerRegister,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    otp_service.consume_signup_token(
        db, mobile=payload.mobile, signup_token=payload.signup_token
    )

    existing = db.scalar(select(User).where(User.mobile == payload.mobile))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این شماره موبایل قبلاً ثبت شده است",
        )
    if db.scalar(select(AdminUser).where(AdminUser.mobile == payload.mobile)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این شماره برای حساب ادمین رزرو شده است",
        )

    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        mobile=payload.mobile,
        email=None,
        password_hash=None,
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
    """Admin password login (and legacy customer password if still set)."""
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
    if (
        not user
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
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
    data = payload.updates()
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


@router.post("/me/password", response_model=MessageResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ورود با رمز عبور برای این حساب فعال نیست",
        )
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور فعلی اشتباه است",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز جدید باید با رمز فعلی متفاوت باشد",
        )
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    return MessageResponse(message="رمز عبور با موفقیت تغییر کرد")


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
