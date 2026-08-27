"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import OtpCodeInput from "../../components/OtpCodeInput";
import { useAuth } from "../../components/SessionProvider";
import { useSiteSettings } from "../../components/SiteSettingsProvider";
import { setAdminSession } from "../../lib/admin-auth";
import {
  api,
  getRememberedLogin,
  setRememberedLogin,
  setSessionPersist,
  setStoredSessionId,
} from "../../lib/api";
import { isValidIranMobile, normalizeIranMobileInput, onlyDigits } from "../../lib/validation";

function normalizeMobile(value: string) {
  return normalizeIranMobileInput(value);
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const { settings } = useSiteSettings();
  const [phase, setPhase] = useState<"mobile" | "otp">("mobile");
  const [form, setForm] = useState({
    mobile: "",
    code: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cancelHref, setCancelHref] = useState("/");
  const [signupHref, setSignupHref] = useState("/auth/signup");
  const [devCode, setDevCode] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const remembered = getRememberedLogin();
    const next = params.get("next");

    if (next === "/cart" || next === "/checkout" || next?.startsWith("/checkout?")) {
      setCancelHref("/cart");
    } else {
      setCancelHref("/");
    }

    setForm((current) => ({
      ...current,
      mobile: remembered && isValidIranMobile(remembered) ? remembered : current.mobile,
      remember: Boolean(remembered),
    }));
    setSignupHref(next ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup");
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const requestCode = async () => {
    setError("");
    setDevCode(null);
    const mobile = form.mobile.trim();
    if (!mobile) {
      setError("شماره موبایل را وارد کنید.");
      return;
    }
    if (!isValidIranMobile(mobile)) {
      setError("شماره باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.requestOtp(normalizeMobile(mobile), "login");
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

  const verifyAndLogin = async (codeOverride?: string) => {
    if (verifyingRef.current) return;
    const code = onlyDigits(codeOverride ?? form.code);
    setError("");
    if (code.length !== 6) {
      setError("کد ۶ رقمی را کامل وارد کنید.");
      return;
    }

    verifyingRef.current = true;
    setIsSubmitting(true);
    try {
      setSessionPersist(form.remember);
      const session = await api.verifyOtpLogin(
        normalizeMobile(form.mobile),
        onlyDigits(code),
        form.remember,
      );
      setStoredSessionId(session.sessionId);
      if (form.remember) setRememberedLogin(normalizeMobile(form.mobile));
      else setRememberedLogin(null);

      if (session.role === "admin") {
        setAdminSession();
      }

      try {
        await refresh();
      } catch {
        /* session already stored */
      }
      window.dispatchEvent(new Event("prismashop-auth-change"));

      const rawNext = new URLSearchParams(window.location.search).get("next");
      if (session.role === "admin") {
        const adminNext =
          rawNext && rawNext.startsWith("/admin") ? rawNext : "/admin";
        router.replace(adminNext);
        return;
      }

      const next =
        rawNext === "/checkout" || rawNext?.startsWith("/checkout?")
          ? "/cart"
          : rawNext;
      router.push(next && next.startsWith("/") ? next : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود انجام نشد.");
      setForm((prev) => ({ ...prev, code: "" }));
    } finally {
      verifyingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "mobile") await requestCode();
    else await verifyAndLogin();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/images/calligraphy/calligraphy-8.jpg"
        alt=""
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
              <div className="text-lg font-black text-white">{settings?.brandName}</div>
              {settings?.brandSubtitle && (
                <div className="text-xs text-[#e3c091]">{settings.brandSubtitle}</div>
              )}
            </div>
          </Link>

          <Link
            href={cancelHref}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-[#f1d5ad] backdrop-blur-md transition-colors hover:bg-white/15 hover:text-white"
          >
            بازگشت
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center py-4 lg:py-0">
          <div className="grid w-full items-center gap-8 lg:gap-12 xl:gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="hidden lg:block">
              <span className="mb-5 inline-flex rounded-full border border-[#d4a96a]/40 bg-[#d4a96a]/15 px-3 py-1 text-xs font-medium text-[#f1d5ad] backdrop-blur-sm">
                ورود امن و سریع
              </span>
              <h2 className="mb-4 text-3xl xl:text-4xl 2xl:text-5xl font-black leading-[1.35] text-white">
                ورود با
                <br />
                کد تأیید موبایل
              </h2>
              <p className="max-w-md text-sm leading-8 text-[#efcea3] xl:text-base">
                فقط با شماره موبایل وارد شوید؛ بدون ایمیل و رمز عبور.
              </p>
            </div>

            <div className="w-full max-w-md justify-self-center lg:justify-self-end">
              <div className="rounded-[30px] border border-white/15 bg-white/12 p-5 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:p-8">
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-xl sm:text-2xl font-black text-white">ورود به حساب</h1>
                  <p className="text-sm text-[#f0d3aa]">
                    حساب ندارید؟{" "}
                    <Link href={signupHref} className="font-bold text-white hover:text-[#f6dfbc] hover:underline">
                      ثبت‌نام کنید
                    </Link>
                  </p>
                </div>

                <div className="mb-6 flex items-center justify-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-3 py-1 font-medium ${
                      phase === "mobile"
                        ? "bg-[#f3ddbb] text-[#3c220c]"
                        : "bg-white/10 text-[#f0d3aa]"
                    }`}
                  >
                    ۱. شماره
                  </span>
                  <span className="h-px w-6 bg-white/20" />
                  <span
                    className={`rounded-full px-3 py-1 font-medium ${
                      phase === "otp"
                        ? "bg-[#f3ddbb] text-[#3c220c]"
                        : "bg-white/10 text-[#f0d3aa]"
                    }`}
                  >
                    ۲. کد تأیید
                  </span>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  {phase === "mobile" ? (
                    <>
                      <div>
                        <label htmlFor="login-mobile" className="mb-2 block text-sm font-medium text-[#f7ead3]">
                          شماره موبایل
                        </label>
                        <div className="relative">
                          <input
                            id="login-mobile"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            value={form.mobile}
                            onChange={(e) => {
                              setForm({ ...form, mobile: normalizeMobile(e.target.value) });
                              setError("");
                            }}
                            placeholder="09123456789"
                            className="h-12 w-full rounded-2xl border border-white/15 bg-white/14 px-4 pr-11 text-sm text-white placeholder:text-[#f0d3aa]/60 focus:border-[#f1d5ad]/60 focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/15"
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
                      </div>

                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.remember}
                          onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                          className="h-4 w-4 rounded accent-[#6d4014]"
                        />
                        <span className="text-sm text-[#f7ead3]">مرا به خاطر بسپار</span>
                      </label>

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
                          invalid={Boolean(error)}
                          onChange={(code) => {
                            setForm((prev) => ({ ...prev, code }));
                            setError("");
                          }}
                          onComplete={(code) => void verifyAndLogin(code)}
                        />
                      </div>

                      {devCode ? (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, code: devCode }));
                            void verifyAndLogin(devCode);
                          }}
                          className="w-full rounded-xl border border-dashed border-[#d4a96a]/40 bg-[#d4a96a]/10 px-3 py-2.5 text-xs text-[#f0d3aa] transition-colors hover:bg-[#d4a96a]/15"
                        >
                          کد تست: <span className="font-bold text-white" dir="ltr">{devCode}</span>
                          <span className="mr-1 text-[#f1d5ad]">— کلیک برای ورود</span>
                        </button>
                      ) : null}

                      <button
                        type="submit"
                        disabled={isSubmitting || form.code.length !== 6}
                        className="w-full rounded-2xl bg-[#f3ddbb] py-3.5 text-base font-bold text-[#3c220c] shadow-[0_10px_24px_rgba(15,10,5,0.25)] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting ? "در حال ورود..." : "تأیید و ورود"}
                      </button>

                      <button
                        type="button"
                        disabled={cooldown > 0 || isSubmitting}
                        onClick={() => void requestCode()}
                        className="w-full text-sm text-[#f0d3aa] transition-colors hover:text-white disabled:opacity-50"
                      >
                        {cooldown > 0
                          ? `ارسال مجدد تا ${cooldown.toLocaleString("fa-IR")} ثانیه دیگر`
                          : "ارسال مجدد کد"}
                      </button>
                    </>
                  )}

                  {error ? (
                    <div className="rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
                      {error}
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
