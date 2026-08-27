from app.core.config import get_settings

FREE_SHIPPING_THRESHOLD = 500_000
SHIPPING_COST = 60_000
MAX_PRODUCT_IMAGES = 8
ORDER_STATUSES = ("pending", "processing", "shipped", "delivered", "cancelled")
COUPON_TYPES = ("percent", "fixed")


def calc_sale_price(original: int, discount_percent: int | None) -> int:
    if not original or original <= 0:
        return 0
    if not discount_percent or discount_percent <= 0:
        return round(original)
    clamped = min(100, max(0, discount_percent))
    return max(0, round(original * (1 - clamped / 100)))


def calc_shipping(shipping_cost: int | None) -> int:
    """Flat shipping fee configured by the admin; 0 means shipping is not charged."""
    return max(0, shipping_cost or 0)


def calc_coupon_discount(subtotal: int, coupon) -> int:
    """Mirror app/lib/coupons.ts calcCouponDiscount."""
    if coupon is None or not getattr(coupon, "active", False):
        return 0
    if subtotal < coupon.min_order:
        return 0
    if coupon.type == "percent":
        return (subtotal * coupon.value) // 100
    return min(coupon.value, subtotal)


def normalize_images(images: list[str], max_images: int | None = None) -> tuple[str, list[str]]:
    limit = max_images or get_settings().MAX_PRODUCT_IMAGES
    cleaned: list[str] = []
    for src in images:
        src = (src or "").strip()
        if src and src not in cleaned:
            cleaned.append(src)
        if len(cleaned) >= limit:
            break
    if not cleaned:
        raise ValueError("حداقل یک تصویر برای محصول لازم است")
    return cleaned[0], cleaned


def is_low_stock(stock: int, threshold: int) -> bool:
    return stock > 0 and stock <= threshold
