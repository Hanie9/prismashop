# Prisma Shop — Backend

FastAPI + PostgreSQL محلی (بدون Docker).

## پیش‌نیاز

- Python 3.11+
- PostgreSQL نصب‌شده روی سیستم (سرویس `postgresql`)

### نصب PostgreSQL روی Fedora

```bash
sudo dnf install -y postgresql-server postgresql postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

سپس کاربر و دیتابیس مطابق `.env` را بسازید:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE prisma LOGIN PASSWORD 'prisma';
CREATE DATABASE prismashop OWNER prisma;
GRANT ALL PRIVILEGES ON DATABASE prismashop TO prisma;
\c prismashop
GRANT ALL ON SCHEMA public TO prisma;
ALTER SCHEMA public OWNER TO prisma;
SQL
```

برای اتصال با رمز از `localhost`، در `/var/lib/pgsql/data/pg_hba.conf` خطوط `host` مربوط به `127.0.0.1/32` و `::1/128` را روی `scram-sha-256` بگذارید و سرویس را reload کنید:

```bash
sudo systemctl reload postgresql
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

محصولات و دسته‌بندی‌ها seed نمی‌شوند؛ کاتالوگ فقط از پنل ادمین ساخته می‌شود.

قبل از اجرا مطمئن شوید سرویس دیتابیس فعال است:

```bash
systemctl is-active postgresql
```

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
