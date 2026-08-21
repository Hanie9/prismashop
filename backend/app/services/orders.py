import random
import time

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.coupon import Coupon
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas import CheckoutRequest
from app.services.pricing import calc_coupon_discount, calc_shipping
from app.services.serializers import serialize_order


def find_active_coupon(db: Session, code: str | None) -> Coupon | None:
    if not code:
        return None
    normalized = code.strip().upper()
    return db.scalar(
        select(Coupon).where(
            Coupon.active.is_(True),
            Coupon.code == normalized,
        )
    )


def validate_coupon_for_subtotal(
    db: Session, code: str, subtotal: int
) -> tuple[bool, int, str | None, Coupon | None]:
    coupon = find_active_coupon(db, code)
    if not coupon:
        return False, 0, "کد تخفیف نامعتبر است", None
    if subtotal < coupon.min_order:
        return (
            False,
            0,
            f"حداقل مبلغ سفارش برای این کد {coupon.min_order:,} تومان است",
            coupon,
        )
    discount = calc_coupon_discount(subtotal, coupon)
    return True, discount, None, coupon


def generate_tracking_code(db: Session) -> str:
    for _ in range(20):
        code = f"PRS-{random.randint(100000, 999999)}"
        exists = db.scalar(select(Order.id).where(Order.tracking_code == code))
        if not exists:
            return code
    raise RuntimeError("نتوانستیم کد پیگیری یکتا بسازیم")


def create_order(
    db: Session,
    payload: CheckoutRequest,
    *,
    user: User | None = None,
) -> Order:
    # Lock products for update to avoid oversell
    product_ids = [item.product_id for item in payload.items]
    products = (
        db.execute(
            select(Product)
            .where(Product.id.in_(product_ids))
            .with_for_update()
        )
        .scalars()
        .all()
    )
    by_id = {p.id: p for p in products}

    line_items: list[tuple[Product, int]] = []
    for item in payload.items:
        product = by_id.get(item.product_id)
        if not product or not product.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"محصول {item.product_id} موجود نیست",
            )
        if product.stock <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"«{product.name}» ناموجود است",
            )
        if item.qty > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"موجودی «{product.name}» کافی نیست "
                    f"(حداکثر {product.stock})"
                ),
            )
        line_items.append((product, item.qty))

    subtotal = sum(product.price * qty for product, qty in line_items)
    coupon = find_active_coupon(db, payload.coupon_code)
    discount = calc_coupon_discount(subtotal, coupon)
    if payload.coupon_code and discount == 0:
        # If client sent a code but it doesn't apply, reject (match cart UX)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="کد تخفیف نامعتبر است",
            )
        if subtotal < coupon.min_order:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"حداقل مبلغ سفارش برای این کد "
                    f"{coupon.min_order:,} تومان است"
                ),
            )

    shipping = calc_shipping(subtotal)
    total = max(0, subtotal - discount + shipping)

    order_id = f"ord-{int(time.time() * 1000)}"
    tracking = generate_tracking_code(db)
    customer = payload.customer

    order = Order(
        id=order_id,
        tracking_code=tracking,
        status="pending",
        user_id=user.id if user else None,
        customer_first_name=customer.first_name.strip(),
        customer_last_name=customer.last_name.strip(),
        customer_phone=customer.phone,
        customer_email=str(customer.email) if customer.email else None,
        customer_province=customer.province.strip(),
        customer_city=customer.city.strip(),
        customer_address=customer.address.strip(),
        customer_postal_code=customer.postal_code,
        customer_notes=customer.notes.strip() if customer.notes else None,
        subtotal=subtotal,
        shipping=shipping,
        discount=discount,
        total=total,
        coupon_code=coupon.code if coupon and discount > 0 else None,
    )
    db.add(order)

    # Persist shipping profile for next checkouts
    if user is not None:
        user.first_name = customer.first_name.strip()
        user.last_name = customer.last_name.strip()
        user.province = customer.province.strip()
        user.city = customer.city.strip()
        user.address = customer.address.strip()
        user.postal_code = customer.postal_code
        db.add(user)

    for product, qty in line_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                name=product.name,
                price=product.price,
                qty=qty,
                image=product.image,
            )
        )
        product.stock = max(0, product.stock - qty)

    db.commit()
    db.refresh(order)
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    assert order is not None
    return order


def get_order_by_tracking(db: Session, tracking_code: str) -> Order | None:
    return db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.tracking_code == tracking_code.strip().upper())
    )


# re-export for convenience
__all__ = [
    "create_order",
    "find_active_coupon",
    "get_order_by_tracking",
    "serialize_order",
    "validate_coupon_for_subtotal",
]
