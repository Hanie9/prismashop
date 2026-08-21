from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.product import Product
from app.schemas import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


def _with_count(db: Session, category: Category) -> CategoryOut:
    count = db.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.category_id == category.id)
    ) or 0
    return CategoryOut(
        id=category.id,
        name=category.name,
        icon=category.icon,
        image=category.image,
        product_count=count,
    )


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    categories = db.scalars(select(Category).order_by(Category.id)).all()
    return [_with_count(db, c) for c in categories]


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: str, db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")
    return _with_count(db, category)


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    if db.get(Category, payload.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="شناسه دسته‌بندی تکراری است",
        )
    category = Category(
        id=payload.id,
        name=payload.name.strip(),
        icon=payload.icon or "📦",
        image=payload.image,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return _with_count(db, category)


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        new_name = data["name"].strip()
        category.name = new_name
        # cascade denormalized category name on products (match site)
        products = db.scalars(
            select(Product).where(Product.category_id == category.id)
        ).all()
        for product in products:
            product.category_name = new_name
    if "icon" in data and data["icon"] is not None:
        category.icon = data["icon"]
    if "image" in data and data["image"] is not None:
        category.image = data["image"]

    db.commit()
    db.refresh(category)
    return _with_count(db, category)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="دسته‌بندی یافت نشد")
    count = db.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.category_id == category.id)
    ) or 0
    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ابتدا محصولات این دسته را حذف یا جابه‌جا کنید",
        )
    db.delete(category)
    db.commit()
