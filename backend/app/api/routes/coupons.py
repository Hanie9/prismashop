import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.admin_user import AdminUser
from app.models.coupon import Coupon
from app.schemas import (
    CouponCreate,
    CouponOut,
    CouponUpdate,
    CouponValidateRequest,
    CouponValidateResponse,
)
from app.services.orders import validate_coupon_for_subtotal

router = APIRouter(prefix="/coupons", tags=["coupons"])


def _validate_coupon_values(coupon_type: str, value: int) -> None:
    if coupon_type == "percent" and not (0 < value <= 100):
        raise HTTPException(
            status_code=400,
            detail="مقدار درصدی باید بین ۱ تا ۱۰۰ باشد",
        )
    if coupon_type == "fixed" and value <= 0:
        raise HTTPException(status_code=400, detail="مبلغ ثابت باید بزرگ‌تر از صفر باشد")


@router.get("", response_model=list[CouponOut])
def list_coupons(
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    return db.scalars(select(Coupon).order_by(Coupon.code)).all()


@router.get("/available", response_model=list[CouponOut])
def list_available_coupons(db: Session = Depends(get_db)):
    """Active coupons for customer profile (codes + conditions)."""
    return db.scalars(
        select(Coupon).where(Coupon.active.is_(True)).order_by(Coupon.code)
    ).all()


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(payload: CouponValidateRequest, db: Session = Depends(get_db)):
    valid, discount, message, coupon = validate_coupon_for_subtotal(
        db, payload.code, payload.subtotal
    )
    return CouponValidateResponse(
        valid=valid,
        discount=discount,
        message=message,
        coupon=CouponOut.model_validate(coupon) if coupon and valid else None,
    )


@router.post("", response_model=CouponOut, status_code=201)
def create_coupon(
    payload: CouponCreate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    _validate_coupon_values(payload.type, payload.value)
    exists = db.scalar(select(Coupon).where(Coupon.code == payload.code))
    if exists:
        raise HTTPException(status_code=400, detail="کد تخفیف تکراری است")

    coupon = Coupon(
        id=f"coupon-{int(time.time() * 1000)}",
        code=payload.code,
        type=payload.type,
        value=payload.value,
        active=payload.active,
        min_order=payload.min_order,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.patch("/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: str,
    payload: CouponUpdate,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف یافت نشد")

    data = payload.model_dump(exclude_unset=True)
    new_type = data.get("type", coupon.type)
    new_value = data.get("value", coupon.value)
    _validate_coupon_values(new_type, new_value)

    if "code" in data and data["code"]:
        other = db.scalar(
            select(Coupon).where(Coupon.code == data["code"], Coupon.id != coupon.id)
        )
        if other:
            raise HTTPException(status_code=400, detail="کد تخفیف تکراری است")
        coupon.code = data["code"]

    for field in ("type", "value", "active", "min_order"):
        if field in data and data[field] is not None:
            setattr(coupon, field, data[field])

    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/{coupon_id}", status_code=204)
def delete_coupon(
    coupon_id: str,
    db: Session = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="کد تخفیف یافت نشد")
    db.delete(coupon)
    db.commit()
