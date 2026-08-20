"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Option = { value: string; label: string };

const DEFAULT_SORT = "featured";

function Dropdown({
  id,
  label,
  value,
  onChange,
  options,
  open,
  onOpenChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  open: boolean;
  onOpenChange: (id: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(open ? null : id)}
        className={`w-full rounded-2xl border bg-[#fdf8f3] px-4 pl-12 py-2.5 text-sm text-[#4e2e0e] shadow-sm focus:outline-none text-right truncate transition-colors ${
          open ? "border-[#a96c20]" : "border-[#e8cfa8] focus:border-[#a96c20]"
        }`}
      >
        {selectedLabel}
        <span
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-[#a96c20] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-full min-w-[200px] rounded-2xl border border-[#e8cfa8] bg-white shadow-[0_16px_40px_rgba(89,48,10,0.14)] overflow-hidden">
          <div className="px-3 py-2 text-[11px] text-[#a96c20] border-b border-[#f5e9d5]">{label}</div>
          <ul className="max-h-56 overflow-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onOpenChange(null);
                  }}
                  className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${
                    value === option.value
                      ? "bg-[#fdf1df] text-[#6d4014] font-medium"
                      : "text-[#4e2e0e] hover:bg-[#f8efe2]"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ProductsFilterBar({
  query,
  categoryId,
  price,
  sort,
  sale,
  categoryOptions,
  priceOptions,
  sortOptions,
}: {
  query: string;
  categoryId: string;
  price: string;
  sort: string;
  sale: boolean;
  categoryOptions: Option[];
  priceOptions: Option[];
  sortOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [catValue, setCatValue] = useState(categoryId);
  const [priceValue, setPriceValue] = useState(price);
  const [sortValue, setSortValue] = useState(sort);
  const [saleValue, setSaleValue] = useState(sale);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setCatValue(categoryId);
    setPriceValue(price);
    setSortValue(sort);
    setSaleValue(sale);
    setOpenDropdown(null);
  }, [categoryId, price, sort, sale]);

  const selectedSummary = useMemo(() => {
    const selected: string[] = [];
    const cat = categoryOptions.find((item) => item.value === catValue)?.label;
    const priceLabel = priceOptions.find((item) => item.value === priceValue)?.label;
    const sortLabel = sortOptions.find((item) => item.value === sortValue)?.label;
    if (cat && catValue) selected.push(`دسته: ${cat}`);
    if (priceLabel && priceValue) selected.push(`قیمت: ${priceLabel}`);
    if (sortLabel && sortValue !== DEFAULT_SORT) selected.push(`مرتب‌سازی: ${sortLabel}`);
    if (saleValue) selected.push("فقط تخفیف‌دار");
    return selected;
  }, [catValue, priceValue, sortValue, saleValue, categoryOptions, priceOptions, sortOptions]);

  const hasAppliedFilters = Boolean(categoryId || price || sale || sort !== DEFAULT_SORT);
  const hasDraftFilters = Boolean(catValue || priceValue || saleValue || sortValue !== DEFAULT_SORT);
  const canClear = hasAppliedFilters || hasDraftFilters;

  const applyFilters = () => {
    setOpenDropdown(null);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (catValue) params.set("cat", catValue);
    if (priceValue) params.set("price", priceValue);
    if (sortValue && sortValue !== DEFAULT_SORT) params.set("sort", sortValue);
    if (saleValue) params.set("sale", "1");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearFilters = () => {
    setCatValue("");
    setPriceValue("");
    setSortValue(DEFAULT_SORT);
    setSaleValue(false);
    setOpenDropdown(null);

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e8cfa8] p-3 sm:p-4 lg:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3 lg:mb-4">
        <span className="text-sm font-bold text-[#2e1a08]">فیلتر محصولات</span>
        {canClear && (
          <button type="button" onClick={clearFilters} className="text-xs text-[#a96c20] hover:text-[#6d4014]">
            پاک کردن فیلترها
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.1fr_1.1fr_1fr_auto_auto] gap-3 items-stretch">
        <Dropdown
          id="category"
          label="دسته‌بندی"
          value={catValue}
          onChange={setCatValue}
          options={categoryOptions}
          open={openDropdown === "category"}
          onOpenChange={setOpenDropdown}
        />
        <Dropdown
          id="price"
          label="محدوده قیمت"
          value={priceValue}
          onChange={setPriceValue}
          options={priceOptions}
          open={openDropdown === "price"}
          onOpenChange={setOpenDropdown}
        />
        <Dropdown
          id="sort"
          label="مرتب‌سازی"
          value={sortValue}
          onChange={setSortValue}
          options={sortOptions}
          open={openDropdown === "sort"}
          onOpenChange={setOpenDropdown}
        />

        <label className="flex items-center gap-2 text-sm text-[#4e2e0e] rounded-2xl border border-[#e8cfa8] bg-[#fffaf4] px-3 py-2.5 whitespace-nowrap">
          <input
            type="checkbox"
            checked={saleValue}
            onChange={(e) => setSaleValue(e.target.checked)}
            className="w-4 h-4 accent-[#6d4014] shrink-0"
          />
          فقط تخفیف‌دار
        </label>

        <button
          type="button"
          onClick={applyFilters}
          className="sm:col-span-2 lg:col-span-3 xl:col-span-1 bg-[#6d4014] hover:bg-[#4e2e0e] text-white text-sm px-6 py-2.5 rounded-2xl font-medium transition-colors"
        >
          اعمال فیلتر
        </button>
      </div>

      {selectedSummary.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#f5e9d5]">
          {selectedSummary.map((item) => (
            <span key={item} className="px-3 py-1.5 rounded-full bg-[#fdf1df] text-[#6d4014] text-sm">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
