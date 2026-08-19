"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  discount?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, getItemQty, updateQty, removeItem } = useCart();
  const [added, setAdded] = useState(false);
  const qtyInCart = getItemQty(product.id);
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="product-card bg-white rounded-2xl overflow-hidden border border-[#e8cfa8] transition-all duration-300">
        {/* Image */}
        <div className="relative overflow-hidden bg-[#f5e9d5] aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-[#2d4a2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">جدید</span>
            )}
            {discountPct > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {discountPct}٪ تخفیف
              </span>
            )}
          </div>
          {/* Quick add */}
          {qtyInCart === 0 ? (
            <button
              className="absolute bottom-3 left-3 right-3 bg-[#6d4014] text-white text-xs py-2 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-medium"
              onClick={(e) => {
                e.preventDefault();
                addItem(product.id, 1);
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1200);
              }}
            >
              {added ? "به سبد اضافه شد" : "افزودن به سبد خرید"}
            </button>
          ) : (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#6d4014] text-white py-1.5 px-2 rounded-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              {qtyInCart === 1 ? (
                <button
                  className="w-8 h-8 rounded-md bg-red-600/90 hover:bg-red-500 flex items-center justify-center"
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
                  className="w-8 h-8 rounded-md bg-[#8a5419] hover:bg-[#a96c20] flex items-center justify-center text-base leading-none"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQty(product.id, qtyInCart - 1);
                  }}
                  aria-label="کاهش تعداد"
                >
                  −
                </button>
              )}

              <span className="text-xs font-medium">در سبد: {qtyInCart.toLocaleString("fa-IR")}</span>

              <button
                className="w-8 h-8 rounded-md bg-[#8a5419] hover:bg-[#a96c20] flex items-center justify-center text-base leading-none"
                onClick={(e) => {
                  e.preventDefault();
                  addItem(product.id, 1);
                }}
                aria-label="افزایش تعداد"
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="text-[10px] text-[#a96c20] mb-1">{product.category}</div>
          <h3 className="text-sm font-semibold text-[#2e1a08] line-clamp-2 leading-6 mb-2">{product.name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="12" height="12"
                viewBox="0 0 24 24"
                fill={star <= product.rating ? "#d4a96a" : "none"}
                stroke="#d4a96a"
                strokeWidth={2}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ))}
            <span className="text-[10px] text-[#a96c20] mr-0.5">({product.reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#4e2e0e] text-base">
              {product.price.toLocaleString("fa-IR")} تومان
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
