"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import BackLink from "../components/BackLink";
import { isValidEmail, isValidIranMobile } from "../lib/validation";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSent(false);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    if (!isValidIranMobile(form.mobile)) {
      setError("شماره موبایل معتبر وارد کنید (مثال: 09123456789).");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("ایمیل معتبر وارد کنید.");
      return;
    }
    if (!form.subject.trim() || !form.message.trim()) {
      setError("موضوع و متن پیام را وارد کنید.");
      return;
    }

    setSent(true);
    setForm({
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-10 sm:py-14">
        <BackLink href="/" className="mb-4">
          بازگشت به صفحه اصلی
        </BackLink>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-3">تماس با ما</h1>
        <p className="text-[#6d4014] mb-8 text-sm sm:text-base">
          سوال یا نیاز به مشاوره دارید؟ فرم زیر را پر کنید تا سریع پاسخ بدهیم.
        </p>

        <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
          <div className="lg:col-span-2 bg-white border border-[#e8cfa8] rounded-3xl p-5 sm:p-7">
            <form className="grid sm:grid-cols-2 gap-4" onSubmit={handleSubmit} noValidate>
              <input
                className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]"
                placeholder="نام"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <input
                className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]"
                placeholder="نام خانوادگی"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
              <input
                type="tel"
                inputMode="numeric"
                pattern="09[0-9]{9}"
                className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]"
                placeholder="شماره موبایل"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                dir="ltr"
                required
              />
              <input
                type="email"
                className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]"
                placeholder="ایمیل"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                dir="ltr"
                required
              />
              <input
                className="sm:col-span-2 border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]"
                placeholder="موضوع پیام"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
              <textarea
                className="sm:col-span-2 border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3] min-h-36"
                placeholder="متن پیام"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
              {error && (
                <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="sm:col-span-2 bg-[#6d4014] hover:bg-[#4e2e0e] text-white rounded-xl py-3 font-medium"
              >
                ارسال پیام
              </button>
            </form>
            {sent && (
              <div className="mt-4 space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">
                  پیام شما با موفقیت ثبت شد. تیم پشتیبانی به‌زودی با شما تماس می‌گیرد.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="text-sm font-medium text-[#8a5419] hover:underline"
                  >
                    ارسال پیام جدید
                  </button>
                  <Link href="/" className="text-sm font-medium text-[#6d4014] hover:underline">
                    بازگشت به صفحه اصلی
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
              <h2 className="font-bold text-[#4e2e0e] mb-2">پشتیبانی تلفنی</h2>
              <a href="tel:+982112345678" className="text-[#6d4014] hover:text-[#a96c20]">
                ۰۲۱-۱۲۳۴۵۶۷۸
              </a>
            </div>
            <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
              <h2 className="font-bold text-[#4e2e0e] mb-2">ایمیل</h2>
              <a href="mailto:info@prismashop.ir" className="text-[#6d4014] hover:text-[#a96c20]">
                info@prismashop.ir
              </a>
            </div>
            <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
              <h2 className="font-bold text-[#4e2e0e] mb-2">آدرس</h2>
              <p className="text-sm text-[#6d4014]">تهران، خیابان ولیعصر، پلاک ۱۲۳</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
