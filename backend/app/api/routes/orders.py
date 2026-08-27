from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import RequestSession, get_current_admin, get_request_session
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.order import Order
from app.schemas import CheckoutRequest, OrderOut, OrderStatusUpdate
from app.services.orders import create_order, get_order_by_tracking
from app.services.serializers import serialize_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=201)
def place_order(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    if ctx.auth.role not in ("customer", "admin") or (
        ctx.user is None and ctx.admin is None
    ):
        raise HTTPException(
            status_code=401,
            detail="برای ثبت سفارش باید وارد حساب کاربری شوید",
        )
    order = create_order(db, payload, user=ctx.user, admin=ctx.admin)
    return serialize_order(order)


@router.get("/me", response_model=list[OrderOut])
def my_orders(
    db: Session = Depends(get_db),
    ctx: RequestSession = Depends(get_request_session),
):
    if ctx.auth.role == "admin" and ctx.admin:
        owner_filter = Order.admin_id == ctx.admin.id
    elif ctx.auth.role == "customer" and ctx.user:
        owner_filter = Order.user_id == ctx.user.id
    else:
        raise HTTPException(
            status_code=401,
            detail="برای دیدن سفارش‌ها باید وارد حساب کاربری شوید",
        )

    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(owner_filter)
        .order_by(Order.created_at.desc())
    ).all()
    return [serialize_order(o) for o in orders]


@router.get("/track/{tracking_code}", response_model=OrderOut)
def track_order(tracking_code: str, db: Session = Depends(get_db)):
    order = get_order_by_tracking(db, tracking_code)
    if not order:
        raise HTTPException(status_code=404, detail="سفارشی با این کد یافت نشد")
    return serialize_order(order)


@router.get("", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
    status_filter: str | None = Query(default=None, alias="status"),
):
    query = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())
    if status_filter and status_filter != "all":
        query = query.where(Order.status == status_filter)
    orders = db.scalars(query).all()
    return [serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")
    return serialize_order(order)


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    if not order:
        raise HTTPException(status_code=404, detail="سفارش یافت نشد")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    assert order is not None
    return serialize_order(order)
