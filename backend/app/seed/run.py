"""Bootstrap the admin account. Run with: python -m app.seed.run

The catalog (categories, products, coupons) is never seeded from code — it is
created entirely through the admin panel and lives only in the database.
"""

from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.schema import ensure_schema
from app.core.security import hash_password
from app.models import AdminUser


def seed() -> None:
    settings = get_settings()
    ensure_schema()

    with SessionLocal() as db:
        admin = db.scalar(
            select(AdminUser).where(AdminUser.email == settings.ADMIN_EMAIL.lower())
        )
        if admin:
            if not admin.mobile:
                admin.mobile = settings.ADMIN_MOBILE
                db.add(admin)
                db.commit()
            print("Admin user already exists.")
        else:
            db.add(
                AdminUser(
                    email=settings.ADMIN_EMAIL.lower(),
                    mobile=settings.ADMIN_MOBILE,
                    password_hash=hash_password(settings.ADMIN_PASSWORD),
                    first_name="مدیر",
                    last_name="فروشگاه",
                )
            )
            db.commit()
            print("Admin user created.")

        print(f"Admin mobile: {settings.ADMIN_MOBILE}")


if __name__ == "__main__":
    seed()
