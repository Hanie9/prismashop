import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "../components/BackLink";

type PageContent = {
  title: string;
  description: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const pageMap: Record<string, PageContent> = {
  about: {
    title: "درباره پریسما شاپ",
    description:
      "پریسما شاپ با تمرکز بر محصولات چوبی، دکوری و حروف کالیگرافی تلاش می‌کند تجربه‌ای زیبا و مطمئن از خرید آنلاین فراهم کند.",
    primary: { label: "مشاهده محصولات", href: "/products" },
    secondary: { label: "تماس با ما", href: "/contact" },
  },
  contact: {
    title: "تماس با ما",
    description:
      "برای مشاوره خرید، پیگیری سفارش یا همکاری می‌توانید از طریق شماره ۰۲۱-۱۲۳۴۵۶۷۸ و ایمیل info@prismashop.ir با ما در ارتباط باشید.",
    primary: { label: "رفتن به فرم تماس", href: "/contact" },
    secondary: { label: "بازگشت به صفحه اصلی", href: "/" },
  },
  blog: {
    title: "بلاگ آموزشی",
    description:
      "در این بخش آموزش‌های کار با چوب، تکنیک‌های رنگ‌کاری، ایده‌های دکوراسیون و معرفی محصولات جدید منتشر می‌شود.",
    primary: { label: "مشاهده مقالات", href: "/blog" },
    secondary: { label: "بازگشت به صفحه اصلی", href: "/" },
  },
  cart: {
    title: "سبد خرید",
    description:
      "سبد خرید شما آماده است. می‌توانید محصولات دلخواهتان را اضافه کرده و سفارش را نهایی کنید.",
    primary: { label: "رفتن به سبد خرید", href: "/cart" },
    secondary: { label: "ادامه خرید", href: "/products" },
  },
  "track-order": {
    title: "پیگیری سفارش",
    description:
      "برای دیدن وضعیت سفارش‌های ثبت‌شده وارد حساب کاربری شوید. کد پیگیری پس از ثبت سفارش در صفحه تأیید نمایش داده می‌شود.",
    primary: { label: "سفارش‌های من", href: "/account/orders" },
    secondary: { label: "تماس با پشتیبانی", href: "/contact" },
  },
  privacy: {
    title: "حریم خصوصی",
    description:
      "اطلاعات شما نزد پریسما شاپ محرمانه است و تنها برای پردازش سفارش و بهبود تجربه کاربری استفاده می‌شود. در صورت سوال می‌توانید با پشتیبانی تماس بگیرید.",
    primary: { label: "تماس با پشتیبانی", href: "/contact" },
    secondary: { label: "بازگشت به صفحه اصلی", href: "/" },
  },
  faq: {
    title: "سوالات متداول",
    description:
      "پاسخ رایج‌ترین سوالات درباره ثبت سفارش، ارسال، پرداخت و بازگشت کالا را اینجا می‌بینید. اگر پاسخ خود را پیدا نکردید با پشتیبانی در ارتباط باشید.",
    primary: { label: "تماس با پشتیبانی", href: "/contact" },
    secondary: { label: "مشاهده محصولات", href: "/products" },
  },
  returns: {
    title: "بازگشت کالا",
    description:
      "در صورت مشکل در سفارش، تا ۷ روز امکان ثبت درخواست بازگشت کالا مطابق قوانین فروشگاه را دارید. برای پیگیری با پشتیبانی تماس بگیرید یا سفارش‌های خود را بررسی کنید.",
    primary: { label: "سفارش‌های من", href: "/account/orders" },
    secondary: { label: "تماس با پشتیبانی", href: "/contact" },
  },
};

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = pageMap[slug];
  if (!content) notFound();

  return (
    <div className="min-h-[70vh] bg-[#faf6ee]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <BackLink href="/" className="mb-4">
          بازگشت به صفحه اصلی
        </BackLink>
        <div className="bg-white border border-[#e8cfa8] rounded-3xl p-8 md:p-12">
          <h1 className="text-3xl font-black text-[#2e1a08] mb-4">{content.title}</h1>
          <p className="text-[#6d4014] leading-8 mb-8">{content.description}</p>
          <div className="flex flex-wrap gap-3">
            {content.primary && (
              <Link
                href={content.primary.href}
                className="bg-[#6d4014] hover:bg-[#4e2e0e] text-white px-5 py-2.5 rounded-xl transition-colors"
              >
                {content.primary.label}
              </Link>
            )}
            {content.secondary && (
              <Link
                href={content.secondary.href}
                className="border border-[#a96c20] text-[#6d4014] hover:bg-[#fdf8f3] px-5 py-2.5 rounded-xl transition-colors"
              >
                {content.secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
