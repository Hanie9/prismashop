"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PriceText from "../components/PriceText";
import { useAuth } from "../components/SessionProvider";
import { useCart } from "../components/CartProvider";
import { useShop } from "../components/ShopProvider";
import { api } from "../lib/api";

function ClearCartDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-cart-dialog-title"
        className="relative max-h-[min(90dvh,28rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>
        <h2 id="clear-cart-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          خالی کردن سبد
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">
          آیا مطمئن هستید که می‌خواهید همه محصولات را از سبد خرید حذف کنید؟ این عمل قابل بازگشت نیست.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419]"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            بله، خالی شود
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn, ready } = useAuth();
  const { items, updateQty, removeItem, clearCart, getAvailableStock } = useCart();
  const { getProduct, refreshShop } = useShop();
  const [stockMsg, setStockMsg] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: getProduct(i.id) }))
        .filter((r) => Boolean(r.product)),
    [items, getProduct],
  );

  const subtotal = rows.reduce((sum, r) => sum + (r.product?.price ?? 0) * r.qty, 0);

  const goCheckout = async () => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.push(`/auth/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    try {
      await refreshShop();
      const check = await api.validateCart(
        rows.map((r) => ({ productId: r.id, qty: r.qty })),
      );
      if (!check.ok) {
        const bad = check.lines.find((l) => !l.ok);
        setStockMsg(
          bad?.reason === "max_stock"
            ? `موجودی برخی محصولات تغییر کرده است (حداکثر ${bad.availableStock.toLocaleString("fa-IR")} عدد).`
            : "برخی محصولات ناموجود شده‌اند. سبد را بررسی کنید.",
        );
        return;
      }
      router.push("/checkout");
    } catch (err) {
      setStockMsg(err instanceof Error ? err.message : "بررسی سبد ناموفق بود.");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8 sm:py-12">
        <h1 className="mb-6 text-2xl font-black text-[#2e1a08] sm:mb-8 sm:text-3xl">سبد خرید</h1>
        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-[28px] border border-[#e8cfa8] bg-gradient-to-b from-white via-[#fffdf9] to-[#fff8ef] shadow-[0_20px_50px_rgba(89,48,10,0.08)] sm:rounded-[36px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, rgba(212,169,106,0.22), transparent 42%),
                  radial-gradient(circle at 85% 75%, rgba(138,84,25,0.08), transparent 45%)`,
              }}
            />
            <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#fff1dc] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-[#f3e2c8] blur-3xl" />

            <div className="relative px-5 py-14 text-center sm:px-8 sm:py-16 md:px-14 md:py-20">
              <div className="relative mx-auto mb-7 h-28 w-28 sm:mb-8 sm:h-32 sm:w-32">
                <div className="absolute inset-3 rounded-[30px] bg-[#f5e9d5]/70 blur-md" />
                <div className="relative flex h-full w-full items-center justify-center rounded-[30px] border border-[#ead7bb]/80 bg-gradient-to-br from-[#fffaf5] to-[#f5e9d5] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_36px_rgba(89,48,10,0.12)]">
                  <svg
                    width="52"
                    height="52"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8a5419"
                    strokeWidth="1.4"
                    className="sm:h-[56px] sm:w-[56px]"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <span className="absolute -bottom-1 -left-1 flex h-9 w-9 items-center justify-center rounded-full border border-[#ead7bb] bg-white text-xs font-black text-[#a96c20] shadow-sm">
                  ۰
                </span>
              </div>

              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ead7bb] bg-white/80 px-4 py-1.5 text-xs font-medium text-[#a96c20] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d4a96a]" />
                سبد آماده انتخاب‌های تازه است
              </span>

              <h2 className="mb-3 text-2xl font-black tracking-tight text-[#2e1a08] sm:text-3xl md:text-[2.1rem]">
                هنوز چیزی در سبد نیست
              </h2>
              <p className="mx-auto mb-9 max-w-lg text-sm leading-8 text-[#6d4014] md:text-base">
                از میان تابلوها و حروف کالیگرافی چوبی، اثر مورد علاقه‌تان را انتخاب کنید
                و خرید را با چند کلیک کامل کنید.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#8a5419] px-8 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(138,84,25,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#6d4014] sm:w-auto"
                >
                  شروع خرید
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </Link>
                <Link
                  href="/products?cat=calligraphy"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#e8cfa8] bg-white/70 px-8 py-3.5 text-sm font-medium text-[#6d4014] backdrop-blur-sm transition-all hover:border-[#d4a96a] hover:bg-[#fffaf5] hover:text-[#8a5419] sm:w-auto"
                >
                  حروف کالیگرافی
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
            <div className="lg:col-span-2 space-y-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex gap-4 rounded-3xl border border-[#e8cfa8] bg-white p-4"
                >
                  <Link href={`/products/${row.id}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.product?.image}
                      alt={row.product?.name}
                      className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${row.id}`}
                        className="font-bold text-[#2e1a08] line-clamp-2 hover:text-[#8a5419]"
                      >
                        {row.product?.name}
                      </Link>
                      {row.qty > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(row.id)}
                          className="shrink-0 text-xs text-red-600 hover:underline"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-xl border border-[#e8cfa8]">
                        {row.qty <= 1 ? (
                          <button
                            type="button"
                            aria-label="حذف از سبد"
                            className="group relative flex h-9 w-9 items-center justify-center rounded-s-xl text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(row.id)}
                          >
                            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M3 6h18" />
                              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                              <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#2e1a08] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                            >
                              حذف از سبد
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label="کاهش تعداد"
                            className="h-9 w-9 rounded-s-xl text-[#6d4014] hover:bg-[#f5e9d5]"
                            onClick={() => updateQty(row.id, row.qty - 1)}
                          >
                            −
                          </button>
                        )}
                        <span className="w-10 text-center text-sm font-bold">{row.qty}</span>
                        <button
                          type="button"
                          className="h-9 w-9 rounded-e-xl text-[#6d4014] hover:bg-[#f5e9d5] disabled:opacity-40"
                          disabled={row.qty >= getAvailableStock(row.id)}
                          onClick={() => {
                            const result = updateQty(row.id, row.qty + 1);
                            if (!result.ok) {
                              setStockMsg(
                                `حداکثر ${getAvailableStock(row.id).toLocaleString("fa-IR")} عدد از این محصول قابل خرید است`,
                              );
                              window.setTimeout(() => setStockMsg(""), 2200);
                            }
                          }}
                        >
                          +
                        </button>
                      </div>
                      <p className="font-bold text-[#2e1a08] text-sm">
                        <PriceText amount={(row.product?.price ?? 0) * row.qty} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 rounded-2xl border border-[#ead7bb] bg-white px-4 py-2.5 text-sm font-medium text-[#6d4014] shadow-[0_4px_14px_rgba(89,48,10,0.04)] transition-all hover:border-[#d4a96a] hover:bg-[#fff6ea] hover:text-[#8a5419] hover:shadow-[0_6px_18px_rgba(138,84,25,0.1)] active:scale-[0.98]"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  ادامه خرید
                </Link>
                <button
                  type="button"
                  onClick={() => setClearDialogOpen(true)}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-red-200/80 bg-white px-4 py-2.5 text-sm font-medium text-red-600 shadow-[0_4px_14px_rgba(89,48,10,0.04)] transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 hover:shadow-[0_6px_18px_rgba(185,28,28,0.08)] active:scale-[0.98]"
                >
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="transition-transform duration-200 group-hover:-translate-y-0.5"
                    aria-hidden
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                  خالی کردن سبد
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#e8cfa8] rounded-3xl p-4 sm:p-5 h-fit lg:sticky lg:top-28">
              <h2 className="font-bold text-[#2e1a08] mb-4">خلاصه سفارش</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between gap-3 font-bold text-[#2e1a08]">
                  <span>مبلغ نهایی</span>
                  <span className="text-left">
                    <PriceText amount={subtotal} />
                  </span>
                </div>
              </div>
              {stockMsg && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{stockMsg}</p>
              )}
              <button
                type="button"
                onClick={() => void goCheckout()}
                className="w-full rounded-2xl bg-[#6d4014] py-3 text-sm font-medium text-white hover:bg-[#4e2e0e]"
              >
                ادامه و تکمیل سفارش
              </button>
            </div>
          </div>
        )}
      </div>

      <ClearCartDialog
        open={clearDialogOpen}
        onCancel={() => setClearDialogOpen(false)}
        onConfirm={() => {
          clearCart();
          setClearDialogOpen(false);
        }}
      />
    </div>
  );
}
