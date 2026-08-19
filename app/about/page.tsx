import Image from "next/image";
import Link from "next/link";

const values = [
  {
    title: "کیفیت هنری و ماندگار",
    desc: "هر اثر با متریال مرغوب، برش دقیق و پرداخت نهایی کنترل‌شده آماده می‌شود.",
    icon: (
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
  },
  {
    title: "طراحی مدرن و اصیل",
    desc: "ترکیب هنر سنتی کالیگرافی با سلیقه امروزی برای دکور خانه و محل کار.",
    icon: (
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    title: "پشتیبانی همراه",
    desc: "از انتخاب محصول تا تحویل سفارش، تیم ما کنار شماست.",
    icon: (
      <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
    ),
  },
];

const stats = [
  { value: "۸۰+", label: "مدل کالیگرافی" },
  { value: "۳۰۰۰+", label: "سفارش موفق" },
  { value: "۱۰", label: "سال تجربه" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee]">
      {/* Hero */}
      <section className="mx-4 md:mx-auto md:max-w-7xl md:px-4 mt-4 md:mt-6">
        <div className="relative overflow-hidden rounded-[28px] md:rounded-[36px] bg-gradient-to-br from-[#2e1a08] via-[#4e2e0e] to-[#6d4014] px-6 py-14 md:px-12 md:py-20">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px),
                  repeating-linear-gradient(-45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px)`,
              }}
            />
          </div>

          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4a96a]/30 bg-[#d4a96a]/15 px-4 py-1.5 text-sm font-medium text-[#f1d5ad]">
                <span className="h-2 w-2 rounded-full bg-[#d4a96a] animate-pulse" />
                داستان پریسما شاپ
              </span>
              <h1 className="mb-4 text-3xl md:text-5xl font-black leading-tight text-white">
                درباره
                <span className="text-[#d4a96a]"> پریسما شاپ</span>
              </h1>
              <p className="max-w-xl text-sm md:text-base leading-8 text-[#e8cfa8]">
                پریسما شاپ با تمرکز بر محصولات چوبی، دکوراسیون و حروف کالیگرافی شکل گرفت تا خرید آنلاین آثار هنری
                را ساده، امن و لذت‌بخش کند.
              </p>

              <div className="mt-8 flex flex-wrap gap-6 md:gap-10">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-black text-[#d4a96a]">{stat.value}</div>
                    <div className="mt-0.5 text-xs text-[#c2883a]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden md:block h-[320px] overflow-hidden rounded-[28px] border-2 border-[#d4a96a]/25">
              <Image
                src="/images/calligraphy/calligraphy-5.jpg"
                alt="حروف کالیگرافی پریسما شاپ"
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 0px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2e1a08]/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-[28px] border border-[#e8cfa8] bg-white shadow-[0_16px_40px_rgba(89,48,10,0.08)]">
            {/* <div className="relative h-64 md:h-80">
              <Image
                src="/images/calligraphy/calligraphy-7.jpg"
                alt="کارگاه و محصولات چوبی"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div> */}
            <div className="p-6 md:p-8">
              <h2 className="mb-4 text-2xl font-black text-[#2e1a08]">داستان ما</h2>
              <p className="mb-4 text-sm leading-8 text-[#6d4014] md:text-base">
                ما فعالیت خود را از یک کارگاه کوچک چوب آغاز کردیم و امروز با تیم متخصص در تولید، فروش آنلاین و
                پشتیبانی، هزاران سفارش موفق در سراسر ایران ثبت کرده‌ایم.
              </p>
              <p className="text-sm leading-8 text-[#6d4014] md:text-base">
                هدف ما فقط فروش نیست؛ می‌خواهیم با ابزار و محصولات درست، ایده‌های هنری و دکوراتیو شما را بهتر
                اجرا کنید.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[#e8cfa8] bg-white p-6 transition-colors hover:border-[#d4a96a] hover:shadow-[0_12px_30px_rgba(89,48,10,0.08)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ea] text-[#a96c20]">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mb-2 font-bold text-[#4e2e0e]">{item.title}</h3>
                <p className="text-sm leading-7 text-[#6d4014]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission strip */}
      <section className="mx-4 md:mx-auto md:max-w-7xl md:px-4 pb-8">
        <div className="rounded-[28px] border border-[#e8cfa8] bg-[#f5e9d5] px-6 py-10 md:px-10 md:py-12 text-center">
          <h2 className="mb-3 text-2xl font-black text-[#2e1a08]">ماموریت ما</h2>
          <p className="mx-auto max-w-2xl text-sm leading-8 text-[#6d4014] md:text-base">
            ارائه آثار چوبی و کالیگرافی با کیفیت بالا، طراحی اصیل و تجربه خرید آنلاین روان برای هر فضایی که
            می‌خواهید خاص‌تر دیده شود.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-[28px] border border-[#e8cfa8] bg-white p-8 md:p-10 shadow-[0_16px_40px_rgba(89,48,10,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,169,106,0.12),transparent_50%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="mb-2 text-xl md:text-2xl font-black text-[#2e1a08]">برای شروع آماده‌اید؟</h3>
              <p className="text-sm text-[#6d4014]">محصولات چوبی و حروف کالیگرافی ما را ببینید.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/products"
                className="rounded-full bg-[#8a5419] px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(138,84,25,0.25)] transition-all hover:bg-[#6d4014]"
              >
                مشاهده محصولات
              </Link>
              <Link
                href="/products?cat=calligraphy"
                className="rounded-full border border-[#e8cfa8] bg-[#fffaf5] px-8 py-3.5 text-center text-sm font-medium text-[#6d4014] transition-all hover:border-[#d4a96a] hover:text-[#8a5419]"
              >
                حروف کالیگرافی
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
