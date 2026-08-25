"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import DialogCloseButton from "./DialogCloseButton";

type Option = { value: string; label: string };

const DEFAULT_SORT = "featured";

const SORT_ITEMS: {
  value: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    value: "bestseller",
    label: "پرفروش‌ترین",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "cheap",
    label: "ارزان‌ترین",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2v20" strokeLinecap="round" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: "expensive",
    label: "گران‌ترین",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9.5 10h5a1.5 1.5 0 0 1 0 3h-5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function BottomSheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-[#ead7bb] bg-white shadow-[0_-20px_60px_rgba(89,48,10,0.2)] sm:rounded-[28px]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f0e0c8] px-4 py-3.5 sm:px-5">
          <h2 className="text-base font-black text-[#2e1a08] sm:text-lg">{title}</h2>
          <DialogCloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-[#f0e0c8] bg-white px-4 py-3 sm:px-5">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default function ProductsFilterBar({
  query,
  categoryId,
  minPrice,
  maxPrice,
  sort,
  sale,
  inStock,
  categoryOptions,
}: {
  query: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  sale: boolean;
  inStock: boolean;
  categoryOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [catValue, setCatValue] = useState(categoryId);
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);
  const [saleValue, setSaleValue] = useState(sale);
  const [stockValue, setStockValue] = useState(inStock);

  useEffect(() => {
    setCatValue(categoryId);
    setMinValue(minPrice);
    setMaxValue(maxPrice);
    setSaleValue(sale);
    setStockValue(inStock);
  }, [categoryId, minPrice, maxPrice, sale, inStock, filterOpen]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (categoryId) n += 1;
    if (minPrice || maxPrice) n += 1;
    if (sale) n += 1;
    if (inStock) n += 1;
    return n;
  }, [categoryId, minPrice, maxPrice, sale, inStock]);

  const sortLabel =
    SORT_ITEMS.find((item) => item.value === sort)?.label ?? "مرتب‌سازی";

  const pushParams = (patch: {
    cat?: string;
    min?: string;
    max?: string;
    sort?: string;
    sale?: boolean;
    stock?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);

    const nextCat = patch.cat !== undefined ? patch.cat : categoryId;
    const nextMin = patch.min !== undefined ? patch.min : minPrice;
    const nextMax = patch.max !== undefined ? patch.max : maxPrice;
    const nextSort = patch.sort !== undefined ? patch.sort : sort;
    const nextSale = patch.sale !== undefined ? patch.sale : sale;
    const nextStock = patch.stock !== undefined ? patch.stock : inStock;

    if (nextCat) params.set("cat", nextCat);
    if (nextMin) params.set("min", nextMin);
    if (nextMax) params.set("max", nextMax);
    if (nextSort && nextSort !== DEFAULT_SORT) params.set("sort", nextSort);
    if (nextSale) params.set("sale", "1");
    if (nextStock) params.set("stock", "1");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const normalizePriceInput = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    return digits;
  };

  const applyFilters = () => {
    let min = normalizePriceInput(minValue);
    let max = normalizePriceInput(maxValue);
    if (min && max && Number(min) > Number(max)) {
      const swap = min;
      min = max;
      max = swap;
    }
    pushParams({
      cat: catValue,
      min,
      max,
      sale: saleValue,
      stock: stockValue,
    });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setCatValue("");
    setMinValue("");
    setMaxValue("");
    setSaleValue(false);
    setStockValue(false);
    pushParams({
      cat: "",
      min: "",
      max: "",
      sale: false,
      stock: false,
      sort,
    });
    setFilterOpen(false);
  };

  const selectSort = (value: string) => {
    pushParams({ sort: value });
    setSortOpen(false);
  };

  const priceInputClass =
    "h-12 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-4 text-sm text-[#4e2e0e] placeholder:text-[#b98a53] focus:border-[#c2883a] focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15";

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setSortOpen(false);
            setFilterOpen(true);
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
            activeFilterCount > 0
              ? "border-[#8a5419] bg-[#8a5419] text-white"
              : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a] hover:bg-[#fff6ea]"
          }`}
        >
          <span>فیلتر</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px]">
              {activeFilterCount.toLocaleString("fa-IR")}
            </span>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterOpen(false);
            setSortOpen(true);
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition-colors ${
            sort !== DEFAULT_SORT
              ? "border-[#8a5419] bg-[#8a5419] text-white"
              : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a] hover:bg-[#fff6ea]"
          }`}
        >
          <span className="truncate">{sortLabel}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 6h13" strokeLinecap="round" />
            <path d="M3 12h9" strokeLinecap="round" />
            <path d="M3 18h5" strokeLinecap="round" />
            <path d="M18 6v12" strokeLinecap="round" />
            <path d="m15 15 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <BottomSheet open={sortOpen} title="مرتب‌سازی" onClose={() => setSortOpen(false)}>
        <ul className="space-y-2">
          {SORT_ITEMS.map((item) => {
            const selected = sort === item.value;
            return (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => selectSort(item.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-[#8a5419] text-white shadow-[0_10px_24px_rgba(138,84,25,0.28)]"
                      : "bg-[#fffaf5] text-[#4e2e0e] hover:bg-[#fff1df]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={selected ? "text-white" : "text-[#a96c20]"}>{item.icon}</span>
                    {item.label}
                  </span>
                  {selected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={filterOpen}
        title="فیلترها"
        onClose={() => setFilterOpen(false)}
        footer={
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a]"
            >
              پاک کردن
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-2xl bg-[#8a5419] py-3 text-sm font-bold text-white transition-colors hover:bg-[#6d4014]"
            >
              اعمال فیلتر
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-bold text-[#2e1a08]">فیلترهای سریع</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSaleValue((v) => !v)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                  saleValue
                    ? "border-[#8a5419] bg-[#fff1df] text-[#6d4014]"
                    : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  فقط تخفیف‌دارها
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    saleValue ? "border-[#8a5419] bg-[#8a5419] text-white" : "border-[#d4a96a] bg-white"
                  }`}
                >
                  {saleValue && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStockValue((v) => !v)}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors ${
                  stockValue
                    ? "border-[#8a5419] bg-[#fff1df] text-[#6d4014]"
                    : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" />
                    <path d="M22 4 12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  فقط موجودها
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    stockValue ? "border-[#8a5419] bg-[#8a5419] text-white" : "border-[#d4a96a] bg-white"
                  }`}
                >
                  {stockValue && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-[#2e1a08]">محدوده قیمت</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#a96c20]">
                  از
                </span>
                <input
                  id="filter-price-min"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  aria-label="از"
                  placeholder=""
                  value={minValue}
                  onChange={(e) => setMinValue(normalizePriceInput(e.target.value))}
                  className={`${priceInputClass} pr-10 pl-4 text-left`}
                />
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#a96c20]">
                  تا
                </span>
                <input
                  id="filter-price-max"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  aria-label="تا"
                  placeholder=""
                  value={maxValue}
                  onChange={(e) => setMaxValue(normalizePriceInput(e.target.value))}
                  className={`${priceInputClass} pr-10 pl-4 text-left`}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#a96c20]">مبالغ به تومان وارد شوند.</p>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-[#2e1a08]">دسته‌بندی</h3>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((opt) => {
                const selected = catValue === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    onClick={() => setCatValue(opt.value)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      selected
                        ? "border-[#8a5419] bg-[#8a5419] text-white"
                        : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}
