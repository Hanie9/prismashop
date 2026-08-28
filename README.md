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
- علاقه‌مندی‌ها برای مهمان و مشتری در دیتابیس (بر اساس سشن / حساب کاربری)
- حساب کاربری: سفارش‌های من
- نظرات منتخب ادمین در بخش «نظرات مشتریان» صفحه اصلی
- صفحات درباره ما، تماس، بلاگ

### احراز هویت
- ثبت‌نام و ورود مشتری و ادمین فقط با کد تأیید پیامکی (OTP) روی شماره موبایل
- گزینه «مرا به خاطر بسپار» فقط شماره موبایل را ذخیره می‌کند (سشن همیشه پس از ورود فعال می‌ماند)
- اعتبارسنجی **regex** برای شماره موبایل ایرانی (`09xxxxxxxxx`)
- خروج با دیالوگ تأیید

### پنل ادمین (`/admin`)
- داشبورد، محصولات (آپلود تصویر + قالب محتوا)، دسته‌بندی‌ها
- سفارش‌ها و تغییر وضعیت
- مشتریان
- نظرات: مدیریت نظرات محصولات و انتخاب موارد نمایش در صفحه اصلی
- کدهای تخفیف
- موجودی انبار با ذخیرهٔ جداگانه برای هر محصول و هشدار کم‌موجودی
- بلاگ و پیام‌های فرم تماس
- **مدیران:** افزودن و مدیریت ادمین‌ها با شماره موبایل
- تنظیمات سایت: هویت برند، اطلاعات تماس، آمار، مزیت‌ها، تصاویر هدر، بنر تخفیف و صفحات محتوایی

> کاتالوگ seed نمی‌شود؛ روی دیتابیس تازه، فروشگاه خالی بالا می‌آید و محصولات و دسته‌بندی‌ها را از پنل ادمین می‌سازید.

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
python -m app.seed.run             # ساخت حساب ادمین
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
  blog/ about/ contact/ صفحات محتوایی
  components/           کامپوننت‌ها و Providerها
  lib/                  api.ts، validation، انواع داده
backend/                FastAPI
  app/api/routes/       endpointها (products, cart, reviews, media, site, …)
  app/models/           مدل‌های SQLAlchemy
  app/schemas/          اعتبارسنجی Pydantic (+ regex)
  app/services/         منطق دامنه (سفارش، قیمت، تصویر، رسانه)
  app/seed/             ساخت ادمین + محتوای پیش‌فرض صفحات + انتقال تصاویر
