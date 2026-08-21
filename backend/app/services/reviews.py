from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.review import Review


def refresh_product_rating(db: Session, product_id: int) -> Product | None:
    product = db.get(Product, product_id)
    if not product:
        return None

    rows = db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(
            Review.product_id == product_id
        )
    ).one()
    count = int(rows[0] or 0)
    avg = float(rows[1] or 0)
    product.review_count = count
    product.rating = round(avg, 1) if count else 0.0
    db.add(product)
    db.flush()
    return product


def sync_all_product_ratings(db: Session) -> None:
    product_ids = list(db.scalars(select(Product.id)).all())
    for product_id in product_ids:
        refresh_product_rating(db, product_id)
    db.commit()
