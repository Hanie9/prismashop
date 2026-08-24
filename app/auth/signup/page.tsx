"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useAuth } from "../../components/SessionProvider";
import { api, setSessionPersist, setStoredSessionId } from "../../lib/api";
import { isValidEmail, isValidIranMobile, isValidPassword } from "../../lib/validation";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  password?: string;
};

const inputBase =
  "h-12 w-full rounded-2xl border bg-white/14 px-4 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:outline-none focus:ring-4";
const inputOk = "border-white/15 focus:border-[#f1d5ad]/60 focus:ring-[#d4a96a]/15";
const inputBad = "border-red-400/70 focus:border-red-300 focus:ring-red-400/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-200">{message}</p>;
}

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    password: "",
  });

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "ضعیف", "متوسط", "خوب", "عالی"][strength];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"][strength];

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep1 = (): boolean => {
    const next: FieldErrors = {};
    if (!form.firstName.trim()) next.firstName = "نام را وارد کنید.";
    if (!form.lastName.trim()) next.lastName = "نام خانوادگی را وارد کنید.";
    if (!form.mobile.trim()) {
      next.mobile = "شماره موبایل را وارد کنید.";
    } else if (!isValidIranMobile(form.mobile)) {
      next.mobile = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود (مثال: 09123456789).";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep2 = (): boolean => {
    const next: FieldErrors = {};
    if (!form.email.trim()) {
      next.email = "ایمیل را وارد کنید.";
    } else if (!isValidEmail(form.email)) {
      next.email = "ایمیل معتبر وارد کنید (مثال: name@example.com).";
    }
    if (!form.password) {
      next.password = "رمز عبور را وارد کنید.";
    } else if (!isValidPassword(form.password)) {
      next.password = "رمز عبور باید حداقل ۸ کاراکتر باشد.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (!validateStep2()) return;

    try {
      setIsSubmitting(true);
      setSessionPersist(true);
      const session = await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setStoredSessionId(session.sessionId);
      await refresh();
      setSuccess("حساب شما با موفقیت ساخته شد. در حال انتقال...");
      const rawNext = new URLSearchParams(window.location.search).get("next");
      const next =
        rawNext === "/checkout" || rawNext?.startsWith("/checkout?")
          ? "/cart"
          : rawNext;
      window.setTimeout(() => {
        router.push(next && next.startsWith("/") ? next : "/");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/calligraphy/calligraphy-7.jpg"
        alt="حروف کالیگرافی چوبی"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,169,106,0.28),transparent_24%),linear-gradient(135deg,rgba(27,16,6,0.9),rgba(61,35,13,0.78),rgba(20,11,4,0.9))]" />

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

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-[#f1d5ad] backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
          >
            بازگشت
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center py-4 lg:py-0">
          <div className="grid w-full items-center gap-8 lg:gap-12 xl:gap-16 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="hidden lg:block">
              <span className="mb-5 inline-flex rounded-full border border-[#d4a96a]/40 bg-[#d4a96a]/15 px-3 py-1 text-xs font-medium text-[#f1d5ad] backdrop-blur-sm">
                حساب جدید، تجربه بهتر
              </span>
              <h2 className="mb-4 text-3xl xl:text-4xl 2xl:text-5xl font-black leading-[1.35] text-white">
                عضویت در پریسما
                <br />
                با پس‌زمینه‌ای هنری
              </h2>
              <ul className="space-y-3 text-sm leading-7 text-[#efcea3] xl:text-base">
                {["تخفیف‌های ویژه اعضا", "پیگیری آسان سفارش", "پشتیبانی سریع‌تر"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[#d4a96a]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full max-w-lg justify-self-center lg:justify-self-end">
              <div className="rounded-[30px] border border-white/15 bg-white/12 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-xl sm:text-2xl font-black text-white">ایجاد حساب کاربری</h1>
                  <p className="text-sm text-[#f0d3aa]">
                    قبلاً ثبت‌نام کرده‌اید؟{" "}
                    <Link href="/auth/login" className="font-bold text-white hover:text-[#f6dfbc] hover:underline">
                      وارد شوید
                    </Link>
                  </p>
                </div>

                <div className="mb-7 flex items-center justify-center gap-2">
                  {[1, 2].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          step >= s ? "bg-[#f3ddbb] text-[#3c220c]" : "bg-white/10 text-[#f0d3aa]"
                        }`}
                      >
                        {step > s ? (
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          s
                        )}
                      </div>
                      {s < 2 && (
                        <div className={`h-0.5 w-14 transition-all ${step > s ? "bg-[#f3ddbb]" : "bg-white/15"}`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {step === 1 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="signup-firstname" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                            نام
                          </label>
                          <input
                            id="signup-firstname"
                            type="text"
                            value={form.firstName}
                            onChange={(e) => {
                              setForm({ ...form, firstName: e.target.value });
                              clearFieldError("firstName");
                            }}
                            placeholder="نام"
                            className={`${inputBase} ${fieldErrors.firstName ? inputBad : inputOk}`}
                            aria-invalid={Boolean(fieldErrors.firstName)}
                          />
                          <FieldError message={fieldErrors.firstName} />
                        </div>
                        <div>
                          <label htmlFor="signup-lastname" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                            نام خانوادگی
                          </label>
                          <input
                            id="signup-lastname"
                            type="text"
                            value={form.lastName}
                            onChange={(e) => {
                              setForm({ ...form, lastName: e.target.value });
                              clearFieldError("lastName");
                            }}
                            placeholder="نام خانوادگی"
                            className={`${inputBase} ${fieldErrors.lastName ? inputBad : inputOk}`}
                            aria-invalid={Boolean(fieldErrors.lastName)}
                          />
                          <FieldError message={fieldErrors.lastName} />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="signup-mobile" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                          شماره موبایل
                        </label>
                        <div className="relative">
                          <input
                            id="signup-mobile"
                            type="tel"
                            inputMode="numeric"
                            value={form.mobile}
                            onChange={(e) => {
                              setForm({ ...form, mobile: e.target.value });
                              clearFieldError("mobile");
                            }}
                            onBlur={() => {
                              if (form.mobile.trim() && !isValidIranMobile(form.mobile)) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  mobile:
                                    "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود (مثال: 09123456789).",
                                }));
                              }
                            }}
                            placeholder="09123456789"
                            className={`${inputBase} pr-11 ${fieldErrors.mobile ? inputBad : inputOk}`}
                            dir="ltr"
                            aria-invalid={Boolean(fieldErrors.mobile)}
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
                            <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <FieldError message={fieldErrors.mobile} />
                      </div>

                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] shadow-[0_10px_24px_rgba(15,10,5,0.25)] transition-colors hover:bg-white"
                      >
                        ادامه
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                          ایمیل
                        </label>
                        <div className="relative">
                          <input
                            id="signup-email"
                            type="email"
                            value={form.email}
                            onChange={(e) => {
                              setForm({ ...form, email: e.target.value });
                              clearFieldError("email");
                            }}
                            onBlur={() => {
                              if (form.email.trim() && !isValidEmail(form.email)) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  email: "ایمیل معتبر وارد کنید (مثال: name@example.com).",
                                }));
                              }
                            }}
                            placeholder="example@email.com"
                            className={`${inputBase} pr-11 ${fieldErrors.email ? inputBad : inputOk}`}
                            dir="ltr"
                            aria-invalid={Boolean(fieldErrors.email)}
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
                        <FieldError message={fieldErrors.email} />
                      </div>

                      <div>
                        <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                          رمز عبور
                        </label>
                        <div className="relative">
                          <input
                            id="signup-password"
                            type={showPass ? "text" : "password"}
                            minLength={8}
                            maxLength={128}
                            value={form.password}
                            onChange={(e) => {
                              setForm({ ...form, password: e.target.value });
                              clearFieldError("password");
                            }}
                            onBlur={() => {
                              if (form.password && !isValidPassword(form.password)) {
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  password: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
                                }));
                              }
                            }}
                            placeholder="حداقل ۸ کاراکتر"
                            className={`${inputBase} pr-11 pl-11 ${fieldErrors.password ? inputBad : inputOk}`}
                            aria-invalid={Boolean(fieldErrors.password)}
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
                        <FieldError message={fieldErrors.password} />
                        {form.password && (
                          <div className="mt-2">
                            <div className="mb-1 flex gap-1">
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : "bg-[#e8cfa8]"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-[#f0d3aa]">قدرت رمز: {strengthLabel}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFieldErrors({});
                            setError("");
                            setStep(1);
                          }}
                          className="flex-1 rounded-2xl border-2 border-white/15 bg-white/8 py-3 text-sm font-medium text-[#f7ead3] transition-colors hover:border-[#f1d5ad]/50"
                        >
                          بازگشت
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 rounded-2xl bg-[#f3ddbb] py-3 text-sm font-bold text-[#3c220c] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? "در حال ثبت‌نام..." : "ثبت‌نام"}
                        </button>
                      </div>
                    </>
                  )}

                  {(error || success) && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-sm ${
                        error
                          ? "border-red-300/50 bg-red-500/10 text-red-100"
                          : "border-emerald-300/40 bg-emerald-500/10 text-emerald-50"
                      }`}
                    >
                      {error || success}
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
