from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import RequestSession, get_request_session, set_session_cookie
from app.core.database import get_db
from app.models.product import Product
from app.schemas import MessageResponse, ProductOut, WishlistToggleResponse
from app.services.serializers import serialize_product
from app.services.wishlist import clear_wishlist, list_product_ids, toggle_item

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[ProductOut])
def get_wishlist(
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    set_session_cookie(response, ctx.auth.id)
    products: list[ProductOut] = []
    for product_id in list_product_ids(db, ctx):
        product = db.get(Product, product_id)
        if product and product.active:
            products.append(serialize_product(product))
    return products


@router.get("/ids", response_model=list[int])
def wishlist_ids(
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    set_session_cookie(response, ctx.auth.id)
    return list_product_ids(db, ctx)


@router.post("/{product_id}/toggle", response_model=WishlistToggleResponse)
def toggle_wishlist(
    product_id: int,
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    set_session_cookie(response, ctx.auth.id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")

    wishlisted, ids = toggle_item(db, ctx, product_id)
    return WishlistToggleResponse(wishlisted=wishlisted, product_ids=ids)


@router.delete("", response_model=MessageResponse)
def delete_wishlist(
    response: Response,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    set_session_cookie(response, ctx.auth.id)
    clear_wishlist(db, ctx)
    return MessageResponse(message="لیست علاقه‌مندی‌ها خالی شد")
