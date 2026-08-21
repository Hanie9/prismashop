# پریسما شاپ (Prisma Shop)

فروشگاه آنلاین فارسی برای محصولات چوبی، دکور و حروف کالیگرافی — با فرانت‌اند `Next.js`، بک‌اند `FastAPI` و پایگاه‌داده `PostgreSQL`.

طراحی با تم گرم کرم / قهوه‌ای / طلایی و رابط کاربری کامل `RTL`.

## معماری

| لایه | تکنولوژی |
|------|----------|
| فرانت‌اند | Next.js 16، React 19، TypeScript، Tailwind CSS 4 |
| بک‌اند | FastAPI، SQLAlchemy، Pydantic |
| دیتابیس | PostgreSQL |
| احراز هویت | سشن سمت سرور (کوکی + هدر `X-Session-Id`) |

فرانت از طریق `NEXT_PUBLIC_API_URL` به API وصل می‌شود (پیش‌فرض: `http://localhost:8000`).

## امکانات

### فروشگاه
- صفحه اصلی، دسته‌بندی، جستجو و فیلتر محصولات
- جزئیات محصول: توضیحات، مشخصات، هایلایت و نظرات کاربران
- امتیاز میانگین هر محصول فقط از نظرات واقعی مشتریان محاسبه می‌شود
- سبد خرید اختصاصی هر کاربر (مهمان: localStorage؛ مشتری: همگام با سرور)
- چک‌اوت با استان/شهر ایران، کد تخفیف و ثبت سفارش در دیتابیس
- علاقه‌مندی‌ها (مهمان: localStorage؛ بعد از ورود: همگام با سرور)
- حساب کاربری: سفارش‌های من
- نظرات منتخب ادمین در بخش «نظرات مشتریان» صفحه اصلی
- صفحات درباره ما، تماس، بلاگ

### احراز هویت
- ثبت‌نام و ورود مشتری (ایمیل یا موبایل)
- گزینه «مرا به خاطر بسپار» برای ماندگاری سشن
- ورود ادمین از همان صفحه `/auth/login`
- اعتبارسنجی **regex** برای ایمیل، شماره موبایل ایرانی (`09xxxxxxxxx`) و رمز عبور (حداقل ۸ کاراکتر)
- خروج با دیالوگ تأیید

### پنل ادمین (`/admin`)
- داشبورد، محصولات (آپلود تصویر + قالب محتوا)، دسته‌بندی‌ها
- سفارش‌ها و تغییر وضعیت
- مشتریان
- نظرات: مدیریت نظرات محصولات و انتخاب موارد نمایش در صفحه اصلی
- کدهای تخفیف
- موجودی انبار با ذخیرهٔ جداگانه برای هر محصول و هشدار کم‌موجودی

> ورود ادمین: `admin@prismashop.ir` / `admin123` (بعد از seed)

## پیش‌نیازها

- Node.js 20+
- Python 3.11+
- PostgreSQL محلی (بدون Docker) در حال اجرا

## راه‌اندازی

### ۱) دیتابیس (PostgreSQL سیستم)

روی Fedora:

```bash
sudo dnf install -y postgresql-server postgresql postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

کاربر/دیتابیس مطابق `backend/.env.example`:

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

در `pg_hba.conf` احراز هویت `host` برای `127.0.0.1` و `::1` را `scram-sha-256` کنید، سپس:

```bash
sudo systemctl reload postgresql
```

جزئیات بیشتر در [`backend/README.md`](backend/README.md).

### ۲) بک‌اند

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed.run             # محصولات نمونه + ادمین
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- مستندات API: http://localhost:8000/docs  
- سلامت سرویس: http://localhost:8000/health  

جزئیات بیشتر در [`backend/README.md`](backend/README.md).

### ۳) فرانت‌اند

در ریشهٔ پروژه فایل `.env.local` بسازید:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

سپس:

```bash
npm install
npm run dev
```

فروشگاه: http://localhost:3000

## اسکریپت‌های فرانت

| دستور | توضیح |
|--------|--------|
| `npm run dev` | توسعه |
| `npm run build` | بیلد production |
| `npm run start` | اجرای بیلد |
| `npm run lint` | ESLint |

## ساختار کلی

```text
app/                    فرانت‌اند Next.js (App Router)
  admin/                پنل مدیریت (محصولات، سفارش‌ها، نظرات، …)
  account/              سفارش‌های مشتری
  auth/                 ورود / ثبت‌نام
  cart/ checkout/       سبد و تسویه
  components/           کامپوننت‌ها و Providerها
  lib/                  api.ts، validation، انواع داده
backend/                FastAPI
  app/api/routes/       endpointها (products, cart, reviews, …)
  app/models/           مدل‌های SQLAlchemy
  app/schemas/          اعتبارسنجی Pydantic (+ regex)
  app/seed/             دادهٔ اولیه
```

## مسیرهای اصلی

| مسیر | توضیح |
|------|--------|
| `/` | صفحه اصلی |
| `/products` · `/products/[id]` | لیست و جزئیات محصول |
| `/cart` · `/checkout` | سبد و پرداخت |
| `/auth/login` · `/auth/signup` | ورود و ثبت‌نام |
| `/wishlist` · `/account/orders` | علاقه‌مندی و سفارش‌ها |
| `/admin` | پنل ادمین |
| `/admin/reviews` | مدیریت نظرات و نمایش در صفحه اصلی |

## نکات فنی

- **سبد خرید:** هر مشتری سبد جدا در جدول `cart_items` دارد؛ مهمان در `localStorage` (`prismashop-cart:guest`). با ورود، سبد مهمان با سبد کاربر ادغام می‌شود.
- **نظرات:** هر مشتری برای هر محصول یک نظر؛ میانگین امتیاز محصول از همین نظرات به‌روز می‌شود. ادمین موارد صفحه اصلی را انتخاب می‌کند.
- محصولات، کاربران، سفارش‌ها، کوپن‌ها، نظرات، سبد و موجودی در PostgreSQL هستند.
- آپلود تصویر ادمین با فشرده‌سازی سمت سرور در `backend/uploads/`.
- اعتبارسنجی مشترک ایمیل/موبایل: فرانت `app/lib/validation.ts` و بک‌اند `app/schemas`.

## وضعیت پروژه

مناسب برای **دمو، توسعه و تست محلی**. برای لانچ واقعی هنوز پیشنهاد می‌شود:

- درگاه پرداخت آنلاین
- مایگریشن Alembic
- تست خودکار و پیکربندی دیپلوی (Docker / CI)
- بازیابی رمز واقعی (ایمیل/SMS)
- کوکی امن برای HTTPS

## لایسنس

استفادهٔ آموزشی و توسعه‌ای.
