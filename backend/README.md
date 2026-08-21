# Prisma Shop — Backend

FastAPI + PostgreSQL (بدون نیاز به Docker برای اجرای محلی).

## پیش‌نیاز

- Python 3.11+
- PostgreSQL با دیتابیس/کاربر مطابق `.env`

```bash
createdb prismashop
```

## اجرا

```bash
cd backend
cp .env.example .env          # در صورت نیاز DATABASE_URL را ویرایش کنید
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed.run
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

ادمین پس از seed: `admin@prismashop.ir` / `admin123`

## ماژول‌های اصلی API

| مسیر | نقش |
|------|-----|
| `/api/auth/*` | سشن، ثبت‌نام، ورود، پروفایل |
| `/api/products/*` | محصولات + نظرات هر محصول |
| `/api/cart` | سبد مشتری (GET/PUT) و همگام‌سازی (`/sync`) |
| `/api/cart/validate` | اعتبارسنجی موجودی قبل از تسویه |
| `/api/wishlist/*` | علاقه‌مندی مشتری |
| `/api/orders/*` | ثبت و مدیریت سفارش |
| `/api/reviews/featured` | نظرات منتخب صفحه اصلی |
| `/api/admin/reviews` | مدیریت نظرات و انتخاب برای صفحه اصلی |
| `/api/coupons/*` · `/api/admin/*` | تخفیف، داشبورد، مشتریان، موجودی |
| `/api/uploads/image` | آپلود تصویر ادمین |

جداول مهم: `users`, `products`, `orders`, `cart_items`, `wishlist_items`, `reviews`, `coupons`, `sessions`.

## اعتبارسنجی

ثبت‌نام، ورود و چک‌اوت با regex بررسی می‌شوند:

- موبایل ایران: `^09\d{9}$`
- ایمیل: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- رمز عبور: `^.{8,128}$` (حداقل ۸ کاراکتر)
- ورود: شناسه باید یا ایمیل معتبر باشد یا موبایل ۱۱ رقمی با `09`

## سشن

هر بازدیدکننده `session_id` سمت سرور دارد (کوکی `prismashop_session` + هدر `X-Session-Id`).  
ورود شناسه را عوض می‌کند (جلوگیری از session fixation). احراز هویت از جدول `sessions` خوانده می‌شود.

## نظرات و امتیاز

- مشتری برای هر محصول حداکثر یک نظر ثبت می‌کند.
- `rating` و `review_count` محصول فقط از جدول `reviews` محاسبه می‌شوند (ادمین دستی تنظیم نمی‌کند).
- با `featured_on_home` ادمین نظر را برای صفحه اصلی انتخاب می‌کند.

## سبد خرید

- سبد مشتری در `cart_items` ذخیره می‌شود.
- `POST /api/cart/sync` سبد مهمان را با سبد سرور ادغام می‌کند.

## مقیاس

- پول SQLAlchemy: `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` در `.env`
- GZip، `statement_timeout`، پاک‌سازی دوره‌ای سشن‌های منقضی
- چند worker پشت reverse proxy:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```
