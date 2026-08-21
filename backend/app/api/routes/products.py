from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.schemas import (
    ProductCreate,
    ProductListResponse,
    ProductOut,
    ProductStockUpdate,
    ProductUpdate,
)
from app.services.products import create_product_from_payload, update_product_from_payload
from app.services.serializers import serialize_product

router = APIRouter(prefix="/products", tags=["products"])


def _apply_price_bucket(query, price: str | None):
    if not price:
        return query
    if price == "under-100":
        return query.where(Product.price < 100_000)
    if price == "100-500":
        return query.where(Product.price >= 100_000, Product.price < 500_000)
    if price == "500-1000":
        return query.where(Product.price >= 500_000, Product.price < 1_000_000)
    if price == "over-1000":
        return query.where(Product.price >= 1_000_000)
    return query


@router.get("", response_model=ProductListResponse)
def list_products(
    db: Session = Depends(get_db),
    q: str | None = None,
    category: str | None = Query(default=None, description="category id"),
    price: str | None = Query(
        default=None,
        description="under-100 | 100-500 | 500-1000 | over-1000",
    ),
    sale: bool = False,
    sort: str = Query(
        default="featured",
        description="featured | cheap | expensive | newest | bestseller",
    ),
    active_only: bool = True,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
):
    query = select(Product)
    if active_only:
        query = query.where(Product.active.is_(True))
    if category:
        query = query.where(Product.category_id == category)
    if sale:
        query = query.where(Product.original_price.is_not(None))
    if q:
        like = f"%{q.strip()}%"
        query = query.where(
            or_(
                Product.name.ilike(like),
                Product.category_name.ilike(like),
            )
        )
    query = _apply_price_bucket(query, price)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    if sort == "cheap":
        query = query.order_by(Product.price.asc())
    elif sort == "expensive":
        query = query.order_by(Product.price.desc())
    elif sort == "newest":
        query = query.order_by(Product.is_new.desc(), Product.id.desc())
    elif sort == "bestseller":
        query = query.order_by(Product.review_count.desc())
    else:
        query = query.order_by(Product.id.asc())

    products = db.scalars(query.offset(skip).limit(limit)).all()
    return ProductListResponse(
        items=[serialize_product(p) for p in products],
        total=total,
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    return serialize_product(product)


@router.get("/{product_id}/related", response_model=list[ProductOut])
def related_products(
    product_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(default=4, ge=1, le=12),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    related = db.scalars(
        select(Product)
        .where(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.active.is_(True),
        )
        .limit(limit)
    ).all()
    return [serialize_product(p) for p in related]


# ---------- Admin ----------


@router.post("", response_model=ProductOut, status_code=201)
def admin_create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    try:
        product = create_product_from_payload(db, payload)
        db.commit()
        db.refresh(product)
        return serialize_product(product)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{product_id}", response_model=ProductOut)
def admin_update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    try:
        update_product_from_payload(db, product, payload)
        db.commit()
        db.refresh(product)
        return serialize_product(product)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{product_id}/stock", response_model=ProductOut)
def admin_update_stock(
    product_id: int,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    if payload.stock is not None:
        product.stock = payload.stock
    if payload.low_stock_threshold is not None:
        product.low_stock_threshold = payload.low_stock_threshold
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.delete("/{product_id}", status_code=204)
def admin_delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")
    db.delete(product)
    db.commit()