```

## مسیرهای اصلی

| مسیر | توضیح |
|------|--------|
| `/` | صفحه اصلی |
| `/products` · `/products/[id]` | لیست و جزئیات محصول |
| `/cart` · `/checkout` | سبد و پرداخت |
| `/auth/login` · `/auth/signup` | ورود و ثبت‌نام |
| `/wishlist` · `/account/orders` | علاقه‌مندی و سفارش‌ها |
| `/blog` · `/blog/[slug]` | بلاگ |
| `/about` · `/contact` · `/privacy` | صفحات محتوایی |
| `/admin` | پنل ادمین |
| `/admin/reviews` | مدیریت نظرات و نمایش در صفحه اصلی |
| `/admin/admins` | مدیریت ادمین‌ها |
| `/admin/settings` | تنظیمات سایت و صفحات محتوایی |

## نکات فنی

- **سبد خرید:** هر مشتری سبد جدا در جدول `cart_items` دارد؛ مهمان در `localStorage` (`prismashop-cart:guest`). با ورود، سبد مهمان با سبد کاربر ادغام می‌شود.
- **نظرات:** هر مشتری برای هر محصول یک نظر؛ میانگین امتیاز محصول از همین نظرات به‌روز می‌شود. ادمین موارد صفحه اصلی را انتخاب می‌کند.
- **همه محتوا از دیتابیس می‌آید:** محصولات، دسته‌بندی‌ها، بلاگ، نظرات، کوپن‌ها، سفارش‌ها، سبد، موجودی، تنظیمات سایت و صفحات محتوایی. هیچ محصول یا دسته‌بندی نمونه‌ای در کد نیست.
- **تصاویر:** آپلود ادمین سمت سرور فشرده و به WebP تبدیل می‌شود و بایت‌ها در جدول `media_assets` ذخیره می‌شوند. سرو از `/api/media/<id>` با کش دائمی. تصاویری که دیگر ارجاعی به آن‌ها نیست، هنگام راه‌اندازی بک‌اند پاک می‌شوند.
- برای انتقال تصاویر قدیمی (فایل روی دیسک، آدرس بیرونی یا base64) به دیتابیس: `python -m app.seed.migrate_media`
- اعتبارسنجی مشترک ایمیل/موبایل: فرانت `app/lib/validation.ts` و بک‌اند `app/schemas`.

## استقرار روی سرور (Docker + Nginx + CI)

سایت پروداکشن روی `prismashop.ir` با Docker Compose روی سرور `big-in` بالا می‌آید. Nginx موجود روی سرور (`nginx-sc`) فقط reverse proxy است.

| سرویس | کانتینر | پورت داخلی |
|--------|---------|-------------|
| PostgreSQL | `prismashop_postgres` | 5432 |
| FastAPI | `prismashop_backend` | 8000 |
| Next.js | `prismashop_frontend` | 3000 |

Nginx مسیرها را این‌طور تقسیم می‌کند: `/api` و `/uploads` و `/health` → بک‌اند، بقیه → فرانت. (تصاویر از `/api/media` سرو می‌شوند؛ `/uploads` فقط برای سازگاری با نصب‌های قدیمی مانده است.)

### دیپلوی دستی

```bash
bash deploy/deploy.sh
```

اسکریپت کد را با `rsync` به `big-in:~/prismashop` می‌فرستد، ایمیج‌ها را روی سرور بیلد می‌کند، و vhost دامنه را به Nginx اضافه می‌کند. فایل `.env` سرور ساخته می‌شود و دیگر overwrite نمی‌شود.

### GitHub Actions

پوش به `main` ورکفلو `.github/workflows/deploy.yml` را اجرا می‌کند. این secretها را در ریپو تنظیم کنید:

| Secret | مقدار |
|--------|--------|
| `HOST` | `185.8.175.179` |
| `PORT` | `13828` |
| `USERNAME` | `amir` |
| `SSH_KEY` | کلید خصوصی SSH با دسترسی به `big-in` |

### DNS و TLS

رکورد A دامنه `prismashop.ir` (و `www`) باید به `185.8.175.179` اشاره کند. تا آن زمان سایت روی HTTP از خود سرور تست می‌شود. بعد از اصلاح DNS، همان اسکریپت دیپلوی گواهی Let's Encrypt را صادر می‌کند.

ورود ادمین با شماره موبایل تنظیم‌شده در `ADMIN_MOBILE` و کد تأیید انجام می‌شود. ادمین‌های بیشتر از پنل `/admin/admins` اضافه می‌شوند.

## SMS (OTP)

کد تأیید از طریق **SMS.ir** ارسال می‌شود. در `backend/.env` متغیرهای `SMS_IR_API_KEY` و `SMS_IR_TEMPLATE_ID` را تنظیم کنید. اگر کلید خالی باشد، کد در لاگ سرور و فیلد `devCode` پاسخ API چاپ می‌شود (توسعه محلی).

## وضعیت پروژه

مناسب برای **دمو، توسعه و استقرار**. برای لانچ فروش واقعی هنوز پیشنهاد می‌شود:

- درگاه پرداخت آنلاین
- مایگریشن Alembic (فعلاً ستون‌های جدید به‌صورت خودکار در `app/core/schema.py` اضافه می‌شوند)
- تست خودکار

## لایسنس

استفادهٔ آموزشی و توسعه‌ای.
