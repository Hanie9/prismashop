"use client";

import { use, useState } from "react";
import Link from "next/link";
import { products } from "../../data/products";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../components/CartProvider";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem, getItemQty } = useCart();
  const product = products.find((p) => p.id === Number(id)) ?? products[0];
  const qtyInCart = getItemQty(product.id);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [added, setAdded] = useState(false);

  const images = [product.image, ...products.slice(0, 3).map((p) => p.image)];
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e8cfa8]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#a96c20]">
            <Link href="/" className="hover:text-[#6d4014]">خانه</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#6d4014]">محصولات</Link>
            <span>/</span>
            <span className="text-[#4e2e0e] font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10 bg-white rounded-3xl border border-[#e8cfa8] p-6 md:p-10">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#f5e9d5] mb-4 border border-[#e8cfa8]">
              <img
                src={images[selectedImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImg === i ? "border-[#a96c20]" : "border-[#e8cfa8] hover:border-[#c2883a]"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-xs text-[#a96c20] mb-2 font-medium">{product.category}</div>
            <h1 className="text-2xl font-black text-[#2e1a08] leading-9 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= product.rating ? "#d4a96a" : "none"} stroke="#d4a96a" strokeWidth={2}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm text-[#a96c20]">({product.reviewCount} نظر)</span>
              <span className="text-green-600 text-sm font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">موجود</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 bg-[#fdf8f3] rounded-2xl p-4 mb-6 border border-[#e8cfa8]">
              <div>
                <div className="text-2xl font-black text-[#4e2e0e]">
                  {product.price.toLocaleString("fa-IR")} تومان
                </div>
                {product.originalPrice && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400 line-through">
                      {product.originalPrice.toLocaleString("fa-IR")} تومان
                    </span>
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {discountPct}٪ تخفیف
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Short desc */}
            <p className="text-sm text-[#6d4014] leading-7 mb-6 border-b border-[#f5e9d5] pb-6">
              این محصول از بهترین چوب‌های طبیعی ایرانی ساخته شده و برای استفاده در هنر دکوپاژ، نجاری خانگی و دکوراسیون داخلی مناسب است. سطح صاف و فاقد لاک برای رنگ‌کاری و تزئین آماده‌سازی شده است.
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-sm font-medium text-[#4e2e0e]">تعداد:</span>
              <div className="flex items-center border border-[#e8cfa8] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#6d4014] hover:bg-[#f5e9d5] transition-colors font-bold text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#2e1a08]">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 flex items-center justify-center text-[#6d4014] hover:bg-[#f5e9d5] transition-colors font-bold text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                className="flex-1 bg-[#6d4014] hover:bg-[#4e2e0e] text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
                onClick={() => {
                  addItem(product.id, qty);
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 1400);
                }}
              >
                {added
                  ? "به سبد اضافه شد"
                  : qtyInCart > 0
                    ? `افزایش تعداد در سبد (${qtyInCart.toLocaleString("fa-IR")})`
                    : "افزودن به سبد خرید"}
              </button>
              <button className="w-13 h-13 border-2 border-[#e8cfa8] hover:border-[#c2883a] rounded-2xl flex items-center justify-center text-[#a96c20] hover:text-[#6d4014] transition-all p-3.5">
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* Meta */}
            <div className="space-y-2 text-sm text-[#a96c20]">
              <div className="flex gap-2"><span className="font-medium text-[#4e2e0e]">کد محصول:</span> WD-{product.id.toString().padStart(4, "0")}</div>
              <div className="flex gap-2"><span className="font-medium text-[#4e2e0e]">دسته‌بندی:</span> {product.category}</div>
              <div className="flex gap-2"><span className="font-medium text-[#4e2e0e]">ارسال:</span> ۲ تا ۵ روز کاری</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-white rounded-3xl border border-[#e8cfa8] overflow-hidden">
          <div className="flex border-b border-[#e8cfa8]">
            {[
              { id: "desc", label: "توضیحات محصول" },
              { id: "specs", label: "مشخصات فنی" },
              { id: "reviews", label: `نظرات (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-[#6d4014] text-[#6d4014] bg-[#fdf8f3]"
                    : "border-transparent text-[#a96c20] hover:text-[#6d4014]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === "desc" && (
              <div className="text-sm text-[#4e2e0e] leading-8 max-w-3xl">
                <p className="mb-4">
                  این محصول از چوب درجه یک ایرانی با دقت و مهارت بالا ساخته شده است. سطح محصول کاملاً صاف و آماده رنگ‌آمیزی یا دکوپاژ است.
                </p>
                <p className="mb-4">
                  برای حفظ کیفیت، از لحظه تولید تا تحویل به مشتری، تمام مراحل زیر نظر کارشناسان متخصص ما انجام می‌شود. این محصول بهترین گزینه برای:
                </p>
                <ul className="list-none space-y-2 mr-4">
                  {["هنر دکوپاژ و دکوپاژ روی چوب", "نجاری خانگی و پروژه‌های DIY", "دکوراسیون داخلی منزل و محل کار", "کلاس‌های هنری و کارگاه‌های آموزشی"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#d4a96a] rounded-full shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === "specs" && (
              <div className="max-w-2xl">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["جنس", "چوب طبیعی (MDF درجه یک)"],
                      ["ابعاد", "۲۰ × ۱۵ × ۵ سانتی‌متر"],
                      ["وزن", "۳۵۰ گرم"],
                      ["رنگ", "رنگ طبیعی چوب"],
                      ["سطح", "سمباده‌زده و آماده رنگ‌کاری"],
                      ["کشور تولیدکننده", "ایران"],
                      ["ضمانت", "۷ روز ضمانت بازگشت"],
                    ].map(([key, val], i) => (
                      <tr key={key} className={i % 2 === 0 ? "bg-[#fdf8f3]" : "bg-white"}>
                        <td className="py-3 px-4 font-medium text-[#4e2e0e] w-40 border border-[#f5e9d5]">{key}</td>
                        <td className="py-3 px-4 text-[#6d4014] border border-[#f5e9d5]">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-2xl">
                {[
                  { name: "سارا احمدی", rating: 5, date: "۱۵ مرداد ۱۴۰۳", text: "خیلی خوب بود! کیفیت چوب عالیه و دقیقاً همون چیزیه که تو عکس دیدم. ارسال هم سریع بود." },
                  { name: "رضا کریمی", rating: 4, date: "۸ تیر ۱۴۰۳", text: "محصول خوبیه، فقط بسته‌بندی یکم می‌تونست بهتر باشه. کلاً راضی هستم و دوباره سفارش می‌دم." },
                ].map((review, i) => (
                  <div key={i} className="border-b border-[#f5e9d5] pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6d4014] flex items-center justify-center text-white text-sm font-bold">
                          {review.name[0]}
                        </div>
                        <span className="font-medium text-[#2e1a08] text-sm">{review.name}</span>
                      </div>
                      <span className="text-xs text-[#a96c20]">{review.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2 mr-11">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= review.rating ? "#d4a96a" : "none"} stroke="#d4a96a" strokeWidth={2}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-[#4e2e0e] leading-7 mr-11">{review.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#2e1a08] mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
