"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import ProductsFilterBar from "../components/ProductsFilterBar";
import { useShop } from "../components/ShopProvider";
import { Suspense } from "react";

const priceOptions = [
  { value: "under-100", label: "زیر ۱۰۰,۰۰۰ تومان" },
  { value: "100-500", label: "۱۰۰,۰۰۰ تا ۵۰۰,۰۰۰ تومان" },
  { value: "500-1000", label: "۵۰۰,۰۰۰ تا ۱,۰۰۰,۰۰۰ تومان" },
  { value: "over-1000", label: "بالای ۱,۰۰۰,۰۰۰ تومان" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const { getActiveProducts, categories } = useShop();
  const products = getActiveProducts();

  const categoryId = searchParams.get("cat") ?? "";
  const query = searchParams.get("q")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "featured";
  const price = searchParams.get("price") ?? "";
  const sale = ["1", "true"].includes((searchParams.get("sale") ?? "").toLowerCase());

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

    if (price === "under-100") list = list.filter((p) => p.price < 100000);
    if (price === "100-500") list = list.filter((p) => p.price >= 100000 && p.price <= 500000);
    if (price === "500-1000") list = list.filter((p) => p.price > 500000 && p.price <= 1000000);
    if (price === "over-1000") list = list.filter((p) => p.price > 1000000);
    if (sale) list = list.filter((p) => Boolean(p.originalPrice));

    if (sort === "cheap") list.sort((a, b) => a.price - b.price);
    if (sort === "expensive") list.sort((a, b) => b.price - a.price);
    if (sort === "newest") list.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    if (sort === "bestseller") list.sort((a, b) => b.reviewCount - a.reviewCount);

    return list;
  }, [products, categoryId, query, sort, price, sale]);

  const hasActiveFilters = Boolean(categoryId || price || sale || sort !== "featured" || query);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="bg-white border-b border-[#e8cfa8]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-[#a96c20]">
            <Link href="/" className="hover:text-[#6d4014]">
              خانه
            </Link>
            <span>/</span>
            <span className="text-[#4e2e0e] font-medium">محصولات</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8">
        <div className="flex flex-col gap-6">
          <ProductsFilterBar
            query={query}
            categoryId={categoryId}
            price={price}
            sort={sort}
            sale={sale}
            categoryOptions={[
              { value: "", label: "همه دسته‌ها" },
              ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
            ]}
            priceOptions={[{ value: "", label: "همه قیمت‌ها" }, ...priceOptions]}
            sortOptions={[
              { value: "featured", label: "مرتب‌سازی" },
              { value: "cheap", label: "ارزان‌ترین" },
              { value: "expensive", label: "گران‌ترین" },
              { value: "newest", label: "جدیدترین" },
              { value: "bestseller", label: "پرفروش‌ترین" },
            ]}
          />

          <div className="flex-1 min-w-0">
            <div className="bg-white border border-[#e8cfa8] rounded-3xl p-4 md:p-5 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl xl:text-2xl font-bold text-[#2e1a08]">
                    {categoryName || "همه محصولات"}
                    <span className="text-sm font-normal text-[#a96c20] mr-2">
                      ({filteredProducts.length.toLocaleString("fa-IR")} محصول)
                    </span>
                  </h1>
                  <p className="text-sm text-[#a96c20] mt-1">
                    نتایج بر اساس دسته، قیمت، وضعیت تخفیف و نوع مرتب‌سازی فیلتر می‌شوند.
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#f5e9d5]">
                  {query && (
                    <span className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
                      جستجو: {query}
                    </span>
                  )}
                  {categoryName && (
                    <span className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
                      دسته: {categoryName}
                    </span>
                  )}
                  {price && (
                    <span className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
                      قیمت: {priceOptions.find((item) => item.value === price)?.label}
                    </span>
                  )}
                  {sort !== "featured" && (
                    <span className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
                      مرتب‌سازی سفارشی
                    </span>
                  )}
                  {sale && (
                    <span className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
                      فقط تخفیف‌دار
                    </span>
                  )}
                </div>
              )}
            </div>

            {query && (
              <p className="text-sm text-[#a96c20] mb-4">
                نتیجه جستجو برای:{" "}
                <span className="font-semibold text-[#6d4014]">«{query}»</span>
              </p>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 xl:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#e8cfa8] p-10 text-center">
                <h2 className="text-lg font-bold text-[#4e2e0e] mb-2">محصولی پیدا نشد</h2>
                <p className="text-sm text-[#a96c20] mb-5">فیلترها یا عبارت جستجو را تغییر بده.</p>
                <Link
                  href="/products"
                  className="inline-block bg-[#6d4014] text-white px-5 py-2.5 rounded-2xl hover:bg-[#4e2e0e] transition-colors"
                >
                  نمایش همه محصولات
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#6d4014]">
          در حال بارگذاری محصولات...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
