"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Option = { value: string; label: string };

function Dropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-2xl border border-[#e8cfa8] bg-[#fdf8f3] px-4 pl-12 py-2.5 text-sm text-[#4e2e0e] shadow-sm focus:outline-none focus:border-[#a96c20] text-right"
      >
        {selectedLabel}
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a96c20]">⌄</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-[#e8cfa8] bg-white shadow-lg overflow-hidden">
          <div className="px-3 py-2 text-[11px] text-[#a96c20] border-b border-[#f5e9d5]">{label}</div>
          <ul className="max-h-56 overflow-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
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
  hasActiveFilters,
}: {
  query: string;
  categoryId: string;
  price: string;
  sort: string;
  sale: boolean;
  categoryOptions: Option[];
  priceOptions: Option[];
  sortOptions: Option[];
  hasActiveFilters: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [catValue, setCatValue] = useState(categoryId);
  const [priceValue, setPriceValue] = useState(price);
  const [sortValue, setSortValue] = useState(sort);
  const [saleValue, setSaleValue] = useState(sale);

  const selectedSummary = useMemo(() => {
    const selected: string[] = [];
    const cat = categoryOptions.find((item) => item.value === catValue)?.label;
    const priceLabel = priceOptions.find((item) => item.value === priceValue)?.label;
    const sortLabel = sortOptions.find((item) => item.value === sortValue)?.label;
    if (cat && catValue) selected.push(`دسته: ${cat}`);
    if (priceLabel && priceValue) selected.push(`قیمت: ${priceLabel}`);
    if (sortLabel && sortValue !== "featured") selected.push(`مرتب‌سازی: ${sortLabel}`);
    if (saleValue) selected.push("فقط تخفیف‌دار");
    return selected;
  }, [catValue, priceValue, sortValue, saleValue, categoryOptions, priceOptions, sortOptions]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (catValue) params.set("cat", catValue);
    if (priceValue) params.set("price", priceValue);
    if (sortValue && sortValue !== "featured") params.set("sort", sortValue);
    if (saleValue) params.set("sale", "1");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#e8cfa8] p-3 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-center">
        <div className="flex items-center gap-2 shrink-0 md:col-span-2 xl:col-span-4">
          <span className="text-sm font-bold text-[#2e1a08]">فیلتر</span>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="text-xs text-[#a96c20] hover:text-[#6d4014]">
              پاک کردن
            </button>
          )}
        </div>

        <Dropdown label="دسته‌بندی" value={catValue} onChange={setCatValue} options={categoryOptions} />
        <Dropdown label="محدوده قیمت" value={priceValue} onChange={setPriceValue} options={priceOptions} />

        <label className="flex items-center gap-2 text-sm text-[#4e2e0e] rounded-2xl border border-[#e8cfa8] bg-[#fffaf4] px-3 py-2.5 whitespace-nowrap">
          <input type="checkbox" checked={saleValue} onChange={(e) => setSaleValue(e.target.checked)} className="w-4 h-4 accent-[#6d4014]" />
          فقط تخفیف‌دار
        </label>

        <Dropdown label="مرتب‌سازی" value={sortValue} onChange={setSortValue} options={sortOptions} />

        <button
          type="button"
          onClick={applyFilters}
          className="md:col-span-2 xl:col-span-4 xl:justify-self-start bg-[#6d4014] hover:bg-[#4e2e0e] text-white text-sm px-5 py-2.5 rounded-2xl font-medium transition-colors"
        >
          اعمال
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
