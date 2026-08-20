"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../components/CartProvider";
import { useShop } from "../components/ShopProvider";
import {
  calcCouponDiscount,
  COUPON_STORAGE_KEY,
  findCoupon,
} from "../lib/coupons";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, getAvailableStock } = useCart();
  const { getProduct, coupons } = useShop();
  const [coupon, setCoupon] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [stockMsg, setStockMsg] = useState("");

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(COUPON_STORAGE_KEY);
      if (saved) {
        setAppliedCode(saved);
        setCoupon(saved);
      }
    } catch {}
  }, []);

  const rows = useMemo(
    () =>
      items
        .map((i) => ({ ...i, product: getProduct(i.id) }))
        .filter((r) => Boolean(r.product)),
    [items, getProduct],
  );

  const appliedCoupon = appliedCode ? findCoupon(coupons, appliedCode) : undefined;
  const couponApplied = Boolean(appliedCoupon);
  const subtotal = rows.reduce((sum, r) => sum + (r.product?.price ?? 0) * r.qty, 0);
  const discount = calcCouponDiscount(subtotal, appliedCoupon);
  const shipping = subtotal > 500000 ? 0 : 60000;
  const total = subtotal - discount + shipping;

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-6 sm:mb-8">سبد خرید</h1>
        {rows.length === 0 ? (
          <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-[#e8cfa8] bg-white shadow-[0_20px_50px_rgba(89,48,10,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,169,106,0.14),transparent_45%)]" />
            <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#fff6ea] blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-[#f5e9d5] blur-3xl" />

            <div className="relative px-5 py-12 sm:px-6 sm:py-14 md:px-12 md:py-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#fff6ea] to-[#f5e9d5] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_30px_rgba(89,48,10,0.1)]">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8a5419" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
                </svg>
              </div>

              <span className="mb-4 inline-flex rounded-full border border-[#ead7bb] bg-[#fffaf5] px-4 py-1.5 text-xs font-medium text-[#a96c20]">
                هنوز محصولی انتخاب نکرده‌اید
              </span>

              <h2 className="mb-3 text-xl sm:text-2xl md:text-3xl font-black text-[#2e1a08]">سبد خرید شما خالی است</h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-7 text-[#6d4014] md:text-base">
                محصولات چوبی و حروف کالیگرافی پریسما شاپ را ببینید و اولین انتخاب خود را به سبد اضافه کنید.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/products"
                  className="w-full sm:w-auto rounded-full bg-[#8a5419] px-8 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(138,84,25,0.25)] transition-all hover:bg-[#6d4014]"
                >
                  مشاهده محصولات
                </Link>
                <Link
                  href="/products?cat=calligraphy"
                  className="w-full sm:w-auto rounded-full border border-[#e8cfa8] bg-[#fffaf5] px-8 py-3.5 text-sm font-medium text-[#6d4014] transition-all hover:border-[#d4a96a] hover:text-[#8a5419]"
                >
                  حروف کالیگرافی
                </Link>
              </div>

              <div className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { title: "ارسال سریع", desc: "تحویل به سراسر کشور" },
                  { title: "ضمانت اصالت", desc: "محصولات اورجینال چوبی" },
                  { title: "پشتیبانی", desc: "همراهی تا تحویل سفارش" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#f1e3cf] bg-[#fffaf5]/80 px-4 py-3 text-center"
                  >
                    <p className="text-sm font-bold text-[#4e2e0e]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#a96c20]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
            <div className="lg:col-span-2 bg-white border border-[#e8cfa8] rounded-3xl p-4 sm:p-5 space-y-4">
              {rows.map((row) => (
                <div key={row.id} className="border border-[#f1dfc4] rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4">
                  <img
                    src={row.product?.image}
                    alt={row.product?.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2e1a08] mb-1 text-sm sm:text-base leading-6 line-clamp-2">{row.product?.name}</h3>
                    <p className="text-xs text-[#a96c20] mb-3">{row.product?.category}</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center border border-[#e8cfa8] rounded-lg w-fit">
                        {row.qty === 1 ? (
                          <button
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-r-lg"
                            onClick={() => removeItem(row.id)}
                            aria-label="حذف آیتم"
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M3 6h18" />
                              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                              <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        ) : (
                          <button className="px-3 py-2 min-w-10" onClick={() => updateQty(row.id, row.qty - 1)}>−</button>
                        )}
                        <span className="px-3 py-2 min-w-8 text-center text-sm font-medium">{row.qty}</span>
                        <button
                          className="px-3 py-2 min-w-10 disabled:opacity-40"
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
                      {row.qty >= getAvailableStock(row.id) && (
                        <p className="text-[11px] text-amber-700 mt-1">
                          حداکثر موجودی: {getAvailableStock(row.id).toLocaleString("fa-IR")} عدد
                        </p>
                      )}
                      <div className="sm:text-left flex items-center justify-between sm:block gap-3">
                        <p className="font-bold text-[#4e2e0e] text-sm sm:text-base">{((row.product?.price ?? 0) * row.qty).toLocaleString("fa-IR")} تومان</p>
                        <button className="text-xs text-red-600 sm:mt-1" onClick={() => removeItem(row.id)}>حذف</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={clearCart} className="border border-red-300 text-red-700 px-4 py-2.5 rounded-xl text-sm">
                  خالی کردن سبد
                </button>
                <Link href="/products" className="border border-[#a96c20] text-[#6d4014] px-4 py-2.5 rounded-xl text-sm">
                  ادامه خرید
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#e8cfa8] rounded-3xl p-4 sm:p-5 h-fit lg:sticky lg:top-28">
              <h2 className="font-bold text-[#2e1a08] mb-4">خلاصه سفارش</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between gap-3"><span>جمع کل</span><span className="text-left">{subtotal.toLocaleString("fa-IR")} تومان</span></div>
                <div className="flex justify-between gap-3 text-green-700"><span>تخفیف</span><span className="text-left">{discount.toLocaleString("fa-IR")} تومان</span></div>
                <div className="flex justify-between gap-3"><span>ارسال</span><span className="text-left">{shipping === 0 ? "رایگان" : `${shipping.toLocaleString("fa-IR")} تومان`}</span></div>
                <div className="flex justify-between gap-3 font-bold text-[#2e1a08] border-t pt-2"><span>مبلغ نهایی</span><span className="text-left">{total.toLocaleString("fa-IR")} تومان</span></div>
              </div>
              {stockMsg && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{stockMsg}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="کد تخفیف"
                  className={`flex-1 min-w-0 rounded-xl border border-[#e8cfa8] bg-[#fdf8f3] px-3 py-2.5 text-sm ${
                    coupon ? "text-left" : "text-right"
                  }`}
                  disabled={couponApplied}
                  dir={coupon ? "ltr" : "rtl"}
                />
                {!couponApplied ? (
                  <button
                    onClick={() => {
                      const found = findCoupon(coupons, coupon);
                      if (!found) {
                        setCouponMessage("کد تخفیف معتبر نیست.");
                        return;
                      }
                      if (subtotal < found.minOrder) {
                        setCouponMessage(
                          `حداقل مبلغ سفارش برای این کد ${found.minOrder.toLocaleString("fa-IR")} تومان است.`,
                        );
                        return;
                      }
                      setAppliedCode(found.code);
                      window.sessionStorage.setItem(COUPON_STORAGE_KEY, found.code);
                      setCouponMessage("کد تخفیف با موفقیت اعمال شد.");
                    }}
                    className="bg-[#6d4014] text-white px-4 py-2.5 rounded-xl shrink-0 text-sm"
                  >
                    اعمال
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAppliedCode("");
                      setCoupon("");
                      setCouponMessage("");
                      window.sessionStorage.removeItem(COUPON_STORAGE_KEY);
                    }}
                    className="border border-[#ead7bb] text-[#6d4014] px-4 py-2.5 rounded-xl shrink-0 text-sm"
                  >
                    حذف کد
                  </button>
                )}
              </div>
              {couponMessage && (
                <div className={`text-xs mb-3 flex items-center gap-1.5 ${couponApplied ? "text-green-700" : "text-red-600"}`}>
                  {couponApplied && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <p>{couponMessage}</p>
                </div>
              )}
              {!couponApplied && (
                <p className="mb-4 text-right text-xs leading-6 text-[#a96c20]" dir="rtl">
                  کدهای فعال را از پنل ادمین مدیریت کنید (مثل{" "}
                  <span dir="ltr" className="inline-block font-medium tracking-wide">
                    PRISMA10
                  </span>
                  ).
                </p>
              )}
              <Link
                href="/checkout"
                className="block w-full text-center bg-[#6d4014] hover:bg-[#4e2e0e] text-white py-3 rounded-xl font-medium"
              >
                ادامه فرآیند خرید
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
