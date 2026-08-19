import Link from "next/link";
import { notFound } from "next/navigation";

const pageMap: Record<string, { title: string; description: string }> = {
  about: {
    title: "درباره پریسما شاپ",
    description:
      "پریسما شاپ با تمرکز بر محصولات چوبی، دکوری و حروف کالیگرافی تلاش می‌کند تجربه‌ای زیبا و مطمئن از خرید آنلاین فراهم کند.",
  },
  contact: {
    title: "تماس با ما",
    description:
      "برای مشاوره خرید، پیگیری سفارش یا همکاری می‌توانید از طریق شماره ۰۲۱-۱۲۳۴۵۶۷۸ و ایمیل info@prismashop.ir با ما در ارتباط باشید.",
  },
  blog: {
    title: "بلاگ آموزشی",
    description:
      "در این بخش آموزش‌های کار با چوب، تکنیک‌های رنگ‌کاری، ایده‌های دکوراسیون و معرفی محصولات جدید منتشر می‌شود.",
  },
  cart: {
    title: "سبد خرید",
    description:
      "سبد خرید شما آماده است. می‌توانید محصولات دلخواهتان را اضافه کرده و سفارش را نهایی کنید.",
  },
  "track-order": {
    title: "پیگیری سفارش",
    description:
      "کد سفارش خود را وارد کنید تا وضعیت بسته، زمان تحویل و مراحل ارسال را مشاهده کنید.",
  },
  terms: {
    title: "قوانین و مقررات",
    description:
      "با ثبت سفارش در پریسما شاپ، شما شرایط استفاده، قوانین بازگشت کالا و اصول خرید امن را می‌پذیرید.",
  },
  privacy: {
    title: "حریم خصوصی",
    description:
      "اطلاعات شما نزد پریسما شاپ محرمانه است و تنها برای پردازش سفارش و بهبود تجربه کاربری استفاده می‌شود.",
  },
  faq: {
    title: "سوالات متداول",
    description:
      "پاسخ رایج‌ترین سوالات درباره ثبت سفارش، ارسال، پرداخت، بازگشت کالا و پشتیبانی را اینجا ببینید.",
  },
  returns: {
    title: "بازگشت کالا",
    description:
      "در صورت مشکل در سفارش، تا ۷ روز امکان ثبت درخواست بازگشت کالا مطابق قوانین فروشگاه را دارید.",
  },
};

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = pageMap[slug];
  if (!content) notFound();

  return (
    <div className="min-h-[70vh] bg-[#faf6ee]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-white border border-[#e8cfa8] rounded-3xl p-8 md:p-12">
          <h1 className="text-3xl font-black text-[#2e1a08] mb-4">{content.title}</h1>
          <p className="text-[#6d4014] leading-8 mb-8">{content.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="bg-[#6d4014] hover:bg-[#4e2e0e] text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              مشاهده محصولات
            </Link>
            <Link
              href="/products?cat=calligraphy"
              className="border border-[#a96c20] text-[#6d4014] hover:bg-[#fdf8f3] px-5 py-2.5 rounded-xl transition-colors"
            >
              حروف کالیگرافی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
