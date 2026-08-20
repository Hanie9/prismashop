"use client";

import { useMemo, useState } from "react";
import { useShop } from "../../components/ShopProvider";

export default function AdminInventoryPage() {
  const { products, updateProduct, isLowStock } = useShop();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const list = useMemo(() => {
    if (filter === "low") return products.filter((p) => isLowStock(p));
    if (filter === "out") return products.filter((p) => p.stock <= 0);
    return products;
  }, [products, filter, isLowStock]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">موجودی انبار</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          موجودی محصولات را تنظیم کنید؛ محصولات کم‌موجود علامت‌گذاری می‌شوند
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "همه"],
            ["low", "کم‌موجود"],
            ["out", "ناموجود"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === value
                ? "bg-[#6d4014] text-white"
                : "border border-[#ead7bb] bg-white text-[#6d4014]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-3xl border border-[#ead7bb] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img src={product.image} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 font-bold text-[#2e1a08]">{product.name}</p>
                <p className="text-xs text-[#a96c20]">{product.category}</p>
                {product.stock <= 0 ? (
                  <p className="mt-1 text-xs font-bold text-red-600">ناموجود</p>
                ) : isLowStock(product) ? (
                  <p className="mt-1 text-xs font-bold text-amber-700">
                    موجودی کم — فقط {product.stock.toLocaleString("fa-IR")} عدد
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium text-green-700">موجودی کافی</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
              <label className="text-xs text-[#6d4014]">
                موجودی
                <input
                  type="number"
                  min={0}
                  value={product.stock}
                  onChange={(e) =>
                    updateProduct(product.id, { stock: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="mt-1 block w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-sm font-bold sm:w-24"
                  dir="ltr"
                />
              </label>
              <label className="text-xs text-[#6d4014]">
                آستانه هشدار
                <input
                  type="number"
                  min={1}
                  value={product.lowStockThreshold}
                  onChange={(e) =>
                    updateProduct(product.id, {
                      lowStockThreshold: Math.max(1, Number(e.target.value) || 5),
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-sm sm:w-24"
                  dir="ltr"
                />
              </label>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="rounded-3xl border border-[#ead7bb] bg-white py-16 text-center text-sm text-[#a96c20]">
            موردی در این فیلتر نیست.
          </div>
        )}
      </div>
    </div>
  );
}
