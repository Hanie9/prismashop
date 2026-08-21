from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.coupon import Coupon
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas import AggregatedCustomer, DashboardStats, ProductOut
from app.services.pricing import is_low_stock
from app.services.serializers import serialize_order, serialize_product

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    products = db.scalars(select(Product)).all()
    active_products = sum(1 for p in products if p.active)
    low_stock_products = sum(
        1 for p in products if is_low_stock(p.stock, p.low_stock_threshold)
    )
    out_of_stock = sum(1 for p in products if p.stock <= 0)

    open_orders = (
        db.scalar(
            select(func.count())
            .select_from(Order)
            .where(Order.status.in_(["pending", "processing"]))
        )
        or 0
    )
    categories_count = db.scalar(select(func.count()).select_from(Category)) or 0
    active_coupons = (
        db.scalar(
            select(func.count()).select_from(Coupon).where(Coupon.active.is_(True))
        )
        or 0
    )

    confirmed_revenue = (
        db.scalar(
            select(func.coalesce(func.sum(Order.total), 0)).where(
                Order.status != "cancelled"
            )
        )
        or 0
    )

    recent = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(6)
    ).all()

    return DashboardStats(
        active_products=active_products,
        open_orders=open_orders,
        low_stock_products=low_stock_products,
        categories_count=categories_count,
        confirmed_revenue=int(confirmed_revenue),
        out_of_stock=out_of_stock,
        active_coupons=active_coupons,
        recent_orders=[serialize_order(o) for o in recent],
    )


@router.get("/customers", response_model=list[AggregatedCustomer])
def list_customers(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    """All registered users + guest checkouts merged by phone."""
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    orders = db.scalars(
        select(Order)
        .where(Order.status != "cancelled")
        .order_by(Order.created_at.desc())
    ).all()

    by_phone: dict[str, AggregatedCustomer] = {}

    for user in users:
        by_phone[user.mobile] = AggregatedCustomer(
            phone=user.mobile,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            city=user.city or "",
            province=user.province or "",
            address=user.address,
            postal_code=user.postal_code,
            orders_count=0,
            total_spent=0,
            last_order_at=None,
            registered_at=user.created_at,
            is_registered=True,
        )

    for order in orders:
        phone = order.customer_phone
        if phone in by_phone:
            row = by_phone[phone]
            by_phone[phone] = AggregatedCustomer(
                phone=phone,
                first_name=row.first_name or order.customer_first_name,
                last_name=row.last_name or order.customer_last_name,
                email=row.email or order.customer_email,
                city=row.city or order.customer_city,
                province=row.province or order.customer_province,
                address=row.address or order.customer_address,
                postal_code=row.postal_code or order.customer_postal_code,
                orders_count=row.orders_count + 1,
                total_spent=row.total_spent + order.total,
                last_order_at=row.last_order_at or order.created_at,
                registered_at=row.registered_at,
                is_registered=row.is_registered,
            )
        else:
            by_phone[phone] = AggregatedCustomer(
                phone=phone,
                first_name=order.customer_first_name,
                last_name=order.customer_last_name,
                email=order.customer_email,
                city=order.customer_city,
                province=order.customer_province,
                address=order.customer_address,
                postal_code=order.customer_postal_code,
                orders_count=1,
                total_spent=order.total,
                last_order_at=order.created_at,
                registered_at=None,
                is_registered=False,
            )

    def sort_key(c: AggregatedCustomer):
        return c.last_order_at or c.registered_at or datetime.min.replace(tzinfo=UTC)

    return sorted(by_phone.values(), key=sort_key, reverse=True)


@router.get("/inventory", response_model=list[ProductOut])
def inventory(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
    stock_filter: str = Query(
        default="all",
        alias="filter",
        description="all | low-stock | out-of-stock",
    ),
):
    products = db.scalars(select(Product).order_by(Product.name)).all()
    items = [serialize_product(p) for p in products]
    if stock_filter == "low-stock":
        return [p for p in items if p.is_low_stock]
    if stock_filter == "out-of-stock":
        return [p for p in items if p.stock <= 0]
    return items
