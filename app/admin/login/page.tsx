"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ADMIN_CREDENTIALS,
  getAdminSession,
  isAdminCredentials,
  setAdminSession,
} from "../../lib/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState<string>(ADMIN_CREDENTIALS.password);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getAdminSession()) router.replace("/admin");
  }, [router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (isAdminCredentials(email, password)) {
      setAdminSession();
      router.replace("/admin");
      return;
    }

    setError("ایمیل یا رمز عبور اشتباه است.");
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/calligraphy/calligraphy-3.jpg"
        alt="پنل مدیریت پریسما شاپ"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,169,106,0.22),transparent_30%),linear-gradient(145deg,rgba(16,10,4,0.9),rgba(46,26,8,0.76),rgba(16,10,4,0.92))]" />

      <div className="relative z-10 flex min-h-screen flex-col p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none" />
                <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-black text-white">پریسما شاپ</div>
              <div className="text-xs text-[#e3c091]">پنل مدیریت فروشگاه</div>
            </div>
          </Link>

          <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-[#f1d5ad] backdrop-blur-md md:block">
            دسترسی مدیر
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center py-4 lg:py-0">
          <div className="grid w-full items-center gap-8 lg:gap-12 xl:gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden lg:block">
              <span className="mb-5 inline-flex rounded-full border border-[#d4a96a]/40 bg-[#d4a96a]/15 px-3 py-1 text-xs font-medium text-[#f1d5ad] backdrop-blur-sm">
                کنترل کامل فروشگاه
              </span>
              <h2 className="mb-4 text-3xl xl:text-4xl 2xl:text-5xl font-black leading-[1.35] text-white">
                مدیریت هوشمند
                <br />
                پریسما شاپ
              </h2>
              <p className="max-w-md text-sm leading-8 text-[#efcea3] xl:text-base">
                محصولات، موجودی، سفارش‌ها، مشتریان و تخفیف‌ها را از یک پنل مدرن و یکپارچه کنترل کنید.
              </p>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {[
                  { title: "محصولات", desc: "افزودن و ویرایش" },
                  { title: "سفارش‌ها", desc: "پیگیری لحظه‌ای" },
                  { title: "موجودی", desc: "هشدار کمبود" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 backdrop-blur-sm"
                  >
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-[11px] text-[#efcea3]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-md justify-self-center lg:justify-self-end">
              <div className="rounded-[30px] border border-white/15 bg-white/12 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a96a]/35 bg-[#d4a96a]/15">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1d5ad" strokeWidth={1.8}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h1 className="mb-2 text-xl sm:text-2xl font-black text-white">ورود مدیر</h1>
                  <p className="text-sm text-[#f0d3aa]">
                    مشتری هستید؟{" "}
                    <Link href="/auth/login" className="font-bold text-white hover:text-[#f6dfbc] hover:underline">
                      ورود کاربران
                    </Link>
                  </p>
                </div>

                <form className="space-y-5" onSubmit={onSubmit}>
                  <div>
                    <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                      ایمیل مدیر
                    </label>
                    <div className="relative">
                      <input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@prismashop.ir"
                        autoComplete="username"
                        dir="ltr"
                        className="h-12 w-full rounded-2xl border border-white/15 bg-white/14 pr-11 pl-4 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:border-[#f1d5ad]/60 focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15"
                      />
                      <svg
                        className="absolute right-3.5 top-3.5 text-[#f0d3aa]"
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                      رمز عبور
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="رمز عبور مدیر"
                        autoComplete="current-password"
                        dir="ltr"
                        className="h-12 w-full rounded-2xl border border-white/15 bg-white/14 pr-11 pl-11 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:border-[#f1d5ad]/60 focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15"
                      />
                      <svg
                        className="absolute right-3.5 top-3.5 text-[#f0d3aa]"
                        width="18"
                        height="18"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute left-3.5 top-3.5 text-[#f0d3aa] hover:text-white"
                        aria-label={showPass ? "مخفی کردن رمز" : "نمایش رمز"}
                      >
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          {showPass ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#d4a96a]/25 bg-[#d4a96a]/10 px-4 py-3 text-xs leading-6 text-[#f1d5ad]">
                    فیلدها از قبل پر شده‌اند؛ فقط روی «ورود به پنل» بزنید.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] shadow-[0_10px_24px_rgba(15,10,5,0.25)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "در حال ورود..." : "ورود به پنل"}
                  </button>

                  <p className="text-center text-xs leading-6 text-[#f0d3aa]/90">
                    بازگشت به{" "}
                    <Link href="/" className="font-bold text-white underline">
                      فروشگاه
                    </Link>
                  </p>

                  {error && (
                    <div className="rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
