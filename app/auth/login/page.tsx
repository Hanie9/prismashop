"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

const USERS_STORAGE_KEY = "prismashop-users";
const SESSION_STORAGE_KEY = "prismashop-session";

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email") ?? "";
    const registered = params.get("registered") === "1";

    setForm((current) => ({ ...current, email }));
    setJustRegistered(registered);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("لطفاً ایمیل/موبایل و رمز عبور را وارد کنید.");
      return;
    }

    try {
      setIsSubmitting(true);
      const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
      const users = rawUsers ? JSON.parse(rawUsers) : [];

      const matchedUser = users.find(
        (user: { email: string; mobile: string; password: string; firstName?: string; lastName?: string }) =>
          (user.email === form.email.trim().toLowerCase() || user.mobile === form.email.trim()) &&
          user.password === form.password
      );

      if (!matchedUser) {
        setError("اطلاعات ورود صحیح نیست.");
        setIsSubmitting(false);
        return;
      }

      window.localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          email: matchedUser.email,
          fullName: `${matchedUser.firstName ?? ""} ${matchedUser.lastName ?? ""}`.trim(),
          remember: form.remember,
          loggedInAt: new Date().toISOString(),
        })
      );
      window.dispatchEvent(new Event("prismashop-auth-change"));

      router.push("/");
      router.refresh();
    } catch {
      setError("ورود انجام نشد. لطفاً دوباره تلاش کنید.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/calligraphy/calligraphy-8.jpg"
        alt="حروف کالیگرافی چوبی پریسما شاپ"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,169,106,0.24),transparent_28%),linear-gradient(135deg,rgba(16,10,4,0.86),rgba(46,26,8,0.72),rgba(16,10,4,0.9))]" />

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
              <div className="text-xs text-[#e3c091]">دکور و حروف کالیگرافی</div>
            </div>
          </Link>

          <div className="hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-[#f1d5ad] backdrop-blur-md md:block">
            هنر کالیگرافی روی چوب
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center py-4 lg:py-0">
          <div className="grid w-full items-center gap-8 lg:gap-12 xl:gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden lg:block">
              <span className="mb-5 inline-flex rounded-full border border-[#d4a96a]/40 bg-[#d4a96a]/15 px-3 py-1 text-xs font-medium text-[#f1d5ad] backdrop-blur-sm">
                ورود امن و سریع
              </span>
              <h2 className="mb-4 text-3xl xl:text-4xl 2xl:text-5xl font-black leading-[1.35] text-white">
                با یک تجربه
                <br />
                مدرن وارد شوید
              </h2>
              <p className="max-w-md text-sm leading-8 text-[#efcea3] xl:text-base">
                حساب کاربری خود را باز کنید، سفارش‌ها را پیگیری کنید و سریع‌تر به محصولات چوبی و کالیگرافی مورد علاقه‌تان برسید.
              </p>
            </div>

            <div className="w-full max-w-md justify-self-center lg:justify-self-end">
              <div className="rounded-[30px] border border-white/15 bg-white/12 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
                <div className="mb-7 text-center">
                <h1 className="mb-2 text-xl sm:text-2xl font-black text-white">ورود به حساب</h1>
                <p className="text-sm text-[#f0d3aa]">
                  حساب ندارید؟{" "}
                  <Link href="/auth/signup" className="font-bold text-white hover:text-[#f6dfbc] hover:underline">
                    ثبت‌نام کنید
                  </Link>
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {justRegistered && (
                  <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50">
                    ثبت‌نام با موفقیت انجام شد. حالا با اطلاعات خود وارد شوید.
                  </div>
                )}
                <div>
                  <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                    ایمیل یا شماره موبایل
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="text"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com"
                      className="h-12 w-full rounded-2xl border border-white/15 bg-white/14 pr-11 pl-4 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:border-[#f1d5ad]/60 focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15"
                    />
                    <svg className="absolute right-3.5 top-3.5 text-[#f0d3aa]" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="h-12 w-full rounded-2xl border border-white/15 bg-white/14 pr-11 pl-11 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:border-[#f1d5ad]/60 focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15"
                    />
                    <svg className="absolute right-3.5 top-3.5 text-[#f0d3aa]" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                      className="h-4 w-4 rounded accent-[#6d4014]"
                    />
                    <span className="text-sm text-[#f7ead3]">مرا به خاطر بسپار</span>
                  </label>
                  <Link href="/auth/forgot" className="text-sm font-medium text-[#f0d3aa] hover:text-white">
                    فراموشی رمز؟
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] shadow-[0_10px_24px_rgba(15,10,5,0.25)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "در حال ورود..." : "ورود به حساب"}
                </button>
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
