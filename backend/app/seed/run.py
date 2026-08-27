"""Bootstrap the admin account. Run with: python -m app.seed.run

The catalog (categories, products, coupons) is never seeded from code — it is
created entirely through the admin panel and lives only in the database.
"""

from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.schema import ensure_schema
from app.models import AdminUser
from app.schemas import normalize_iran_mobile


def seed() -> None:
    settings = get_settings()
    ensure_schema()

    mobile = normalize_iran_mobile(settings.ADMIN_MOBILE)

    with SessionLocal() as db:
        admin = db.scalar(select(AdminUser).where(AdminUser.mobile == mobile))
        if admin:
            print("Admin user already exists.")
        else:
            db.add(
                AdminUser(
                    mobile=mobile,
                    first_name="مدیر",
                    last_name="فروشگاه",
                )
            )
            db.commit()
            print("Admin user created.")

        print(f"Admin mobile: {mobile}")


if __name__ == "__main__":
    seed()
