"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[80vh] bg-[#faf6ee] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e8cfa8] rounded-3xl p-8">
        <h1 className="text-2xl font-black text-[#2e1a08] mb-2">بازیابی رمز عبور</h1>
        <p className="text-sm text-[#a96c20] mb-6">
          ایمیل یا شماره موبایل خود را وارد کنید تا لینک بازیابی ارسال شود.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-4"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-[#e8cfa8] rounded-xl px-4 py-3 text-sm bg-[#fdf8f3] focus:outline-none focus:border-[#a96c20]"
            placeholder="ایمیل یا شماره موبایل"
          />
          <button
            type="submit"
            className="w-full bg-[#6d4014] hover:bg-[#4e2e0e] text-white py-3 rounded-xl transition-colors"
          >
            ارسال لینک بازیابی
          </button>
        </form>

        {submitted && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mt-4">
            در صورت وجود حساب کاربری، لینک بازیابی برای شما ارسال شد.
          </p>
        )}

        <Link href="/auth/login" className="inline-block mt-6 text-sm text-[#a96c20] hover:text-[#6d4014]">
          بازگشت به ورود
        </Link>
      </div>
    </div>
  );
}
