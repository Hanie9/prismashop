from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_admin, get_current_user, get_optional_user
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas import (
    FeaturedReviewOut,
    MessageResponse,
    ReviewAdminUpdate,
    ReviewCreate,
    ReviewOut,
)
from app.services.reviews import refresh_product_rating

router = APIRouter(tags=["reviews"])


def _user_display(user: User) -> str:
    name = f"{user.first_name} {user.last_name}".strip()
    return name or user.email


def _serialize_review(
    review: Review,
    *,
    current_user_id: int | None = None,
) -> ReviewOut:
    user = review.user
    product = review.product
    return ReviewOut(
        id=review.id,
        product_id=review.product_id,
        product_name=product.name if product else None,
        user_id=review.user_id,
        user_name=_user_display(user) if user else "کاربر",
        rating=review.rating,
        text=review.text,
        featured_on_home=review.featured_on_home,
        featured_order=review.featured_order,
        role_label=review.role_label,
        created_at=review.created_at,
        is_mine=bool(current_user_id and review.user_id == current_user_id),
    )


@router.get("/products/{product_id}/reviews", response_model=list[ReviewOut])
def list_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    product = db.get(Product, product_id)
    if not product or not product.active:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")

    rows = (
        db.scalars(
            select(Review)
            .where(Review.product_id == product_id)
            .options(joinedload(Review.user), joinedload(Review.product))
            .order_by(Review.created_at.desc())
        )
        .unique()
        .all()
    )
    current_id = user.id if user else None
    return [_serialize_review(r, current_user_id=current_id) for r in rows]


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product or not product.active:
        raise HTTPException(status_code=404, detail="محصول یافت نشد")

    existing = db.scalar(
        select(Review).where(
            Review.product_id == product_id,
            Review.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="شما قبلاً برای این محصول نظر ثبت کرده‌اید",
        )

    review = Review(
        product_id=product_id,
        user_id=user.id,
        rating=payload.rating,
        text=payload.text.strip(),
    )
    db.add(review)
    db.flush()
    refresh_product_rating(db, product_id)
    db.commit()

    loaded = db.scalar(
        select(Review)
        .where(Review.id == review.id)
        .options(joinedload(Review.user), joinedload(Review.product))
    )
    assert loaded is not None
    return _serialize_review(loaded, current_user_id=user.id)


@router.get("/reviews/featured", response_model=list[FeaturedReviewOut])
def list_featured_reviews(db: Session = Depends(get_db)):
    rows = (
        db.scalars(
            select(Review)
            .where(Review.featured_on_home.is_(True))
            .options(joinedload(Review.user), joinedload(Review.product))
            .order_by(Review.featured_order.asc(), Review.created_at.desc())
            .limit(12)
        )
        .unique()
        .all()
    )

    out: list[FeaturedReviewOut] = []
    for review in rows:
        name = _user_display(review.user) if review.user else "مشتری"
        role = review.role_label or (
            f"خریدار «{review.product.name}»" if review.product else "مشتری پریسما شاپ"
        )
        out.append(
            FeaturedReviewOut(
                id=review.id,
                name=name,
                role=role,
                text=review.text,
                rating=review.rating,
                avatar=name[0] if name else "م",
                product_name=review.product.name if review.product else None,
            )
        )
    return out


@router.get("/admin/reviews", response_model=list[ReviewOut])
def admin_list_reviews(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    rows = (
        db.scalars(
            select(Review)
            .options(joinedload(Review.user), joinedload(Review.product))
            .order_by(Review.featured_on_home.desc(), Review.created_at.desc())
        )
        .unique()
        .all()
    )
    return [_serialize_review(r) for r in rows]


@router.patch("/admin/reviews/{review_id}", response_model=ReviewOut)
def admin_update_review(
    review_id: int,
    payload: ReviewAdminUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    review = db.scalar(
        select(Review)
        .where(Review.id == review_id)
        .options(joinedload(Review.user), joinedload(Review.product))
    )
    if not review:
        raise HTTPException(status_code=404, detail="نظر یافت نشد")

    data = payload.updates()
    if "featured_on_home" in data and data["featured_on_home"] is not None:
        turning_on = bool(data["featured_on_home"]) and not review.featured_on_home
        review.featured_on_home = bool(data["featured_on_home"])
        if turning_on:
            max_order = db.scalar(
                select(func.coalesce(func.max(Review.featured_order), 0))
            )
            review.featured_order = int(max_order or 0) + 1
    if "featured_order" in data and data["featured_order"] is not None:
        review.featured_order = int(data["featured_order"])
    if "role_label" in data:
        label = data["role_label"]
        review.role_label = (label or "").strip() or None

    db.add(review)
    db.commit()
    db.refresh(review)
    return _serialize_review(review)


@router.delete("/admin/reviews/{review_id}", response_model=MessageResponse)
def admin_delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="نظر یافت نشد")
    product_id = review.product_id
    db.delete(review)
    db.flush()
    refresh_product_rating(db, product_id)
    db.commit()
    return MessageResponse(message="نظر حذف شد")
