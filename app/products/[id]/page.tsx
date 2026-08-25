"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import BackLink from "../../components/BackLink";
import ProductCard from "../../components/ProductCard";
import ProductReviewsPanel from "../../components/ProductReviewsPanel";
import { useCart } from "../../components/CartProvider";
import { useShop } from "../../components/ShopProvider";
import { useWishlist } from "../../components/WishlistProvider";
import { getProductImages } from "../../lib/product-images";
import { filledSpecs } from "../../lib/product-content";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem, getItemQty, getAvailableStock } = useCart();
  const { getProduct, getActiveProducts, isLowStock } = useShop();
  const { isWishlisted, toggleItem } = useWishlist();
  const products = getActiveProducts();
  const product = getProduct(Number(id));
  const qtyInCart = getItemQty(product?.id ?? 0);
  const wishlisted = isWishlisted(product?.id ?? 0);
  const stock = product ? getAvailableStock(product.id) : 0;
  const related = products
    .filter((p) => product && p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");
  const [added, setAdded] = useState(false);
  const [stockMsg, setStockMsg] = useState("");
  const [reviewCount, setReviewCount] = useState(product?.reviewCount ?? 0);

  useEffect(() => {
    setSelectedImg(0);
    setQty(1);
    setReviewCount(product?.reviewCount ?? 0);
  }, [id, product?.reviewCount]);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-[#faf6ee] px-4 text-center">
        <h1 className="text-xl font-black text-[#2e1a08]">محصول یافت نشد</h1>
        <p className="max-w-sm text-sm text-[#6d4014]">
          این محصول وجود ندارد یا دیگر در فروشگاه فعال نیست.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-[#8a5419] px-6 py-3 text-sm font-bold text-white"
          >
            مشاهده همه محصولات
          </Link>
          <BackLink href="/">بازگشت به صفحه اصلی</BackLink>
        </div>
      </div>
    );
  }

  const images = getProductImages(product);
  const safeIndex = Math.min(selectedImg, Math.max(0, images.length - 1));
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const outOfStock = stock <= 0;
  const remaining = Math.max(0, stock - qtyInCart);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e8cfa8]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a96c20] overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-[#6d4014] shrink-0">خانه</Link>
            <span className="shrink-0">/</span>
            <Link href="/products" className="hover:text-[#6d4014] shrink-0">محصولات</Link>
            <span className="shrink-0">/</span>
            <Link
              href={`/products?cat=${product.categoryId}`}
              className="hover:text-[#6d4014] shrink-0"
            >
              {product.category}
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-[#4e2e0e] font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-6 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 bg-white rounded-3xl border border-[#e8cfa8] p-4 sm:p-6 lg:p-8 xl:p-10">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-[#f5e9d5] mb-4 border border-[#e8cfa8]">
              <img
                src={images[safeIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={`${i}-${img.slice(0, 32)}`}
                    type="button"
                    onClick={() => setSelectedImg(i)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      safeIndex === i ? "border-[#a96c20]" : "border-[#e8cfa8] hover:border-[#c2883a]"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <Link
              href={`/products?cat=${product.categoryId}`}
              className="mb-2 inline-block text-xs font-medium text-[#a96c20] hover:text-[#8a5419] hover:underline"
            >
              {product.category}
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-[#2e1a08] leading-9 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(product.rating) ? "#d4a96a" : "none"} stroke="#d4a96a" strokeWidth={2}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              {reviewCount === 0 && (
                <span className="text-sm text-[#a96c20]">هنوز نظری ثبت نشده</span>
              )}
              {outOfStock ? (
                <span className="text-red-600 text-sm font-medium border border-red-200 bg-red-50 px-2 py-0.5 rounded-full">
                  ناموجود
                </span>
              ) : isLowStock(product) ? (
                <span className="rounded-full bg-[#f97316] px-2.5 py-0.5 text-sm font-bold text-white">
                  {stock === 1
                    ? "یک عدد مانده است"
                    : `${stock.toLocaleString("fa-IR")} عدد مانده است`}
                </span>
              ) : (
                <span className="text-green-600 text-sm font-medium border border-green-200 bg-green-50 px-2 py-0.5 rounded-full">
                  موجود
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 bg-[#fdf8f3] rounded-2xl p-4 mb-6 border border-[#e8cfa8]">
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#4e2e0e]">
                  {product.price.toLocaleString("fa-IR")}
                  <span className="ms-[1mm] inline-block text-base font-bold sm:text-lg">تومان</span>
                </div>
                {product.originalPrice && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400 line-through">
                      {product.originalPrice.toLocaleString("fa-IR")}
                      <span className="ms-[1mm] inline-block">تومان</span>
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
              {product.description ||
                "این محصول از بهترین چوب‌های طبیعی ایرانی ساخته شده و برای استفاده در هنر دکوپاژ، نجاری خانگی و دکوراسیون داخلی مناسب است."}
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-sm font-medium text-[#4e2e0e]">تعداد:</span>
              <div className="flex items-center border border-[#e8cfa8] rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#6d4014] hover:bg-[#f5e9d5] transition-colors font-bold text-lg"
                  disabled={outOfStock}
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-bold text-[#2e1a08]">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(Math.max(1, remaining), qty + 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#6d4014] hover:bg-[#f5e9d5] transition-colors font-bold text-lg disabled:opacity-40"
                  disabled={outOfStock || qty >= remaining}
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-6">
              <button
                className="flex-1 min-w-0 bg-[#6d4014] hover:bg-[#4e2e0e] text-white font-bold py-3.5 rounded-2xl transition-colors text-sm sm:text-base px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={outOfStock || remaining <= 0}
                onClick={() => {
                  const result = addItem(product.id, qty);
                  if (!result.ok) {
                    setStockMsg(
                      result.reason === "out_of_stock"
                        ? "این محصول ناموجود است"
                        : `بیش از ${stock.toLocaleString("fa-IR")} عدد نمی‌توانید خرید کنید`,
                    );
                    window.setTimeout(() => setStockMsg(""), 2200);
                    return;
                  }
                  setAdded(true);
                  setQty(1);
                  window.setTimeout(() => setAdded(false), 1400);
                }}
              >
                {outOfStock
                  ? "ناموجود"
                  : added
                    ? "به سبد اضافه شد"
                    : remaining <= 0
                      ? "حداکثر موجودی در سبد است"
                      : qtyInCart > 0
                        ? `افزایش در سبد (${qtyInCart.toLocaleString("fa-IR")})`
                        : "افزودن به سبد خرید"}
              </button>
              <button
                type="button"
                aria-label={wishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
                onClick={() => toggleItem(product.id)}
                className={`w-14 h-14 shrink-0 border-2 rounded-2xl flex items-center justify-center transition-all ${
                  wishlisted
                    ? "border-[#c2883a] bg-[#fff6ea] text-[#a96c20]"
                    : "border-[#e8cfa8] text-[#a96c20] hover:border-[#c2883a] hover:text-[#6d4014]"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {stockMsg && (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{stockMsg}</p>
            )}

            {/* Meta */}
            <div className="space-y-2 text-sm text-[#a96c20]">
              <div className="flex flex-wrap gap-2"><span className="font-medium text-[#4e2e0e]">کد محصول:</span> WD-{product.id.toString().padStart(4, "0")}</div>
              <div className="flex flex-wrap gap-2">
                <span className="font-medium text-[#4e2e0e]">دسته‌بندی:</span>{" "}
                <Link
                  href={`/products?cat=${product.categoryId}`}
                  className="text-[#8a5419] hover:underline"
                >
                  {product.category}
                </Link>
              </div>
              <div className="flex flex-wrap gap-2"><span className="font-medium text-[#4e2e0e]">ارسال:</span> ۲ تا ۵ روز کاری</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-white rounded-3xl border border-[#e8cfa8] overflow-hidden">
          <div className="flex border-b border-[#e8cfa8] overflow-x-auto">
            {[
              { id: "desc", label: "توضیحات" },
              { id: "specs", label: "مشخصات" },
              { id: "reviews", label: `نظرات (${reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? "border-[#6d4014] text-[#6d4014] bg-[#fdf8f3]"
                    : "border-transparent text-[#a96c20] hover:text-[#6d4014]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-8">
            {activeTab === "desc" && (
              <div className="text-sm text-[#4e2e0e] leading-8 max-w-3xl">
                {(product.detailParagraphs?.length
                  ? product.detailParagraphs
                  : [
                      product.description ||
                        "این محصول از چوب درجه یک ایرانی با دقت و مهارت بالا ساخته شده است. سطح محصول کاملاً صاف و آماده رنگ‌آمیزی یا دکوپاژ است.",
                    ]
                ).map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="mb-4">
                    {paragraph}
                  </p>
                ))}
                {(product.highlights?.length
                  ? product.highlights
                  : [
                      "هنر دکوپاژ و دکوپاژ روی چوب",
                      "نجاری خانگی و پروژه‌های DIY",
                      "دکوراسیون داخلی منزل و محل کار",
                      "کلاس‌های هنری و کارگاه‌های آموزشی",
                    ]
                ).length > 0 && (
                  <ul className="list-none space-y-2 mr-4">
                    {(product.highlights?.length
                      ? product.highlights
                      : [
                          "هنر دکوپاژ و دکوپاژ روی چوب",
                          "نجاری خانگی و پروژه‌های DIY",
                          "دکوراسیون داخلی منزل و محل کار",
                          "کلاس‌های هنری و کارگاه‌های آموزشی",
                        ]
                    ).map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#d4a96a] rounded-full shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {activeTab === "specs" && (
              <div className="max-w-2xl overflow-x-auto">
                {filledSpecs(product.specs).length === 0 ? (
                  <p className="text-sm text-[#a96c20]">هنوز مشخصاتی برای این محصول ثبت نشده است.</p>
                ) : (
                  <table className="w-full text-sm min-w-[280px]">
                    <tbody>
                      {filledSpecs(product.specs).map((spec, i) => (
                        <tr key={`${spec.label}-${i}`} className={i % 2 === 0 ? "bg-[#fdf8f3]" : "bg-white"}>
                          <td className="py-3 px-3 sm:px-4 font-medium text-[#4e2e0e] w-1/3 sm:w-40 border border-[#f5e9d5]">
                            {spec.label}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-[#6d4014] border border-[#f5e9d5]">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeTab === "reviews" && (
              <ProductReviewsPanel
                productId={product.id}
                onReviewCountChange={setReviewCount}
              />
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#2e1a08] mb-6">محصولات مرتبط</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
