from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas import ProductOut, WishlistToggleResponse
from app.services.serializers import serialize_product

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ProductOut])
def get_wishlist(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.scalars(
        select(WishlistItem).where(WishlistItem.user_id == user.id)
    ).all()
    products: list[ProductOut] = []
    for row in rows:
        product = db.get(Product, row.product_id)
        if product and product.active:
            products.append(serialize_product(product))
    return products


@router.get("/ids", response_model=list[int])
def wishlist_ids(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list(
        db.scalars(
            select(WishlistItem.product_id).where(WishlistItem.user_id == user.id)
        ).all()
    )


@router.post("/{product_id}/toggle", response_model=WishlistToggleResponse)
def toggle_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")

    existing = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == user.id,
            WishlistItem.product_id == product_id,
        )
    )
    if existing:
        db.delete(existing)
        wishlisted = False
    else:
        db.add(WishlistItem(user_id=user.id, product_id=product_id))
        wishlisted = True

    db.commit()
    ids = list(
        db.scalars(
            select(WishlistItem.product_id).where(WishlistItem.user_id == user.id)
        ).all()
    )
    return WishlistToggleResponse(wishlisted=wishlisted, product_ids=ids)
