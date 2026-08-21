"use client";

import { useEffect, useMemo, useState } from "react";
import { useShop } from "../../components/ShopProvider";

type Draft = {
  stock: string;
  lowStockThreshold: string;
};

export default function AdminInventoryPage() {
  const { products, updateProduct, isLowStock } = useShop();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [errorById, setErrorById] = useState<Record<number, string>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<number, Draft> = {};
      for (const product of products) {
        const existing = prev[product.id];
        const saved: Draft = {
          stock: String(product.stock),
          lowStockThreshold: String(product.lowStockThreshold),
        };
        // Keep in-progress edits; sync rows that match saved values or are new.
        if (
          existing &&
          (existing.stock !== String(product.stock) ||
            existing.lowStockThreshold !== String(product.lowStockThreshold))
        ) {
          next[product.id] = existing;
        } else {
          next[product.id] = saved;
        }
      }
      return next;
    });
  }, [products]);

  const list = useMemo(() => {
    if (filter === "low") return products.filter((p) => isLowStock(p));
    if (filter === "out") return products.filter((p) => p.stock <= 0);
    return products;
  }, [products, filter, isLowStock]);

  const setDraft = (id: number, patch: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        stock: prev[id]?.stock ?? "0",
        lowStockThreshold: prev[id]?.lowStockThreshold ?? "5",
        ...patch,
      },
    }));
    setErrorById((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveRow = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;

    const stock = Math.max(0, Number(draft.stock) || 0);
    const lowStockThreshold = Math.max(1, Number(draft.lowStockThreshold) || 5);

    setSavingId(id);
    setErrorById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      await updateProduct(id, { stock, lowStockThreshold });
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          stock: String(stock),
          lowStockThreshold: String(lowStockThreshold),
        },
      }));
      setSavedId(id);
      window.setTimeout(() => {
        setSavedId((current) => (current === id ? null : current));
      }, 1800);
    } catch (err) {
      setErrorById((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "ذخیره موجودی ناموفق بود.",
      }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">موجودی انبار</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          موجودی را تنظیم کنید و برای هر محصول دکمه ذخیره را بزنید تا در دیتابیس ثبت شود
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
        {list.map((product) => {
          const draft = drafts[product.id] ?? {
            stock: String(product.stock),
            lowStockThreshold: String(product.lowStockThreshold),
          };
          const draftStock = Math.max(0, Number(draft.stock) || 0);
          const draftThreshold = Math.max(1, Number(draft.lowStockThreshold) || 5);
          const dirty =
            draftStock !== product.stock || draftThreshold !== product.lowStockThreshold;
          const willBeOut = draftStock <= 0;
          const willBeLow = draftStock > 0 && draftStock <= draftThreshold;
          const saving = savingId === product.id;
          const justSaved = savedId === product.id;
          const error = errorById[product.id];

          return (
            <div
              key={product.id}
              className={`rounded-3xl border bg-white p-4 transition-colors ${
                dirty ? "border-amber-300 shadow-[0_8px_24px_rgba(180,83,9,0.08)]" : "border-[#ead7bb]"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-bold text-[#2e1a08]">{product.name}</p>
                    <p className="text-xs text-[#a96c20]">{product.category}</p>
                    {product.stock <= 0 ? (
                      <p className="mt-1 text-xs font-bold text-red-600">ناموجود (فعلی)</p>
                    ) : isLowStock(product) ? (
                      <p className="mt-1 text-xs font-bold text-amber-700">
                        موجودی فعلی کم — {product.stock.toLocaleString("fa-IR")} عدد
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        موجودی فعلی: {product.stock.toLocaleString("fa-IR")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
                  <label className="text-xs text-[#6d4014]">
                    موجودی
                    <input
                      type="number"
                      min={0}
                      value={draft.stock}
                      onChange={(e) => setDraft(product.id, { stock: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-sm font-bold sm:w-24"
                      dir="ltr"
                    />
                  </label>
                  <label className="text-xs text-[#6d4014]">
                    آستانه هشدار
                    <input
                      type="number"
                      min={1}
                      value={draft.lowStockThreshold}
                      onChange={(e) => setDraft(product.id, { lowStockThreshold: e.target.value })}
                      className="mt-1 block w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-sm sm:w-24"
                      dir="ltr"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!dirty || saving}
                    onClick={() => void saveRow(product.id)}
                    className={`col-span-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors sm:col-span-1 sm:min-w-[7.5rem] ${
                      dirty
                        ? "bg-[#6d4014] text-white hover:bg-[#4e2e0e] disabled:opacity-60"
                        : justSaved
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-[#ead7bb] bg-[#fffaf5] text-[#a96c20]"
                    }`}
                  >
                    {saving ? "در حال ذخیره…" : justSaved && !dirty ? "ذخیره شد" : "ذخیره"}
                  </button>
                </div>
              </div>

              {dirty && (
                <div
                  className={`mt-3 rounded-2xl px-3 py-2 text-xs leading-6 ${
                    willBeOut
                      ? "bg-red-50 text-red-700"
                      : willBeLow
                        ? "bg-amber-50 text-amber-800"
                        : "bg-[#fff6ea] text-[#6d4014]"
                  }`}
                >
                  {willBeOut ? (
                    <>
                      هشدار: با ذخیره، این محصول <strong>ناموجود</strong> می‌شود و در فروشگاه قابل خرید
                      نخواهد بود.
                    </>
                  ) : willBeLow ? (
                    <>
                      هشدار: موجودی پیشنهادی ({draftStock.toLocaleString("fa-IR")}) کمتر یا مساوی آستانه
                      هشدار ({draftThreshold.toLocaleString("fa-IR")}) است و به‌عنوان کم‌موجود علامت
                      می‌خورد.
                    </>
                  ) : (
                    <>
                      تغییرات ذخیره نشده‌اند. برای ثبت در دیتابیس دکمه <strong>ذخیره</strong> را بزنید.
                    </>
                  )}
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
              )}
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="rounded-3xl border border-[#ead7bb] bg-white py-16 text-center text-sm text-[#a96c20]">
            موردی در این فیلتر نیست.
          </div>
        )}
      </div>
    </div>
  );
}
