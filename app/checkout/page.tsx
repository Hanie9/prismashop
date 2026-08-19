"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { products } from "../data/products";
import { useCart } from "../components/CartProvider";

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

function createTrackingCode() {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PRS-${random.toString()}`;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const [trackingCode, setTrackingCode] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const rows = useMemo(
    () =>
      items
        .map((item) => ({ ...item, product: products.find((product) => product.id === item.id) }))
        .filter((row) => Boolean(row.product)),
    [items],
  );

  const subtotal = rows.reduce((sum, row) => sum + (row.product?.price ?? 0) * row.qty, 0);
  const shipping = subtotal > 500000 ? 0 : 60000;
  const total = subtotal + shipping;

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof CheckoutForm, string>> = {};

    if (!form.firstName.trim()) nextErrors.firstName = "نام را وارد کنید.";
    if (!form.lastName.trim()) nextErrors.lastName = "نام خانوادگی را وارد کنید.";
    if (!/^09\d{9}$/.test(form.phone.trim())) nextErrors.phone = "شماره تماس معتبر وارد کنید.";
    if (!form.province.trim()) nextErrors.province = "استان را وارد کنید.";
    if (!form.city.trim()) nextErrors.city = "شهر را وارد کنید.";
    if (!form.address.trim() || form.address.trim().length < 10) nextErrors.address = "آدرس کامل را وارد کنید.";
    if (!/^\d{10}$/.test(form.postalCode.trim())) nextErrors.postalCode = "کد پستی ۱۰ رقمی وارد کنید.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = () => {
    if (!validateForm()) return;

    const code = createTrackingCode();
    setTrackingCode(code);
    setSubmittedName(`${form.firstName} ${form.lastName}`);
    setCopyMessage("");
    clearCart();
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
              {submittedName} عزیز، سفارش شما ثبت شد. کد پیگیری زیر را نگه دارید تا در صورت نیاز وضعیت سفارش را پیگیری کنید.
            </p>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="inline-flex items-center justify-center rounded-2xl bg-[#fdf1df] border border-[#e8cfa8] px-6 py-4 text-[#6d4014] font-black text-xl">
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
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#2e1a08] mb-2">تکمیل سفارش</h1>
          <p className="text-[#6d4014]">اطلاعات گیرنده و آدرس را کامل کنید تا سفارش شما ثبت شود.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#e8cfa8] rounded-[32px] p-5 md:p-7">
            <h2 className="text-xl font-bold text-[#2e1a08] mb-5">اطلاعات خریدار</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: "firstName", label: "نام", placeholder: "نام" },
                { key: "lastName", label: "نام خانوادگی", placeholder: "نام خانوادگی" },
                { key: "phone", label: "شماره تماس", placeholder: "09123456789" },
                { key: "postalCode", label: "کد پستی", placeholder: "کد پستی ۱۰ رقمی" },
                { key: "province", label: "استان", placeholder: "استان" },
                { key: "city", label: "شهر", placeholder: "شهر" },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="block text-sm font-medium text-[#4e2e0e] mb-2">{field.label}</span>
                  <input
                    value={form[field.key as keyof CheckoutForm]}
                    onChange={(e) => {
                      const key = field.key as keyof CheckoutForm;
                      setForm((prev) => ({ ...prev, [key]: e.target.value }));
                      setErrors((prev) => ({ ...prev, [key]: "" }));
                    }}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-3 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20]"
                  />
                  {errors[field.key as keyof CheckoutForm] && (
                    <span className="text-xs text-red-600 mt-1 block">{errors[field.key as keyof CheckoutForm]}</span>
                  )}
                </label>
              ))}
            </div>

            <label className="block mt-4">
              <span className="block text-sm font-medium text-[#4e2e0e] mb-2">آدرس کامل</span>
              <textarea
                value={form.address}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, address: e.target.value }));
                  setErrors((prev) => ({ ...prev, address: "" }));
                }}
                placeholder="آدرس دقیق، پلاک، واحد و توضیحات لازم برای ارسال"
                rows={4}
                className="w-full rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-3 text-sm text-[#2e1a08] focus:outline-none focus:border-[#a96c20]"
              />
              {errors.address && <span className="text-xs text-red-600 mt-1 block">{errors.address}</span>}
            </label>

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

          <div className="bg-white border border-[#e8cfa8] rounded-[32px] p-5 h-fit">
            <h2 className="font-bold text-[#2e1a08] mb-4">خلاصه سفارش</h2>

            <div className="space-y-3 mb-4">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 text-sm border-b border-[#f5e9d5] pb-3">
                  <div>
                    <div className="font-medium text-[#4e2e0e]">{row.product?.name}</div>
                    <div className="text-xs text-[#a96c20]">تعداد: {row.qty.toLocaleString("fa-IR")}</div>
                  </div>
                  <div className="font-bold text-[#2e1a08]">
                    {(((row.product?.price ?? 0) * row.qty)).toLocaleString("fa-IR")} تومان
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between"><span>جمع جزء</span><span>{subtotal.toLocaleString("fa-IR")} تومان</span></div>
              <div className="flex justify-between"><span>هزینه ارسال</span><span>{shipping === 0 ? "رایگان" : `${shipping.toLocaleString("fa-IR")} تومان`}</span></div>
              <div className="flex justify-between font-bold text-[#2e1a08] border-t pt-3"><span>مبلغ نهایی</span><span>{total.toLocaleString("fa-IR")} تومان</span></div>
            </div>

            <button
              onClick={submitOrder}
              className="w-full bg-[#6d4014] hover:bg-[#4e2e0e] text-white py-3 rounded-2xl font-medium"
            >
              ثبت نهایی سفارش
            </button>

            <p className="text-xs text-[#a96c20] mt-3 leading-6">
              پس از ثبت سفارش، کد پیگیری برای شما نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
