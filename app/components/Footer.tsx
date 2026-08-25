"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const footerLinks = {
  quick: [
    { name: "صفحه اصلی", href: "/" },
    { name: "همه محصولات", href: "/products" },
    { name: "حروف کالیگرافی", href: "/products?cat=calligraphy" },
    { name: "علاقه‌مندی‌ها", href: "/wishlist" },
    { name: "بلاگ", href: "/blog" },
  ],
  support: [
    { name: "درباره ما", href: "/about" },
    { name: "تماس با ما", href: "/contact" },
    { name: "پیگیری سفارش", href: "/track-order" },
    { name: "حریم خصوصی", href: "/privacy" },
  ],
};

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <footer className="mt-14 bg-[#1f1207] text-[#f3e2c8]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-7">
        <div className="rounded-[26px] border border-[#4a2b10] bg-gradient-to-l from-[#261608] to-[#35200d] px-5 md:px-8 py-6 md:py-7 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8a5419] to-[#4e2e0e] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none"/>
                    <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7"/>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-black text-white">پریسما شاپ</div>
                  <div className="text-xs text-[#cfa56c]">فروشگاه دکور و کالیگرافی</div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#e3c091]">
                آثار چوبی مدرن و حروف کالیگرافی با طراحی خاص برای خانه و محل کار.
              </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#3b220d] px-3 py-1 text-[11px] text-[#d9b17d]">ارسال سراسری</span>
                <span className="rounded-full bg-[#3b220d] px-3 py-1 text-[11px] text-[#d9b17d]">ضمانت اصالت</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">دسترسی سریع</h3>
              <div className="grid grid-cols-2 gap-2">
                {footerLinks.quick.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[#5d3814] px-3 py-2 text-xs text-center text-[#ddb98a] hover:text-white hover:border-[#c2883a] hover:bg-[#3b220d]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">ارتباط با ما</h3>
              <div className="space-y-2 text-sm text-[#ddb98a]">
                <div>۰۲۱-۱۲۳۴۵۶۷۸</div>
                <div>info@prismashop.ir</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#b98a53] text-center md:text-right">
          <span>© ۱۴۰۵ پریسما شاپ. تمامی حقوق محفوظ است.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {footerLinks.support.slice(2).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#f0d3ac]">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
