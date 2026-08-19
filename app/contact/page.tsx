"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-black text-[#2e1a08] mb-3">تماس با ما</h1>
        <p className="text-[#6d4014] mb-8">سوال یا نیاز به مشاوره دارید؟ فرم زیر را پر کنید تا سریع پاسخ بدهیم.</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#e8cfa8] rounded-3xl p-7">
            <form
              className="grid md:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]" placeholder="نام" required />
              <input className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]" placeholder="نام خانوادگی" required />
              <input type="tel" className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]" placeholder="شماره موبایل" required />
              <input type="email" className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]" placeholder="ایمیل" required />
              <input className="md:col-span-2 border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3]" placeholder="موضوع پیام" required />
              <textarea className="md:col-span-2 border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3] min-h-36" placeholder="متن پیام" required />
              <button className="md:col-span-2 bg-[#6d4014] hover:bg-[#4e2e0e] text-white rounded-xl py-3 font-medium">
                ارسال پیام
              </button>
            </form>
            {sent && (
              <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                پیام شما با موفقیت ثبت شد. تیم پشتیبانی به‌زودی با شما تماس می‌گیرد.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
              <h2 className="font-bold text-[#4e2e0e] mb-2">پشتیبانی تلفنی</h2>
              <a href="tel:+982112345678" className="text-[#6d4014] hover:text-[#a96c20]">۰۲۱-۱۲۳۴۵۶۷۸</a>
            </div>
            <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
              <h2 className="font-bold text-[#4e2e0e] mb-2">ایمیل</h2>
              <a href="mailto:info@prismashop.ir" className="text-[#6d4014] hover:text-[#a96c20]">info@prismashop.ir</a>
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
