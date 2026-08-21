from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas import CamelModel, CartLine, CartOut, CartReplaceRequest

router = APIRouter(prefix="/cart", tags=["cart"])


class CartCheckItem(CamelModel):
    product_id: int
    qty: int = Field(gt=0)


class CartCheckRequest(CamelModel):
    items: list[CartCheckItem]


class CartCheckLine(CamelModel):
    product_id: int
    available_stock: int
    ok: bool
    reason: str | None = None


class CartCheckResponse(CamelModel):
    ok: bool
    lines: list[CartCheckLine]


def _clamp_qty(product: Product | None, qty: int) -> int | None:
    if not product or not product.active or product.stock <= 0:
        return None
    return max(1, min(qty, product.stock))


def _serialize_cart(db: Session, user_id: int) -> CartOut:
    rows = db.scalars(select(CartItem).where(CartItem.user_id == user_id)).all()
    items: list[CartLine] = []
    for row in rows:
        product = db.get(Product, row.product_id)
        qty = _clamp_qty(product, row.qty)
        if qty is None:
            db.delete(row)
            continue
        if qty != row.qty:
            row.qty = qty
            db.add(row)
        items.append(CartLine(product_id=row.product_id, qty=qty))
    db.commit()
    return CartOut(items=items)


def _merge_lines(base: list[CartLine], extra: list[CartLine]) -> list[CartLine]:
    by_id: dict[int, int] = {line.product_id: line.qty for line in base}
    for line in extra:
        by_id[line.product_id] = by_id.get(line.product_id, 0) + line.qty
    return [CartLine(product_id=pid, qty=qty) for pid, qty in by_id.items()]


def _replace_cart(db: Session, user: User, lines: list[CartLine]) -> CartOut:
    existing = db.scalars(select(CartItem).where(CartItem.user_id == user.id)).all()
    for row in existing:
        db.delete(row)
    db.flush()

    for line in lines:
        product = db.get(Product, line.product_id)
        qty = _clamp_qty(product, line.qty)
        if qty is None:
            continue
        db.add(CartItem(user_id=user.id, product_id=line.product_id, qty=qty))
    db.commit()
    return _serialize_cart(db, user.id)


@router.get("", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _serialize_cart(db, user.id)


@router.put("", response_model=CartOut)
def replace_cart(
    payload: CartReplaceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _replace_cart(db, user, payload.items)


@router.post("/sync", response_model=CartOut)
def sync_cart(
    payload: CartReplaceRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Merge client (e.g. guest) items into the user's server cart."""
    current = _serialize_cart(db, user.id).items
    merged = _merge_lines(current, payload.items)
    return _replace_cart(db, user, merged)


@router.post("/validate", response_model=CartCheckResponse)
def validate_cart(payload: CartCheckRequest, db: Session = Depends(get_db)):
    """Server-side stock check for checkout."""
    if not payload.items:
        raise HTTPException(status_code=400, detail="سبد خرید خالی است")

    lines: list[CartCheckLine] = []
    ok_all = True
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if not product or not product.active:
            lines.append(
                CartCheckLine(
                    product_id=item.product_id,
                    available_stock=0,
                    ok=False,
                    reason="out_of_stock",
                )
            )
            ok_all = False
            continue
        if product.stock <= 0:
            lines.append(
                CartCheckLine(
                    product_id=item.product_id,
                    available_stock=0,
                    ok=False,
                    reason="out_of_stock",
                )
            )
            ok_all = False
        elif item.qty > product.stock:
            lines.append(
                CartCheckLine(
                    product_id=item.product_id,
                    available_stock=product.stock,
                    ok=False,
                    reason="max_stock",
                )
            )
            ok_all = False
        else:
            lines.append(
                CartCheckLine(
                    product_id=item.product_id,
                    available_stock=product.stock,
                    ok=True,
                )
            )

    return CartCheckResponse(ok=ok_all, lines=lines)
