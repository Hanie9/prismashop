"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../components/SessionProvider";
import { useCart } from "../components/CartProvider";
import PageLoader from "../components/PageLoader";
import PriceText from "../components/PriceText";
import SearchableSelect from "../components/SearchableSelect";
import { useShop } from "../components/ShopProvider";
import { api } from "../lib/api";
import { getCitiesForProvince, IRAN_PROVINCE_NAMES } from "../lib/iran-locations";
import { isValidIranMobile } from "../lib/validation";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  notes: string;
};

const FORM_STORAGE_KEY = "checkout_form_draft";

const initialForm: CheckoutForm = {
  firstName: "",
  lastName: "",
  phone: "",
  province: "",
  city: "",
  address: "",
  postalCode: "",
  notes: "",
};

function loadFormDraft(): CheckoutForm {
  try {
    const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
    if (raw) return { ...initialForm, ...JSON.parse(raw) };
  } catch {}
  return initialForm;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { ready, isLoggedIn, customer, admin, refresh } = useAuth();
  const { items, hydrated: cartHydrated, clearCart, getAvailableStock } = useCart();
  const { getProduct, placeOrder, refreshShop } = useShop();
  const [form, setForm] = useState<CheckoutForm>(loadFormDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [trackingCode, setTrackingCode] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [stockError, setStockError] = useState("");
  const [couponDraft, setCouponDraft] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const profileFilled = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/");
    }
  }, [ready, isLoggedIn, router]);

  useEffect(() => {
    if (!trackingCode) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [trackingCode]);

  // Persist form to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  // Pre-fill from profile only when the draft is still empty (user hasn't typed anything)
  useEffect(() => {
    if (profileFilled.current) return;
    if (customer) {
      profileFilled.current = true;
      setForm((f) => ({
        firstName: f.firstName || customer.firstName || "",
        lastName: f.lastName || customer.lastName || "",
        phone: f.phone || customer.mobile || "",
        province: f.province || customer.province || "",
        city: f.city || customer.city || "",
        address: f.address || customer.address || "",
        postalCode: f.postalCode || customer.postalCode || "",
        notes: f.notes,
      }));
    } else if (admin) {
      profileFilled.current = true;
      setForm((f) => ({
        ...f,
        firstName: f.firstName || admin.firstName || "مدیر",
        lastName: f.lastName || admin.lastName || "",
      }));
    }
  }, [customer, admin]);

  const clearField = (key: "address" | "postalCode") => {
    setForm((prev) => ({ ...prev, [key]: "" }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const cityOptions = useMemo(
    () => getCitiesForProvince(form.province),
    [form.province],
  );

  const rows = useMemo(
    () =>
      items
        .map((item) => ({ ...item, product: getProduct(item.id) }))
        .filter((row) => Boolean(row.product)),
    [items, getProduct],
  );

  const subtotal = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.qty, 0);
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (!appliedCode || subtotal <= 0) {
      if (!appliedCode) setDiscount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.validateCoupon(appliedCode, subtotal);
        if (cancelled) return;
        if (res.valid) {
          setDiscount(res.discount);
          setCouponMessage(`کد تخفیف ${res.coupon?.code || appliedCode} اعمال شد`);
          setCouponError("");
        } else {
          setDiscount(0);
          setAppliedCode("");
          setCouponDraft("");
          setCouponMessage("");
          setCouponError(res.message || "کد تخفیف دیگر معتبر نیست.");
        }
      } catch {
        if (!cancelled) {
          setDiscount(0);
          setAppliedCode("");
          setCouponMessage("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedCode, subtotal]);

  const applyCoupon = async () => {
    const code = couponDraft.trim();
    if (!code) {
      setCouponError("کد تخفیف را وارد کنید.");
      setCouponMessage("");
      return;
    }
    setApplyingCoupon(true);
    setCouponError("");
    setCouponMessage("");
    try {
      const res = await api.validateCoupon(code, subtotal);
      if (!res.valid) {
        setDiscount(0);
        setAppliedCode("");
        setCouponError(res.message || "کد تخفیف معتبر نیست.");
        return;
      }
      const finalCode = res.coupon?.code || code.toUpperCase();
      setAppliedCode(finalCode);
      setCouponDraft(finalCode);
      setDiscount(res.discount);
      setCouponMessage(`کد تخفیف ${finalCode} اعمال شد`);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "بررسی کد ناموفق بود.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCode("");
    setCouponDraft("");
    setDiscount(0);
    setCouponMessage("");
    setCouponError("");
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof CheckoutForm, string>> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "نام را وارد کنید.";
    if (!form.lastName.trim()) nextErrors.lastName = "نام خانوادگی را وارد کنید.";
    if (!isValidIranMobile(form.phone)) nextErrors.phone = "شماره موبایل معتبر وارد کنید (مثال: 09123456789).";
    if (!form.province.trim()) nextErrors.province = "استان را انتخاب کنید.";
    if (!form.city.trim()) nextErrors.city = "شهر را انتخاب کنید.";
    if (!form.address.trim() || form.address.trim().length < 10)
      nextErrors.address = "آدرس کامل را وارد کنید.";
    if (!/^\d{10}$/.test(form.postalCode.trim()))
      nextErrors.postalCode = "کد پستی ۱۰ رقمی وارد کنید.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = async () => {
    if (!validateForm() || submitting) return;

    const overStock = rows.find((row) => row.qty > getAvailableStock(row.id));
    if (overStock) {
      setStockError(
        `موجودی «${overStock.product?.name}» کافی نیست. حداکثر ${getAvailableStock(overStock.id).toLocaleString("fa-IR")} عدد.`,
      );
      return;
    }

    const out = rows.find((row) => getAvailableStock(row.id) <= 0);
    if (out) {
      setStockError(`محصول «${out.product?.name}» ناموجود شده است.`);
      return;
    }

    setSubmitting(true);
    setStockError("");
    try {
      await refreshShop();
      const check = await api.validateCart(
        rows.map((row) => ({ productId: row.id, qty: row.qty })),
      );
      if (!check.ok) {
        const bad = check.lines.find((l) => !l.ok);
        throw new Error(
          bad?.reason === "max_stock"
            ? `موجودی کافی نیست (حداکثر ${bad.availableStock.toLocaleString("fa-IR")}).`
            : "برخی محصولات ناموجود شده‌اند.",
        );
      }

      const order = await placeOrder({
        customer: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          province: form.province.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          postalCode: form.postalCode.trim(),
          notes: form.notes.trim() || undefined,
        },
        items: rows.map((row) => ({
          productId: row.id,
          qty: row.qty,
        })),
        couponCode: appliedCode || undefined,
      });
      setTrackingCode(order.trackingCode);
      setSubmittedName(`${form.firstName} ${form.lastName}`);
      setCopyMessage("");
      clearCart();
      void refresh();
      clearCoupon();
      try { sessionStorage.removeItem(FORM_STORAGE_KEY); } catch {}
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch (err) {
      setStockError(
        err instanceof Error ? err.message : "ثبت سفارش انجام نشد. دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyTrackingCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopyMessage("کد پیگیری کپی شد.");
    } catch {
      setCopyMessage("کپی انجام نشد. دوباره تلاش کنید.");
    }
  };

  if (trackingCode) {
    return (
      <div className="min-h-screen bg-[#faf6ee]">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className="bg-white border border-[#e8cfa8] rounded-[32px] p-8 md:p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-[#2e1a08] mb-3">سفارش شما با موفقیت ثبت شد</h1>
            <p className="text-[#6d4014] leading-7 mb-6">
              {submittedName} عزیز، سفارش شما ثبت شد و در پنل ادمین قابل مشاهده است. کد پیگیری را نگه دارید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center justify-center rounded-2xl bg-[#fdf1df] border border-[#e8cfa8] px-4 sm:px-6 py-4 text-[#6d4014] font-black text-lg sm:text-xl tracking-wide">
                {trackingCode}
              </div>
              <button
                type="button"
                onClick={copyTrackingCode}
                className="w-12 h-12 rounded-2xl border border-[#e8cfa8] bg-white text-[#6d4014] hover:bg-[#fdf1df] flex items-center justify-center"
                aria-label="کپی کد پیگیری"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            {copyMessage && <p className="text-sm text-[#6d4014] mb-3">{copyMessage}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/products" className="bg-[#6d4014] hover:bg-[#4e2e0e] text-white py-3 rounded-2xl font-medium">
                بازگشت به محصولات
              </Link>
              <Link href="/" className="border border-[#a96c20] text-[#6d4014] py-3 rounded-2xl font-medium">
                بازگشت به صفحه اصلی
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartHydrated) {
    return <PageLoader />;
  }

  if (rows.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf6ee]">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className="bg-white border border-[#e8cfa8] rounded-[32px] p-8 text-center">
            <h1 className="text-2xl font-black text-[#2e1a08] mb-3">سبد خرید شما خالی است</h1>
            <p className="text-[#6d4014] mb-6">برای ادامه فرآیند خرید ابتدا یک یا چند محصول به سبد خرید اضافه کنید.</p>
            <Link href="/products" className="inline-block bg-[#6d4014] text-white px-6 py-3 rounded-2xl">
              مشاهده محصولات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-2">تکمیل سفارش</h1>
          <p className="text-[#6d4014] text-sm sm:text-base">
            اطلاعات گیرنده و آدرس را کامل کنید تا سفارش شما ثبت شود.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
          <div className="lg:col-span-2 bg-white border border-[#e8cfa8] rounded-[32px] p-5 md:p-7">
            <h2 className="text-xl font-bold text-[#2e1a08] mb-5">اطلاعات خریدار</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {(
                [
                  { key: "firstName", label: "نام", placeholder: "نام" },
                  { key: "lastName", label: "نام خانوادگی", placeholder: "نام خانوادگی" },
                  { key: "phone", label: "شماره تماس", placeholder: "09123456789" },
                ] as const
              ).map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 block text-sm font-medium text-[#4e2e0e]">{field.label}</span>
                  <input
                    value={form[field.key]}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }));
                      setErrors((prev) => ({ ...prev, [field.key]: "" }));
                    }}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-3 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20]"
                  />
                  {errors[field.key] && (
                    <span className="mt-1 block text-xs text-red-600">{errors[field.key]}</span>
                  )}
                </label>
              ))}

              <div className="block">
                <span className="mb-2 block text-sm font-medium text-[#4e2e0e]">استان</span>
                <SearchableSelect
                  id="province"
                  value={form.province}
                  options={IRAN_PROVINCE_NAMES}
                  open={openSelect === "province"}
                  onOpenChange={setOpenSelect}
                  placeholder="انتخاب استان"
                  searchPlaceholder="جستجوی استان..."
                  onChange={(province) => {
                    setForm((prev) => ({
                      ...prev,
                      province,
                      city: getCitiesForProvince(province).includes(prev.city) ? prev.city : "",
                    }));
                    setErrors((prev) => ({ ...prev, province: "", city: "" }));
                  }}
                />
                {errors.province && (
                  <span className="mt-1 block text-xs text-red-600">{errors.province}</span>
                )}
              </div>

              <div className="block">
                <span className="mb-2 block text-sm font-medium text-[#4e2e0e]">شهر</span>
                <SearchableSelect
                  id="city"
                  value={form.city}
                  options={cityOptions}
                  open={openSelect === "city"}
                  onOpenChange={setOpenSelect}
                  placeholder={form.province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                  searchPlaceholder="جستجوی شهر..."
                  disabled={!form.province}
                  onChange={(city) => {
                    setForm((prev) => ({ ...prev, city }));
                    setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                />
                {errors.city && (
                  <span className="mt-1 block text-xs text-red-600">{errors.city}</span>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#4e2e0e]">کد پستی</span>
                <div className="relative">
                  <input
                    value={form.postalCode}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, postalCode: e.target.value }));
                      setErrors((prev) => ({ ...prev, postalCode: "" }));
                    }}
                    placeholder="کد پستی ۱۰ رقمی"
                    className={`w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] py-3 ps-5 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20] ${
                      form.postalCode.trim() ? "pl-12" : "pe-4"
                    }`}
                  />
                  {form.postalCode.trim() ? (
                    <button
                      type="button"
                      onClick={() => clearField("postalCode")}
                      aria-label="پاک کردن کد پستی"
                      title="پاک کردن کد پستی"
                      className="absolute left-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#ead7bb] bg-white text-[#8a5419] shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
                {errors.postalCode && (
                  <span className="mt-1 block text-xs text-red-600">{errors.postalCode}</span>
                )}
              </label>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-[#4e2e0e]">آدرس کامل</span>
              <div className="relative">
                <textarea
                  value={form.address}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, address: e.target.value }));
                    setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="آدرس دقیق، پلاک، واحد و توضیحات لازم برای ارسال"
                  rows={4}
                  className={`w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] py-3 ps-5 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20] ${
                    form.address.trim() ? "pl-12" : "pe-4"
                  }`}
                />
                {form.address.trim() ? (
                  <button
                    type="button"
                    onClick={() => clearField("address")}
                    aria-label="پاک کردن آدرس"
                    title="پاک کردن آدرس"
                    className="absolute left-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#ead7bb] bg-white text-[#8a5419] shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
              {errors.address && <span className="mt-1 block text-xs text-red-600">{errors.address}</span>}
            </div>

            <label className="block mt-4">
              <span className="block text-sm font-medium text-[#4e2e0e] mb-2">توضیحات سفارش (اختیاری)</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="مثلاً ساعت مناسب تحویل یا توضیح تکمیلی"
                rows={3}
                className="w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-3 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20]"
              />
            </label>
          </div>

          <div className="bg-white border border-[#e8cfa8] rounded-[32px] p-5 h-fit lg:sticky lg:top-28">
            <h2 className="font-bold text-[#2e1a08] mb-4">خلاصه سفارش</h2>

            <div className="space-y-3 mb-4">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-3 text-sm border-b border-[#f5e9d5] pb-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[#4e2e0e] line-clamp-2">{row.product?.name}</div>
                    <div className="text-xs text-[#a96c20]">
                      تعداد: {row.qty.toLocaleString("fa-IR")}
                    </div>
                  </div>
                  <div className="font-bold text-[#2e1a08] shrink-0 text-left">
                    <PriceText amount={(row.product?.price ?? 0) * row.qty} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span>جمع کل</span>
                <span>
                  <PriceText amount={subtotal} />
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>تخفیف</span>
                  <span>
                    <PriceText amount={discount} />
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#2e1a08] border-t pt-3">
                <span>مبلغ نهایی</span>
                <span>
                  <PriceText amount={total} />
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[#4e2e0e]">کد تخفیف</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={couponDraft}
                  onChange={(e) => {
                    setCouponDraft(e.target.value);
                    setCouponError("");
                  }}
                  placeholder="کد تخفیف را وارد کنید"
                  disabled={Boolean(appliedCode)}
                  dir={couponDraft ? "ltr" : "rtl"}
                  className={`min-w-0 flex-1 rounded-xl border border-[#e8cfa8] bg-[#fffaf5] px-3 py-2.5 text-sm focus:border-[#a96c20] focus:outline-none disabled:opacity-70 ${
                    couponDraft ? "text-left" : "text-right"
                  }`}
                />
                {!appliedCode ? (
                  <button
                    type="button"
                    disabled={applyingCoupon}
                    onClick={() => void applyCoupon()}
                    className="shrink-0 rounded-xl bg-[#6d4014] px-4 py-2.5 text-sm text-white disabled:opacity-60"
                  >
                    {applyingCoupon ? "..." : "اعمال"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="shrink-0 rounded-xl border border-[#ead7bb] px-4 py-2.5 text-sm text-[#6d4014]"
                  >
                    حذف کد
                  </button>
                )}
              </div>
              {couponError && (
                <p className="mt-2 text-xs text-red-600">{couponError}</p>
              )}
              {couponMessage && (
                <p className="mt-2 text-xs font-medium text-green-700">{couponMessage}</p>
              )}
              <p className="mt-2 text-xs text-[#a96c20]">
                <Link href="/account/discounts" className="font-medium text-[#8a5419] hover:underline">
                  مشاهده تخفیف‌ها
                </Link>
              </p>
            </div>

            {stockError && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{stockError}</p>
            )}

            <button
              onClick={submitOrder}
              className="w-full bg-[#6d4014] hover:bg-[#4e2e0e] text-white py-3 rounded-2xl font-medium"
            >
              ثبت نهایی سفارش
            </button>

            <p className="text-xs text-[#a96c20] mt-3 leading-6">
              پس از ثبت، سفارش در پنل ادمین نمایش داده می‌شود و از موجودی کسر می‌گردد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
