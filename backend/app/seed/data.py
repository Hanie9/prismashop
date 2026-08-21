"""Seed payload matching app/lib/shop-seed.ts."""

SEED_CATEGORIES = [
    {
        "id": "raw",
        "name": "محصولات چوبی خام",
        "icon": "🪵",
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    },
    {
        "id": "furniture",
        "name": "مبلمان چوبی",
        "icon": "🪑",
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop",
    },
    {
        "id": "decorative",
        "name": "دکوری و تزئینی",
        "icon": "🎨",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
    },
    {
        "id": "tools",
        "name": "ابزار نجاری",
        "icon": "🔨",
        "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&h=200&fit=crop",
    },
    {
        "id": "paint",
        "name": "رنگ و پوشش",
        "icon": "🖌️",
        "image": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300&h=200&fit=crop",
    },
    {
        "id": "boards",
        "name": "انواع تخته",
        "icon": "📦",
        "image": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300&h=200&fit=crop",
    },
    {
        "id": "calligraphy",
        "name": "حروف کالیگرافی",
        "icon": "✍️",
        "image": "/images/calligraphy/calligraphy-5.jpg",
    },
]

RAW_SEED_PRODUCTS = [
    {
        "id": 1,
        "name": "جاقلمی چوبی خام دو خانه دالبری",
        "price": 85000,
        "original_price": 110000,
        "image": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop",
        "category_name": "محصولات چوبی خام",
        "category_id": "raw",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": 22,
        "stock": 18,
        "low_stock_threshold": 5,
        "description": "جاقلمی چوبی خام با دو خانه دالبری، مناسب میز کار و هدیه.",
        "active": True,
    },
    {
        "id": 2,
        "name": "قاب عکس چوبی روستیک سایز A4",
        "price": 120000,
        "original_price": 150000,
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
        "category_name": "دکوری و تزئینی",
        "category_id": "decorative",
        "rating": 0,
        "review_count": 0,
        "is_new": True,
        "discount": None,
        "stock": 4,
        "low_stock_threshold": 5,
        "description": "قاب عکس چوبی با بافت روستیک، سایز A4 برای عکس‌های خانوادگی.",
        "active": True,
    },
    {
        "id": 3,
        "name": "جعبه چوبی هدیه با درب کشویی",
        "price": 95000,
        "original_price": None,
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
        "category_name": "محصولات چوبی خام",
        "category_id": "raw",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": None,
        "stock": 25,
        "low_stock_threshold": 5,
        "description": "جعبه هدیه چوبی با درب کشویی، مناسب بسته‌بندی ویژه.",
        "active": True,
    },
    {
        "id": 4,
        "name": "کتاب‌خانه دیواری چوب طبیعی",
        "price": 1850000,
        "original_price": 2200000,
        "image": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=400&fit=crop",
        "category_name": "مبلمان چوبی",
        "category_id": "furniture",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": 15,
        "stock": 3,
        "low_stock_threshold": 5,
        "description": "کتاب‌خانه دیواری از چوب طبیعی، طراحی مینیمال و مقاوم.",
        "active": True,
    },
    {
        "id": 5,
        "name": "ست ابزار نجاری حرفه‌ای ۱۲ عددی",
        "price": 380000,
        "original_price": 450000,
        "image": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop",
        "category_name": "ابزار نجاری",
        "category_id": "tools",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": 15,
        "stock": 32,
        "low_stock_threshold": 5,
        "description": "ست ۱۲ عددی ابزار نجاری حرفه‌ای برای کارگاه و خانه.",
        "active": True,
    },
    {
        "id": 6,
        "name": "میز کنسول چوبی آنتیک",
        "price": 2400000,
        "original_price": None,
        "image": "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=400&fit=crop",
        "category_name": "مبلمان چوبی",
        "category_id": "furniture",
        "rating": 0,
        "review_count": 0,
        "is_new": True,
        "discount": None,
        "stock": 5,
        "low_stock_threshold": 5,
        "description": "میز کنسول چوبی با ظاهر آنتیک، مناسب ورودی و پذیرایی.",
        "active": True,
    },
    {
        "id": 7,
        "name": "رنگ وود استین ماهون ۱ لیتری",
        "price": 145000,
        "original_price": 175000,
        "image": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=400&fit=crop",
        "category_name": "رنگ و پوشش",
        "category_id": "paint",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": 17,
        "stock": 40,
        "low_stock_threshold": 5,
        "description": "رنگ وود استین ماهون یک لیتری برای پوشش چوب طبیعی.",
        "active": True,
    },
    {
        "id": 8,
        "name": "تابلو دیواری برش لیزر چوب گردو",
        "price": 320000,
        "original_price": None,
        "image": "https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400&h=400&fit=crop",
        "category_name": "دکوری و تزئینی",
        "category_id": "decorative",
        "rating": 0,
        "review_count": 0,
        "is_new": True,
        "discount": None,
        "stock": 12,
        "low_stock_threshold": 5,
        "description": "تابلو دیواری برش لیزر از چوب گردو با طرح ظریف.",
        "active": True,
    },
    {
        "id": 9,
        "name": "حروف کالیگرافی چوبی مدل عشق",
        "price": 210000,
        "original_price": 250000,
        "image": "/images/calligraphy/calligraphy-1.jpg",
        "category_name": "حروف کالیگرافی",
        "category_id": "calligraphy",
        "rating": 0,
        "review_count": 0,
        "is_new": True,
        "discount": None,
        "stock": 22,
        "low_stock_threshold": 5,
        "description": "حروف کالیگرافی چوبی مدل عشق، مناسب دکوراسیون دیوار.",
        "active": True,
    },
    {
        "id": 10,
        "name": "حروف کالیگرافی آینه‌ای مدل امید",
        "price": 185000,
        "original_price": None,
        "image": "/images/calligraphy/calligraphy-2.jpg",
        "category_name": "حروف کالیگرافی",
        "category_id": "calligraphy",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": None,
        "stock": 15,
        "low_stock_threshold": 5,
        "description": "حروف کالیگرافی آینه‌ای مدل امید با جلوه لوکس.",
        "active": True,
    },
    {
        "id": 11,
        "name": "تابلو حروف کالیگرافی دیواری مدل زندگی",
        "price": 340000,
        "original_price": 390000,
        "image": "/images/calligraphy/calligraphy-4.jpg",
        "category_name": "حروف کالیگرافی",
        "category_id": "calligraphy",
        "rating": 0,
        "review_count": 0,
        "is_new": False,
        "discount": 13,
        "stock": 8,
        "low_stock_threshold": 5,
        "description": "تابلو حروف کالیگرافی دیواری مدل زندگی، دست‌ساز و باکیفیت.",
        "active": True,
    },
]


