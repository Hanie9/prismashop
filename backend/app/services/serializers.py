from app.models.order import Order
from app.models.product import Product
from app.schemas import (
    OrderCustomerOut,
    OrderItemOut,
    OrderOut,
    ProductOut,
)
from app.services.pricing import is_low_stock


def serialize_product(product: Product) -> ProductOut:
    specs_raw = product.specs or []
    specs = []
    for item in specs_raw:
        if isinstance(item, dict) and item.get("label") and item.get("value"):
            specs.append({"label": str(item["label"]), "value": str(item["value"])})

    return ProductOut(
        id=product.id,
        name=product.name,
        price=product.price,
        original_price=product.original_price,
        image=product.image,
        images=list(product.images or []),
        category=product.category_name,
        category_id=product.category_id,
        rating=product.rating,
        review_count=product.review_count,
        is_new=product.is_new,
        discount=product.discount,
        stock=product.stock,
        low_stock_threshold=product.low_stock_threshold,
        description=product.description,
        detail_paragraphs=[str(p).strip() for p in (product.detail_paragraphs or []) if str(p).strip()],
        highlights=[str(h).strip() for h in (product.highlights or []) if str(h).strip()],
        specs=specs,
        active=product.active,
        is_low_stock=is_low_stock(product.stock, product.low_stock_threshold),
    )


def serialize_order(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        tracking_code=order.tracking_code,
        created_at=order.created_at,
        status=order.status,  # type: ignore[arg-type]
        customer=OrderCustomerOut(
            first_name=order.customer_first_name,
            last_name=order.customer_last_name,
            phone=order.customer_phone,
            email=order.customer_email,
            province=order.customer_province,
            city=order.customer_city,
            address=order.customer_address,
            postal_code=order.customer_postal_code,
            notes=order.customer_notes,
        ),
        items=[
            OrderItemOut(
                product_id=item.product_id,
                name=item.name,
                price=item.price,
                qty=item.qty,
                image=item.image,
            )
            for item in order.items
        ],
        subtotal=order.subtotal,
        shipping=order.shipping,
        discount=order.discount,
        total=order.total,
        coupon_code=order.coupon_code,
    )
