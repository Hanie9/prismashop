"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import PageLoader from "../components/PageLoader";
import ProductCard from "../components/ProductCard";
import ProductsFilterBar from "../components/ProductsFilterBar";
import { useShop } from "../components/ShopProvider";

function parsePriceParam(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const { getActiveProducts, categories } = useShop();
  const products = getActiveProducts();

  const categoryId = searchParams.get("cat") ?? "";
  const query = searchParams.get("q")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "featured";
  const minPriceRaw = searchParams.get("min") ?? "";
  const maxPriceRaw = searchParams.get("max") ?? "";
  const minPrice = parsePriceParam(minPriceRaw);
  const maxPrice = parsePriceParam(maxPriceRaw);
  const sale = ["1", "true"].includes((searchParams.get("sale") ?? "").toLowerCase());
  const inStock = ["1", "true"].includes((searchParams.get("stock") ?? "").toLowerCase());

  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (categoryId) {
      list = list.filter((p) => p.categoryId === categoryId);
    }

    if (query) {
      const normalized = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(normalized) ||
          p.category.toLowerCase().includes(normalized),
      );
    }

    if (minPrice != null) list = list.filter((p) => p.price >= minPrice);
    if (maxPrice != null) list = list.filter((p) => p.price <= maxPrice);
    if (sale) list = list.filter((p) => Boolean(p.originalPrice));
    if (inStock) list = list.filter((p) => p.stock > 0);

    if (sort === "cheap") list.sort((a, b) => a.price - b.price);
    if (sort === "expensive") list.sort((a, b) => b.price - a.price);
    if (sort === "bestseller") {
      list.sort(
        (a, b) => Number(Boolean(b.isBestseller)) - Number(Boolean(a.isBestseller)),
      );
    }

    return list;
  }, [products, categoryId, query, sort, minPrice, maxPrice, sale, inStock]);

  const hasActiveFilters = Boolean(
    categoryId || minPrice != null || maxPrice != null || sale || inStock || sort !== "featured" || query,
  );

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="border-b border-[#e8cfa8] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#a96c20]">
            <Link href="/" className="hover:text-[#6d4014]">
              خانه
            </Link>
            <span>/</span>
            <span className="font-medium text-[#4e2e0e]">محصولات</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-6 xl:px-4">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2xl font-black text-[#2e1a08] sm:text-3xl">
            {categoryName || "همه محصولات"}
          </h1>
          <p className="mt-1.5 text-sm text-[#a96c20]">
            {filteredProducts.length.toLocaleString("fa-IR")} محصول یافت شد
          </p>
        </div>

        <div className="mb-5 sm:mb-6">
          <ProductsFilterBar
            query={query}
            categoryId={categoryId}
            minPrice={minPriceRaw}
            maxPrice={maxPriceRaw}
            sort={sort}
            sale={sale}
            inStock={inStock}
            categoryOptions={[
              { value: "", label: "همه" },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
          />
        </div>

        {hasActiveFilters && (
          <div className="mb-5 flex flex-wrap gap-2">
            {query && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                جستجو: {query}
              </span>
            )}
            {categoryName && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                دسته: {categoryName}
              </span>
            )}
            {(minPrice != null || maxPrice != null) && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                قیمت:{" "}
                {minPrice != null ? `از ${minPrice.toLocaleString("fa-IR")}` : "از ۰"}{" "}
                {maxPrice != null ? `تا ${maxPrice.toLocaleString("fa-IR")}` : "به بالا"} تومان
              </span>
            )}
            {sort !== "featured" && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                مرتب‌سازی سفارشی
              </span>
            )}
            {sale && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                فقط تخفیف‌دار
              </span>
            )}
            {inStock && (
              <span className="rounded-full bg-[#fdf1df] px-3 py-1.5 text-sm text-[#6d4014]">
                فقط موجود
              </span>
            )}
          </div>
        )}

        {query && (
          <p className="mb-4 text-sm text-[#a96c20]">
            نتیجه جستجو برای:{" "}
            <span className="font-semibold text-[#6d4014]">«{query}»</span>
          </p>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#e8cfa8] bg-white p-10 text-center">
            <h2 className="mb-2 text-lg font-bold text-[#4e2e0e]">محصولی پیدا نشد</h2>
            <p className="mb-5 text-sm text-[#a96c20]">فیلترها یا عبارت جستجو را تغییر بده.</p>
            <Link
              href="/products"
              className="inline-block rounded-2xl bg-[#6d4014] px-5 py-2.5 text-white transition-colors hover:bg-[#4e2e0e]"
            >
              نمایش همه محصولات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductsContent />
    </Suspense>
  );
}