def enrich_product_content(product: dict) -> dict:
    desc = product.get("description") or ""
    first = desc or (
        "این محصول از چوب درجه یک ایرانی با دقت و مهارت بالا ساخته شده است. "
        "سطح محصول کاملاً صاف و آماده رنگ‌آمیزی یا دکوپاژ است."
    )
    second = (
        "برای حفظ کیفیت، از لحظه تولید تا تحویل به مشتری، تمام مراحل زیر نظر کارشناسان "
        "متخصص ما انجام می‌شود. این محصول بهترین گزینه برای:"
    )
    return {
        **product,
        "detail_paragraphs": product.get("detail_paragraphs") or [first, second],
        "highlights": product.get("highlights")
        or [
            "هنر دکوپاژ و دکوپاژ روی چوب",
            "نجاری خانگی و پروژه‌های DIY",
            "دکوراسیون داخلی منزل و محل کار",
            "کلاس‌های هنری و کارگاه‌های آموزشی",
        ],
        "specs": product.get("specs")
        or [
            {"label": "جنس", "value": "چوب طبیعی (MDF درجه یک)"},
            {"label": "ابعاد", "value": "۲۰ × ۱۵ × ۵ سانتی‌متر"},
            {"label": "وزن", "value": "۳۵۰ گرم"},
            {"label": "رنگ", "value": "رنگ طبیعی چوب"},
            {"label": "سطح", "value": "سمباده‌زده و آماده رنگ‌کاری"},
            {"label": "کشور تولیدکننده", "value": "ایران"},
            {"label": "ضمانت", "value": "۷ روز ضمانت بازگشت"},
        ],
    }


def build_seed_products() -> list[dict]:
    products = []
    for product in RAW_SEED_PRODUCTS:
        if product["category_id"] == "calligraphy":
            gallery = [
                product["image"],
                "/images/calligraphy/calligraphy-1.jpg",
                "/images/calligraphy/calligraphy-2.jpg",
                "/images/calligraphy/calligraphy-5.jpg",
            ]
            # dedupe preserve order
            seen: set[str] = set()
            images = []
            for src in gallery:
                if src not in seen:
                    seen.add(src)
                    images.append(src)
        else:
            images = [product["image"]]
        products.append(
            enrich_product_content({**product, "images": images, "image": images[0]})
        )
    return products


SEED_COUPONS = [
    {
        "id": "coupon-prisma10",
        "code": "PRISMA10",
        "type": "percent",
        "value": 10,
        "active": True,
        "min_order": 0,
    },
    {
        "id": "coupon-wood20",
        "code": "WOOD20",
        "type": "percent",
        "value": 20,
        "active": True,
        "min_order": 500000,
    },
    {
        "id": "coupon-fixed50",
        "code": "FIXED50",
        "type": "fixed",
        "value": 50000,
        "active": True,
        "min_order": 300000,
    },
]
