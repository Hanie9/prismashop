from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.schemas import ProductCreate, ProductUpdate
from app.services.pricing import calc_sale_price, normalize_images


def apply_product_pricing(
    original_price: int,
    discount_percent: int,
) -> tuple[int, int | None, int | None]:
    """Returns (price, original_price_or_none, discount_or_none)."""
    has_discount = discount_percent > 0 and original_price > 0
    sale = calc_sale_price(original_price, discount_percent if has_discount else 0)
    if has_discount:
        return sale, original_price, round(discount_percent)
    return sale, None, None


def _clean_str_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    return [v.strip() for v in values if isinstance(v, str) and v.strip()]


def _clean_specs(specs: list | None) -> list[dict[str, str]]:
    if not specs:
        return []
    cleaned: list[dict[str, str]] = []
    for item in specs:
        if hasattr(item, "model_dump"):
            data = item.model_dump()
        elif isinstance(item, dict):
            data = item
        else:
            continue
        label = str(data.get("label", "")).strip()
        value = str(data.get("value", "")).strip()
        if label and value:
            cleaned.append({"label": label, "value": value})
    return cleaned


def create_product_from_payload(db: Session, payload: ProductCreate) -> Product:
    category = db.get(Category, payload.category_id)
    if not category:
        raise ValueError("دسته‌بندی یافت نشد")

    cover, images = normalize_images(payload.images)
    price, original, discount = apply_product_pricing(
        payload.original_price, payload.discount_percent
    )

    product = Product(
        name=payload.name.strip(),
        price=price,
        original_price=original,
        image=cover,
        images=images,
        category_id=category.id,
        category_name=category.name,
        rating=0.0,
        review_count=0,
        is_new=payload.is_new,
        is_bestseller=payload.is_bestseller,
        discount=discount,
        stock=payload.stock,
        low_stock_threshold=payload.low_stock_threshold,
        description=(payload.description or "").strip() or None,
        detail_paragraphs=_clean_str_list(payload.detail_paragraphs),
        highlights=_clean_str_list(payload.highlights),
        specs=_clean_specs(payload.specs),
        active=payload.active,
    )
    db.add(product)
    db.flush()
    return product


def update_product_from_payload(
    db: Session, product: Product, payload: ProductUpdate
) -> Product:
    data = payload.updates()

    if "category_id" in data and data["category_id"] is not None:
        category = db.get(Category, data["category_id"])
        if not category:
            raise ValueError("دسته‌بندی یافت نشد")
        product.category_id = category.id
        product.category_name = category.name

    if "name" in data and data["name"] is not None:
        product.name = data["name"].strip()

    if "images" in data and data["images"] is not None:
        cover, images = normalize_images(data["images"])
        product.image = cover
        product.images = images

    # pricing: if either original or discount provided, recompute
    if "original_price" in data or "discount_percent" in data:
        original = data.get("original_price")
        if original is None:
            original = product.original_price or product.price
        discount_percent = data.get("discount_percent")
        if discount_percent is None:
            discount_percent = product.discount or 0
        price, orig, disc = apply_product_pricing(original, discount_percent)
        product.price = price
        product.original_price = orig
        product.discount = disc

    if "description" in data:
        desc = data["description"]
        product.description = (desc or "").strip() or None

    if "detail_paragraphs" in data:
        product.detail_paragraphs = _clean_str_list(data["detail_paragraphs"])

    if "highlights" in data:
        product.highlights = _clean_str_list(data["highlights"])

    if "specs" in data:
        product.specs = _clean_specs(data["specs"])

    for field in (
        "is_new",
        "is_bestseller",
        "stock",
        "low_stock_threshold",
        "active",
    ):
        if field in data and data[field] is not None:
            setattr(product, field, data[field])

    db.flush()
    return product
