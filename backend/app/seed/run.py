"""Run with: python -m app.seed.run"""

from sqlalchemy import select, text

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.schema import ensure_schema
from app.core.security import hash_password
from app.models import AdminUser, Category, Coupon, Product
from app.seed.data import SEED_CATEGORIES, SEED_COUPONS, build_seed_products


def seed(*, force: bool = False) -> None:
    settings = get_settings()
    ensure_schema()

    with SessionLocal() as db:
        has_products = db.scalar(select(Product.id).limit(1))
        if has_products and not force:
            admin = db.scalar(
                select(AdminUser).where(
                    AdminUser.email == settings.ADMIN_EMAIL.lower()
                )
            )
            if not admin:
                db.add(
                    AdminUser(
                        email=settings.ADMIN_EMAIL.lower(),
                        mobile=settings.ADMIN_MOBILE,
                        password_hash=hash_password(settings.ADMIN_PASSWORD),
                        first_name="مدیر",
                        last_name="پریسما",
                    )
                )
                db.commit()
                print("Admin user created. Catalog already present.")
            else:
                if not admin.mobile:
                    admin.mobile = settings.ADMIN_MOBILE
                    db.add(admin)
                    db.commit()
                print("Database already seeded. Use --force to reseed.")
            return

        if force:
            db.execute(
                text(
                    "TRUNCATE TABLE wishlist_items, order_items, orders, "
                    "products, coupons, categories, users, admin_users "
                    "RESTART IDENTITY CASCADE"
                )
            )
            db.commit()

        for cat in SEED_CATEGORIES:
            db.add(Category(**cat))
        db.flush()

        for product in build_seed_products():
            db.add(
                Product(
                    id=product["id"],
                    name=product["name"],
                    price=product["price"],
                    original_price=product["original_price"],
                    image=product["image"],
                    images=product["images"],
                    category_id=product["category_id"],
                    category_name=product["category_name"],
                    rating=product["rating"],
                    review_count=product["review_count"],
                    is_new=product["is_new"],
                    is_bestseller=product.get("is_bestseller", False),
                    discount=product["discount"],
                    stock=product["stock"],
                    low_stock_threshold=product["low_stock_threshold"],
                    description=product["description"],
                    detail_paragraphs=product.get("detail_paragraphs") or [],
                    highlights=product.get("highlights") or [],
                    specs=product.get("specs") or [],
                    active=product["active"],
                )
            )

        db.flush()
        db.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('products', 'id'), "
                "(SELECT COALESCE(MAX(id), 1) FROM products))"
            )
        )

        for coupon in SEED_COUPONS:
            db.add(Coupon(**coupon))

        db.add(
            AdminUser(
                email=settings.ADMIN_EMAIL.lower(),
                mobile=settings.ADMIN_MOBILE,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                first_name="مدیر",
                last_name="پریسما",
            )
        )

        db.commit()
        print("Seed completed successfully.")
        print(f"Admin mobile: {settings.ADMIN_MOBILE}")


if __name__ == "__main__":
    import sys

    seed(force="--force" in sys.argv)
