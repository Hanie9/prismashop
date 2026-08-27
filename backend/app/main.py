from contextlib import asynccontextmanager
from threading import Thread
import time

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import (
    admin,
    auth,
    blog,
    cart,
    categories,
    contact,
    coupons,
    media,
    orders,
    products,
    reviews,
    site,
    uploads,
    wishlist,
)
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.schema import ensure_schema
from app.services.sessions import cleanup_expired_sessions


FIELD_LABELS = {
    "email": "ایمیل",
    "email_or_mobile": "ایمیل یا موبایل",
    "password": "رمز عبور",
    "first_name": "نام",
    "last_name": "نام خانوادگی",
    "mobile": "موبایل",
    "phone": "موبایل",
    "postal_code": "کد پستی",
    "address": "آدرس",
    "province": "استان",
    "city": "شهر",
    "code": "کد",
    "name": "نام",
    "category_id": "دسته‌بندی",
    "images": "تصاویر",
    "value": "مقدار",
    "items": "اقلام سبد",
}


def _fa_validation_message(err: dict) -> str:
    loc = err.get("loc") or ()
    field = next(
        (str(p) for p in reversed(loc) if p not in ("body", "query", "path")),
        "",
    )
    label = FIELD_LABELS.get(field, "مقدار واردشده")
    msg = str(err.get("msg") or "")
    lower = msg.lower()
    err_type = str(err.get("type") or "")

    if "email" in lower or "email" in err_type:
        return "لطفاً یک ایمیل معتبر وارد کنید."
    if "missing" in err_type or "required" in lower:
        return f"{label} الزامی است."
    if "too_short" in err_type or "at least" in lower:
        return f"{label} کوتاه‌تر از حد مجاز است."
    if "too_long" in err_type:
        return f"{label} بلندتر از حد مجاز است."
    if any(x in err_type for x in ("int", "float", "number", "gt", "ge", "lt", "le")):
        return f"{label} باید عدد معتبر باشد."
    if any("\u0600" <= ch <= "\u06ff" for ch in msg):
        return msg
    return "اطلاعات واردشده نامعتبر است. لطفاً دوباره بررسی کنید."


def _session_cleaner_loop() -> None:
    while True:
        try:
            with SessionLocal() as db:
                cleanup_expired_sessions(db)
        except Exception:
            pass
        time.sleep(300)


def _seed_site_content() -> None:
    from app.services.site import get_or_create_settings, seed_site_pages_if_missing

    with SessionLocal() as db:
        get_or_create_settings(db)
        seed_site_pages_if_missing(db)


def _ensure_admin_mobile() -> None:
    """Ensure the configured admin mobile exists for OTP login."""
    from sqlalchemy import select

    from app.models.admin_user import AdminUser
    from app.schemas import normalize_iran_mobile

    settings = get_settings()
    try:
        mobile = normalize_iran_mobile(settings.ADMIN_MOBILE)
    except Exception:
        mobile = "09355191018"

    with SessionLocal() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.mobile == mobile))
        if admin:
            return

        db.add(
            AdminUser(
                mobile=mobile,
                first_name="مدیر",
                last_name="پریسما",
            )
        )
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    ensure_schema()
    _ensure_admin_mobile()
    _seed_site_content()
    try:
        from app.services.reviews import sync_all_product_ratings

        with SessionLocal() as db:
            sync_all_product_ratings(db)
    except Exception:
        pass
    try:
        from app.services.media import purge_orphan_media

        with SessionLocal() as db:
            purge_orphan_media(db)
    except Exception:
        pass
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    cleaner = Thread(target=_session_cleaner_loop, name="session-cleaner", daemon=True)
    cleaner.start()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Prisma Shop API",
        description="Backend for Prisma Shop (FastAPI + PostgreSQL, session auth)",
        version="1.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*", settings.SESSION_HEADER_NAME],
        expose_headers=[settings.SESSION_HEADER_NAME],
    )

    for router in (
        auth.router,
        products.router,
        categories.router,
        coupons.router,
        orders.router,
        cart.router,
        wishlist.router,
        uploads.router,
        media.router,
        admin.router,
        reviews.router,
        blog.router,
        contact.router,
        site.router,
    ):
        app.include_router(router, prefix="/api")

    app.mount(
        "/uploads",
        StaticFiles(directory=str(settings.upload_path)),
        name="uploads",
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ):
        errors = exc.errors()
        message = (
            _fa_validation_message(errors[0])
            if errors
            else "اطلاعات واردشده نامعتبر است."
        )
        return JSONResponse(status_code=422, content={"detail": message})

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
        detail = exc.detail
        if isinstance(detail, str) and not any(
            "\u0600" <= ch <= "\u06ff" for ch in detail
        ):
            mapping = {
                401: "برای ادامه باید وارد حساب کاربری شوید.",
                403: "دسترسی مجاز نیست.",
                404: "مورد درخواستی یافت نشد.",
                405: "این درخواست مجاز نیست.",
                500: "خطای سرور. لطفاً کمی بعد دوباره تلاش کنید.",
            }
            detail = mapping.get(exc.status_code, "خطایی رخ داد. لطفاً دوباره تلاش کنید.")
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "prismashop-api"}

    return app


app = create_app()
