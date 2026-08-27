"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import OtpCodeInput from "../../components/OtpCodeInput";
import { useAuth } from "../../components/SessionProvider";
import { useSiteSettings } from "../../components/SiteSettingsProvider";
import { api, setSessionPersist, setStoredSessionId } from "../../lib/api";
import { isValidIranMobile, normalizeIranMobileInput, onlyDigits } from "../../lib/validation";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  mobile?: string;
  code?: string;
};

const inputBase =
  "h-12 w-full rounded-2xl border bg-white/14 px-4 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:outline-none focus:ring-4";
const inputOk = "border-white/15 focus:border-[#f1d5ad]/60 focus:ring-[#d4a96a]/15";
const inputBad = "border-red-400/70 focus:border-red-300 focus:ring-red-400/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-200">{message}</p>;
}

function normalizeMobile(value: string) {
  return normalizeIranMobileInput(value);
}

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<"mobile" | "otp">("mobile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [signupToken, setSignupToken] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const verifyingRef = useRef(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    code: "",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const requestCode = async () => {
    setError("");
    setDevCode(null);
    if (!form.mobile.trim()) {
      setFieldErrors({ mobile: "شماره موبایل را وارد کنید." });
      return;
    }
    if (!isValidIranMobile(form.mobile)) {
      setFieldErrors({ mobile: "شماره باید ۱۱ رقم و با ۰۹ شروع شود." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.requestOtp(normalizeMobile(form.mobile), "signup");
      setForm((prev) => ({ ...prev, code: "" }));
      setPhase("otp");
      setCooldown(60);
      if (res.devCode) setDevCode(res.devCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارسال کد ناموفق بود.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (codeOverride?: string) => {
    if (verifyingRef.current) return;
    const code = onlyDigits(codeOverride ?? form.code);
    setError("");
    if (code.length !== 6) {
      setFieldErrors({ code: "کد ۶ رقمی را کامل وارد کنید." });
      return;
    }

    verifyingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await api.verifyOtpSignup(normalizeMobile(form.mobile), code);
      setSignupToken(res.signupToken);
      setStep(2);
      setPhase("mobile");
      setDevCode(null);
      setFieldErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "تأیید کد ناموفق بود.");
      setForm((prev) => ({ ...prev, code: "" }));
    } finally {
      verifyingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const completeSignup = async () => {
    setError("");
    const next: FieldErrors = {};
    if (!form.firstName.trim()) next.firstName = "نام را وارد کنید.";
    if (!form.lastName.trim()) next.lastName = "نام خانوادگی را وارد کنید.";
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;
    if (!signupToken) {
      setError("تأیید موبایل منقضی شده است. دوباره شروع کنید.");
      setStep(1);
      setPhase("mobile");
      return;
    }

    setIsSubmitting(true);
    try {
      setSessionPersist(true);
      const session = await api.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: normalizeMobile(form.mobile),
        signupToken,
      });
      setStoredSessionId(session.sessionId);
      await refresh();
      setSuccess("حساب شما ساخته شد. در حال انتقال...");
      const rawNext = new URLSearchParams(window.location.search).get("next");
      const nextPath =
        rawNext === "/checkout" || rawNext?.startsWith("/checkout?")
          ? "/cart"
          : rawNext;
      window.setTimeout(() => {
        router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/");
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.",
      );
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess("");
    if (step === 1) {
      if (phase === "mobile") await requestCode();
      else await verifyCode();
      return;
    }
    await completeSignup();
  };

  const stepLabels = [
    { n: 1, label: "تأیید موبایل" },
    { n: 2, label: "مشخصات" },
  ];

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
              <div className="text-lg font-black text-white">{settings?.brandName}</div>
              {settings?.brandSubtitle && (
                <div className="text-xs text-[#e3c091]">{settings.brandSubtitle}</div>
              )}
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
                عضویت در {settings?.brandName}
                <br />
                با کد تأیید موبایل
              </h2>
              <ul className="space-y-3 text-sm leading-7 text-[#efcea3] xl:text-base">
                {["ثبت‌نام سریع با OTP", "پیگیری آسان سفارش", "پشتیبانی سریع‌تر"].map((item) => (
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

                <div className="mb-7 flex items-center justify-center gap-3">
                  {stepLabels.map((s, idx) => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                            step >= s.n ? "bg-[#f3ddbb] text-[#3c220c]" : "bg-white/10 text-[#f0d3aa]"
                          }`}
                        >
                          {step > s.n ? (
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            s.n
                          )}
                        </div>
                        <span
                          className={`text-[11px] ${
                            step >= s.n ? "font-medium text-[#f3ddbb]" : "text-[#f0d3aa]/70"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {idx < stepLabels.length - 1 && (
                        <div className={`mb-5 h-0.5 w-10 sm:w-14 ${step > s.n ? "bg-[#f3ddbb]" : "bg-white/15"}`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {step === 1 ? (
                    phase === "mobile" ? (
                      <>
                        <p className="text-center text-sm text-[#f0d3aa]">
                          ابتدا شماره موبایل را وارد کنید تا کد تأیید ارسال شود.
                        </p>
                        <div>
                          <label htmlFor="signup-mobile" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                            شماره موبایل
                          </label>
                          <div className="relative">
                            <input
                              id="signup-mobile"
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel"
                              value={form.mobile}
                              onChange={(e) => {
                                setForm({ ...form, mobile: normalizeMobile(e.target.value) });
                                clearFieldError("mobile");
                                setError("");
                              }}
                              placeholder="09123456789"
                              className={`${inputBase} pr-11 ${fieldErrors.mobile ? inputBad : inputOk}`}
                              dir="ltr"
                            />
                            <svg
                              className="pointer-events-none absolute right-3.5 top-3.5 text-[#f0d3aa]"
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
                          disabled={isSubmitting || form.mobile.length < 11}
                          className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] shadow-[0_10px_24px_rgba(15,10,5,0.25)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "در حال ارسال..." : "دریافت کد تأیید"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-center">
                          <p className="text-xs text-[#f0d3aa]">کد به این شماره ارسال شد</p>
                          <p className="mt-1 text-base font-bold tracking-wide text-white" dir="ltr">
                            {form.mobile}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setPhase("mobile");
                              setForm((prev) => ({ ...prev, code: "" }));
                              setError("");
                              setDevCode(null);
                            }}
                            className="mt-2 text-xs font-medium text-[#f1d5ad] hover:text-white hover:underline"
                          >
                            تغییر شماره
                          </button>
                        </div>

                        <div>
                          <p className="mb-3 text-center text-sm font-medium text-[#f7ead3]">کد ۶ رقمی</p>
                          <OtpCodeInput
                            value={form.code}
                            autoFocus
                            disabled={isSubmitting}
                            invalid={Boolean(fieldErrors.code || error)}
                            onChange={(code) => {
                              setForm((prev) => ({ ...prev, code }));
                              clearFieldError("code");
                              setError("");
                            }}
                            onComplete={(code) => void verifyCode(code)}
                          />
                          <FieldError message={fieldErrors.code} />
                        </div>

                        {devCode ? (
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, code: devCode }));
                              void verifyCode(devCode);
                            }}
                            className="w-full rounded-xl border border-dashed border-[#d4a96a]/40 bg-[#d4a96a]/10 px-3 py-2.5 text-xs text-[#f0d3aa] transition-colors hover:bg-[#d4a96a]/15"
                          >
                            کد تست: <span className="font-bold text-white" dir="ltr">{devCode}</span>
                            <span className="mr-1 text-[#f1d5ad]">— کلیک برای تأیید</span>
                          </button>
                        ) : null}

                        <button
                          type="submit"
                          disabled={isSubmitting || form.code.length !== 6}
                          className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSubmitting ? "در حال تأیید..." : "تأیید و ادامه"}
                        </button>

                        <button
                          type="button"
                          disabled={cooldown > 0 || isSubmitting}
                          onClick={() => void requestCode()}
                          className="w-full text-sm text-[#f0d3aa] hover:text-white disabled:opacity-50"
                        >
                          {cooldown > 0
                            ? `ارسال مجدد تا ${cooldown.toLocaleString("fa-IR")} ثانیه دیگر`
                            : "ارسال مجدد کد"}
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-center">
                        <p className="text-xs text-emerald-100/80">شماره تأیید شد</p>
                        <p className="mt-1 font-bold text-white" dir="ltr">
                          {form.mobile}
                        </p>
                      </div>

                      <p className="text-center text-sm text-[#f0d3aa]">
                        برای تکمیل ثبت‌نام، نام و نام خانوادگی را وارد کنید.
                      </p>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="signup-firstname" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                            نام
                          </label>
                          <input
                            id="signup-firstname"
                            type="text"
                            autoComplete="given-name"
                            autoFocus
                            value={form.firstName}
                            onChange={(e) => {
                              setForm({ ...form, firstName: e.target.value });
                              clearFieldError("firstName");
                            }}
                            placeholder="نام"
                            className={`${inputBase} ${fieldErrors.firstName ? inputBad : inputOk}`}
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
                            autoComplete="family-name"
                            value={form.lastName}
                            onChange={(e) => {
                              setForm({ ...form, lastName: e.target.value });
                              clearFieldError("lastName");
                            }}
                            placeholder="نام خانوادگی"
                            className={`${inputBase} ${fieldErrors.lastName ? inputBad : inputOk}`}
                          />
                          <FieldError message={fieldErrors.lastName} />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] transition-colors hover:bg-white disabled:opacity-50"
                      >
                        {isSubmitting ? "در حال ثبت‌نام..." : "تکمیل ثبت‌نام"}
                      </button>
                    </>
                  )}

                  {(error || success) && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-center text-sm ${
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
