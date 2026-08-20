"use client";

import Link from "next/link";
import { useMemo } from "react";
import ProductCard from "../components/ProductCard";
import { useShop } from "../components/ShopProvider";
import { useWishlist } from "../components/WishlistProvider";
import type { Product } from "../lib/shop-types";

export default function WishlistPage() {
  const { ids, clearWishlist, totalItems } = useWishlist();
  const { getActiveProducts } = useShop();
  const products = getActiveProducts();

  const rows = useMemo(
    () =>
      ids
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is Product => Boolean(product)),
    [ids, products],
  );

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08]">علاقه‌مندی‌ها</h1>
            <p className="text-sm text-[#a96c20] mt-1">
              {totalItems > 0
                ? `${totalItems.toLocaleString("fa-IR")} محصول در لیست علاقه‌مندی‌های شما`
                : "محصولات مورد علاقه خود را اینجا ذخیره کنید"}
            </p>
          </div>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className="self-start rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              خالی کردن لیست
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[#e8cfa8] bg-white shadow-[0_20px_50px_rgba(89,48,10,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,169,106,0.14),transparent_45%)]" />
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#fff6ea] blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-[#f5e9d5] blur-3xl" />

            <div className="relative px-5 py-12 sm:px-6 sm:py-14 md:px-12 md:py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#fff6ea] to-[#f5e9d5] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_rgba(89,48,10,0.1)]">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8a5419" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>

              <span className="mb-4 inline-flex rounded-full border border-[#ead7bb] bg-[#fffaf5] px-4 py-1.5 text-xs font-medium text-[#a96c20]">
                هنوز چیزی ذخیره نکرده‌اید
              </span>

              <h2 className="mb-3 text-xl sm:text-2xl md:text-3xl font-black text-[#2e1a08]">لیست علاقه‌مندی‌ها خالی است</h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[#6d4014] md:text-base">
                با زدن آیکون قلب روی محصولات، آن‌ها را اینجا ذخیره کنید تا بعداً راحت‌تر پیدا و خرید کنید.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="w-full sm:w-auto rounded-full bg-[#8a5419] px-8 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(138,84,25,0.25)] transition-all hover:bg-[#6d4014]"
                >
                  مشاهده محصولات
                </Link>
                <Link
                  href="/products?cat=calligraphy"
                  className="w-full sm:w-auto rounded-full border border-[#e8cfa8] bg-[#fffaf5] px-8 py-3.5 text-sm font-medium text-[#6d4014] transition-all hover:border-[#d4a96a] hover:text-[#8a5419]"
                >
                  حروف کالیگرافی
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
            {rows.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
