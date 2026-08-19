import Link from "next/link";
import ProductCard from "./components/ProductCard";
import { products, categories } from "./data/products";

export default function Home() {
  const featuredProducts = [
    ...products.filter((product) => product.category === "حروف کالیگرافی"),
    ...products.filter((product) => product.category !== "حروف کالیگرافی"),
  ].slice(0, 8);
  const newProducts = products.filter((p) => p.isNew);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-4 md:mx-auto md:max-w-7xl md:px-4 mt-4 md:mt-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2e1a08] via-[#4e2e0e] to-[#6d4014] min-h-[560px] flex items-center rounded-[28px] md:rounded-[36px]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(-45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px)`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center w-full">
          <div className="text-right">
            <div className="inline-flex items-center gap-2 bg-[#d4a96a]/20 border border-[#d4a96a]/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-[#d4a96a] rounded-full animate-pulse"></span>
              <span className="text-[#d4a96a] text-sm font-medium">کلکسیون ویژه حروف کالیگرافی چوبی</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
              جلوه واقعی
              <br />
              <span className="text-[#d4a96a]">حروف کالیگرافی روی چوب</span>
            </h1>
            <p className="text-[#c2883a] text-lg leading-8 mb-8 max-w-md">
              مجموعه‌ای از تابلوها و حروف کالیگرافی چوبی با الهام از دکور ایرانی، برای خانه، محل کار و هدیه‌های خاص.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products?cat=calligraphy"
                className="bg-[#d4a96a] hover:bg-[#c2883a] text-[#2e1a08] font-bold px-8 py-3.5 rounded-full transition-all hover:shadow-xl hover:shadow-[#d4a96a]/30 text-base"
              >
                مشاهده حروف کالیگرافی
              </Link>
              <Link
                href="/about"
                className="border border-[#d4a96a]/50 hover:border-[#d4a96a] text-[#d4a96a] font-medium px-8 py-3.5 rounded-full transition-all hover:bg-[#d4a96a]/10 text-base"
              >
                درباره ما
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-10">
              {[
                { value: "۸۰+", label: "مدل کالیگرافی" },
                { value: "۳۰۰۰+", label: "سفارش موفق" },
                { value: "۱۰", label: "سال تجربه" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-[#d4a96a]">{stat.value}</div>
                  <div className="text-xs text-[#a96c20] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image grid */}
          <div className="hidden md:grid grid-cols-2 gap-3">
            {[
              "/images/calligraphy/calligraphy-1.jpg",
              "/images/calligraphy/calligraphy-2.jpg",
              "/images/calligraphy/calligraphy-3.jpg",
              "/images/calligraphy/calligraphy-4.jpg",
            ].map((src, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-2xl border-2 border-[#d4a96a]/20 ${i === 0 || i === 3 ? "row-span-1" : ""}`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full aspect-[5/4] object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2e1a08]">دسته‌بندی‌ها</h2>
            <p className="text-[#a96c20] text-sm mt-1">محصولات ما را بر اساس دسته‌بندی مشاهده کنید</p>
          </div>
          <Link href="/products" className="text-sm text-[#a96c20] hover:text-[#6d4014] font-medium border border-[#e8cfa8] hover:border-[#a96c20] px-4 py-2 rounded-full transition-all">
            همه دسته‌ها ←
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?cat=${cat.id}`}
              className="group bg-white rounded-2xl overflow-hidden border border-[#e8cfa8] hover:border-[#a96c20] hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <div className="text-xl mb-1">{cat.icon}</div>
                <div className="text-xs font-bold text-[#4e2e0e] leading-5">{cat.name}</div>
                <div className="text-[10px] text-[#a96c20] mt-0.5">{cat.count} محصول</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner */}
      <section className="mx-4 md:mx-auto max-w-7xl md:px-4 mb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#6d4014] to-[#2e1a08] p-8 md:p-12">
          <div className="absolute top-0 left-0 right-0 bottom-0 opacity-5" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}></div>
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-[#d4a96a] text-sm font-medium mb-2 block">پیشنهاد ویژه هفته</span>
              <h3 className="text-3xl font-black text-white mb-3">تا ۳۰٪ تخفیف<br/>روی حروف کالیگرافی</h3>
              <p className="text-[#c2883a] mb-6 leading-7">مدل‌های دیواری، آینه‌ای و دکوراتیو با عکس‌های واقعی و موجودی محدود.</p>
              <Link
                href="/products?cat=calligraphy&sale=true"
                className="inline-block bg-[#d4a96a] text-[#2e1a08] font-bold px-8 py-3 rounded-full hover:bg-[#c2883a] transition-colors"
              >
                خرید مدل‌های تخفیف‌دار
              </Link>
            </div>
            <div className="hidden md:flex justify-end gap-4">
              <img
                src="/images/calligraphy/calligraphy-5.jpg"
                alt=""
                className="w-40 h-40 object-cover rounded-[18px] border-2 border-[#d4a96a]/30"
              />
              <img
                src="/images/calligraphy/calligraphy-6.jpg"
                alt=""
                className="w-40 h-40 object-cover rounded-[18px] border-2 border-[#d4a96a]/30 mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="py-4 pb-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2e1a08]">محصولات پرفروش</h2>
            <p className="text-[#a96c20] text-sm mt-1">منتخب‌های پرفروش با تمرکز بر حروف کالیگرافی</p>
          </div>
          <Link href="/products" className="text-sm text-[#a96c20] hover:text-[#6d4014] font-medium border border-[#e8cfa8] hover:border-[#a96c20] px-4 py-2 rounded-full transition-all">
            همه محصولات ←
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-4 md:mx-auto md:max-w-7xl md:px-4 py-16 md:py-20">
        <div className="bg-[#2e1a08] rounded-[28px] md:rounded-[36px] px-5 md:px-10 py-12 md:py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">چرا پریسما شاپ؟</h2>
            <p className="text-[#a96c20] max-w-xl mx-auto leading-7">
              تخصص ما خلق و عرضه‌ی آثار کالیگرافی چوبیِ اصیل با کیفیت حرفه‌ای است
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "کیفیت هنری و ماندگار",
                desc: "هر اثر کالیگرافی با متریال مرغوب، برش دقیق و پرداخت نهایی کنترل‌شده آماده می‌شود تا در دکور شما ماندگار بماند.",
                icon: (
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                ),
              },
              {
                title: "مشاوره تخصصی دکور",
                desc: "برای انتخاب سایز، رنگ و سبک تابلوهای کالیگرافی متناسب با فضای خانه یا محل کار، راهنمایی دقیق دریافت می‌کنید.",
                icon: (
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                ),
              },
              {
                title: "ارسال امن و سریع",
                desc: "بسته‌بندی مقاوم برای محصولات ظریف کالیگرافی و ارسال سراسری سریع، تا سفارش شما سالم و به‌موقع به دستتان برسد.",
                icon: (
                  <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/>
                ),
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#3d2210] rounded-[22px] p-8 text-center border border-[#6d4014] hover:bg-[#4e2e0e] hover:border-[#a96c20] transition-colors">
                <div className="w-14 h-14 bg-[#6d4014] rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="text-[#d4a96a]" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {item.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                <p className="text-[#a96c20] leading-7 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New products */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#2e1a08]">جدیدترین محصولات</h2>
            <p className="text-[#a96c20] text-sm mt-1">تازه‌ترین اضافات فروشگاه</p>
          </div>
          <Link href="/products?sort=newest" className="text-sm text-[#a96c20] hover:text-[#6d4014] font-medium border border-[#e8cfa8] hover:border-[#a96c20] px-4 py-2 rounded-full transition-all">
            همه محصولات جدید ←
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {newProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-4 md:mx-auto md:max-w-7xl md:px-4 pb-16">
        <div className="bg-[#f5e9d5] rounded-[28px] md:rounded-[36px] px-5 md:px-10 py-12 md:py-14 border border-[#e8cfa8]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#2e1a08]">نظرات مشتریان</h2>
            <p className="text-[#a96c20] text-sm mt-1">تجربه واقعی خریداران آثار کالیگرافی پریسما شاپ</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "علی رضایی",
                role: "طراح دکور داخلی",
                text: "تابلوی کالیگرافی که گرفتم از نزدیک خیلی بهتر از عکس بود. برش‌ها تمیز و بسته‌بندی هم کاملاً حرفه‌ای انجام شده بود.",
                rating: 5,
                avatar: "ع",
              },
              {
                name: "مریم محمدی",
                role: "مشتری وفادار",
                text: "برای دیوار پذیرایی مدل آینه‌ای سفارش دادم. دقیقاً متناسب با فضا بود و تیم پشتیبانی برای انتخاب سایز خیلی خوب راهنمایی کرد.",
                rating: 5,
                avatar: "م",
              },
              {
                name: "حسن کریمی",
                role: "مدیر دفتر معماری",
                text: "برای دفتر کار چند مدل کالیگرافی گرفتیم. هم کیفیت ساخت عالی بود هم زمان ارسال دقیق. حتماً دوباره سفارش می‌دیم.",
                rating: 5,
                avatar: "ح",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-[22px] p-6 border border-[#e8cfa8] hover:border-[#c2883a] transition-colors shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= t.rating ? "#d4a96a" : "none"} stroke="#d4a96a" strokeWidth={2}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-[#4e2e0e] leading-7 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6d4014] flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#2e1a08]">{t.name}</div>
                    <div className="text-xs text-[#a96c20]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
