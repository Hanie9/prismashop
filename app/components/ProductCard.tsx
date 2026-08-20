"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "../lib/shop-types";
import { useCart } from "./CartProvider";
import { useShop } from "./ShopProvider";
import { useWishlist } from "./WishlistProvider";

export type { Product };

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, getItemQty, updateQty, removeItem, getAvailableStock } = useCart();
  const { isLowStock } = useShop();
  const { isWishlisted, toggleItem } = useWishlist();
  const [added, setAdded] = useState(false);
  const [stockMsg, setStockMsg] = useState("");
  const qtyInCart = getItemQty(product.id);
  const stock = getAvailableStock(product.id);
  const wishlisted = isWishlisted(product.id);
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const outOfStock = stock <= 0;
  const atMax = qtyInCart >= stock;

  const showStockMsg = (reason?: "out_of_stock" | "max_stock") => {
    if (reason === "out_of_stock") setStockMsg("این محصول ناموجود است");
    else if (reason === "max_stock")
      setStockMsg(`حداکثر ${stock.toLocaleString("fa-IR")} عدد قابل خرید است`);
    else setStockMsg("");
    window.setTimeout(() => setStockMsg(""), 2000);
  };

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="product-card bg-white rounded-2xl overflow-hidden border border-[#e8cfa8] transition-all duration-300">
        <div className="relative overflow-hidden bg-[#f5e9d5] aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-[#2d4a2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                جدید
              </span>
            )}
            {discountPct > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {discountPct}٪ تخفیف
              </span>
            )}
            {outOfStock ? (
              <span className="bg-[#2e1a08]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                ناموجود
              </span>
            ) : isLowStock(product) ? (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                موجودی کم
              </span>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={wishlisted ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem(product.id);
            }}
            className={`absolute top-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
              wishlisted
                ? "border-[#c2883a] bg-[#fff6ea] text-[#a96c20]"
                : "border-white/70 bg-white/90 text-[#a96c20] hover:border-[#d4a96a] hover:text-[#8a5419]"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={wishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {outOfStock ? (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-[#2e1a08]/85 py-2.5 text-center text-xs font-medium text-white">
              ناموجود
            </div>
          ) : qtyInCart === 0 ? (
            <button
              className="absolute bottom-3 left-3 right-3 bg-[#6d4014] text-white text-xs sm:text-sm py-2.5 rounded-xl opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 font-medium"
              onClick={(e) => {
                e.preventDefault();
                const result = addItem(product.id, 1);
                if (!result.ok) {
                  showStockMsg(result.reason);
                  return;
                }
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1200);
              }}
            >
              {added ? "به سبد اضافه شد" : "افزودن به سبد"}
            </button>
          ) : (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#6d4014] text-white py-1.5 px-2 rounded-xl opacity-100 translate-y-0 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
              {qtyInCart === 1 ? (
                <button
                  className="w-10 h-10 rounded-md bg-red-600/90 hover:bg-red-500 flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    removeItem(product.id);
                  }}
                  aria-label="حذف از سبد"
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                  </svg>
                </button>
              ) : (
                <button
                  className="w-10 h-10 rounded-md bg-[#8a5419] hover:bg-[#a96c20] flex items-center justify-center text-base leading-none"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQty(product.id, qtyInCart - 1);
                  }}
                  aria-label="کاهش تعداد"
                >
                  −
                </button>
              )}

              <span className="text-xs font-medium">
                در سبد: {qtyInCart.toLocaleString("fa-IR")}
              </span>

              <button
                className={`w-10 h-10 rounded-md flex items-center justify-center text-base leading-none ${
                  atMax ? "bg-[#5a3a1a] opacity-50 cursor-not-allowed" : "bg-[#8a5419] hover:bg-[#a96c20]"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  const result = addItem(product.id, 1);
                  if (!result.ok) showStockMsg(result.reason);
                }}
                aria-label="افزایش تعداد"
                disabled={atMax}
              >
                +
              </button>
            </div>
          )}
          {stockMsg && (
            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-[#2e1a08]/90 px-3 py-2 text-center text-[11px] font-medium text-white">
              {stockMsg}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="text-[10px] text-[#a96c20] mb-1">{product.category}</div>
          <h3 className="text-xs sm:text-sm font-semibold text-[#2e1a08] line-clamp-2 leading-6 mb-2">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={star <= product.rating ? "#d4a96a" : "none"}
                stroke="#d4a96a"
                strokeWidth={2}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span className="text-[10px] text-[#a96c20] mr-0.5">({product.reviewCount})</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-bold text-[#4e2e0e] text-sm sm:text-base">
              {product.price.toLocaleString("fa-IR")}
              <span className="text-[11px] sm:text-xs font-medium me-1">تومان</span>
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
