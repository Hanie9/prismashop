from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import RequestSession
from app.models.wishlist import WishlistItem


def _customer_user_id(ctx: RequestSession) -> int | None:
    if ctx.auth.role == "customer" and ctx.user:
        return ctx.user.id
    return None


def list_product_ids(db: Session, ctx: RequestSession) -> list[int]:
    user_id = _customer_user_id(ctx)
    if user_id is not None:
        return list(
            db.scalars(
                select(WishlistItem.product_id).where(WishlistItem.user_id == user_id)
            ).all()
        )
    return list(
        db.scalars(
            select(WishlistItem.product_id).where(
                WishlistItem.session_id == ctx.auth.id
            )
        ).all()
    )


def toggle_item(db: Session, ctx: RequestSession, product_id: int) -> tuple[bool, list[int]]:
    user_id = _customer_user_id(ctx)
    if user_id is not None:
        existing = db.scalar(
            select(WishlistItem).where(
                WishlistItem.user_id == user_id,
                WishlistItem.product_id == product_id,
            )
        )
        if existing:
            db.delete(existing)
            wishlisted = False
        else:
            db.add(WishlistItem(user_id=user_id, product_id=product_id))
            wishlisted = True
    else:
        existing = db.scalar(
            select(WishlistItem).where(
                WishlistItem.session_id == ctx.auth.id,
                WishlistItem.product_id == product_id,
            )
        )
        if existing:
            db.delete(existing)
            wishlisted = False
        else:
            db.add(
                WishlistItem(session_id=ctx.auth.id, product_id=product_id)
            )
            wishlisted = True

    db.commit()
    return wishlisted, list_product_ids(db, ctx)


def clear_wishlist(db: Session, ctx: RequestSession) -> None:
    user_id = _customer_user_id(ctx)
    if user_id is not None:
        db.execute(delete(WishlistItem).where(WishlistItem.user_id == user_id))
    else:
        db.execute(
            delete(WishlistItem).where(WishlistItem.session_id == ctx.auth.id)
        )
    db.commit()


def merge_session_into_user(db: Session, *, session_id: str, user_id: int) -> None:
    """Move guest-session wishlist items into the customer account on login."""
    session_rows = db.scalars(
        select(WishlistItem).where(WishlistItem.session_id == session_id)
    ).all()
    if not session_rows:
        return

    existing_ids = set(
        db.scalars(
            select(WishlistItem.product_id).where(WishlistItem.user_id == user_id)
        ).all()
    )

    for row in session_rows:
        if row.product_id not in existing_ids:
            db.add(WishlistItem(user_id=user_id, product_id=row.product_id))
            existing_ids.add(row.product_id)
        db.delete(row)

    db.commit()
