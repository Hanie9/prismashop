"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import BackLink from "../components/BackLink";
import { useAuth } from "../components/SessionProvider";
import { useSiteSettings } from "../components/SiteSettingsProvider";
import { api, type ContactMessage } from "../lib/api";
import { isValidEmail, isValidIranMobile } from "../lib/validation";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactPage() {
  const { isCustomer, customer, ready } = useAuth();
  const { settings } = useSiteSettings();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [myMessages, setMyMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!customer) return;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || customer.firstName || "",
      lastName: prev.lastName || customer.lastName || "",
      mobile: prev.mobile || customer.mobile || "",
      email: prev.email || customer.email || "",
    }));
  }, [customer]);

  const loadMyMessages = async () => {
    if (!isCustomer) {
      setMyMessages([]);
      return;
    }
    setMessagesLoading(true);
    setMessagesError("");
    try {
      const list = await api.listMyContactMessages();
      setMyMessages(list);
    } catch (err) {
      setMessagesError(
        err instanceof Error ? err.message : "بارگذاری پیام‌ها ناموفق بود.",
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    void loadMyMessages();
  }, [ready, isCustomer, customer?.id]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

    setSending(true);
    try {
      await api.createContactMessage({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm({
        firstName: customer?.firstName || "",
        lastName: customer?.lastName || "",
        mobile: customer?.mobile || "",
        email: customer?.email || "",
        subject: "",
        message: "",
      });
      if (isCustomer) void loadMyMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ارسال پیام ناموفق بود.");
    } finally {
      setSending(false);
    }
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#e8cfa8] rounded-3xl p-5 sm:p-7">
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
                  className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3] placeholder:text-right"
                  placeholder="شماره موبایل"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  dir={form.mobile ? "ltr" : "rtl"}
                  required
                />
                <input
                  type="email"
                  className="border border-[#e8cfa8] rounded-xl p-3 bg-[#fdf8f3] placeholder:text-right"
                  placeholder="ایمیل"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  dir={form.email ? "ltr" : "rtl"}
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
                  disabled={sending}
                  className="sm:col-span-2 bg-[#6d4014] hover:bg-[#4e2e0e] text-white rounded-xl py-3 font-medium disabled:opacity-60"
                >
                  {sending ? "در حال ارسال…" : "ارسال پیام"}
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

            <section className="bg-white border border-[#e8cfa8] rounded-3xl p-5 sm:p-7">
              <h2 className="text-lg font-black text-[#2e1a08] mb-1">پیام‌های من</h2>
              <p className="text-sm text-[#6d4014] mb-5">
                پیام‌های ارسال‌شده و پاسخ پشتیبانی را اینجا ببینید.
              </p>

              {!ready ? (
                <p className="text-sm text-[#a96c20]">در حال بارگذاری…</p>
              ) : !isCustomer ? (
                <div className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-5 text-sm text-[#6d4014]">
                  <p className="mb-3">
                    برای مشاهده پیام‌های خود و پاسخ‌های پشتیبانی، وارد حساب کاربری شوید.
                  </p>
                  <Link
                    href="/auth/login?next=/contact"
                    className="inline-flex rounded-xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4e2e0e]"
                  >
                    ورود به حساب
                  </Link>
                </div>
              ) : messagesLoading ? (
                <p className="text-sm text-[#a96c20]">در حال بارگذاری پیام‌ها…</p>
              ) : messagesError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {messagesError}
                </p>
              ) : myMessages.length === 0 ? (
                <p className="text-sm text-[#a96c20]">هنوز پیامی ارسال نکرده‌اید.</p>
              ) : (
                <div className="space-y-4">
                  {myMessages.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-[#2e1a08]">{item.subject}</h3>
                        <span className="text-xs text-[#a96c20]">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white border border-[#ead7bb] p-3 mb-3">
                        <p className="text-[11px] font-bold text-[#a96c20] mb-1">پیام شما</p>
                        <p className="text-sm leading-7 text-[#4e2e0e] whitespace-pre-wrap">
                          {item.message}
                        </p>
                      </div>
                      {item.reply ? (
                        <div className="rounded-xl bg-[#f5e9d5] border border-[#e8cfa8] p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <p className="text-[11px] font-bold text-[#6d4014]">پاسخ پشتیبانی</p>
                            {item.repliedAt ? (
                              <span className="text-[11px] text-[#a96c20]">
                                {formatDateTime(item.repliedAt)}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm leading-7 text-[#2e1a08] whitespace-pre-wrap">
                            {item.reply}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#a96c20]">
                          هنوز پاسخی ثبت نشده است. به‌زودی پاسخ داده می‌شود.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4">
            {settings?.contactPhone && (
              <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
                <h2 className="font-bold text-[#4e2e0e] mb-2">پشتیبانی تلفنی</h2>
                <a
                  href={`tel:${settings.contactPhoneLink || settings.contactPhone}`}
                  className="text-[#6d4014] hover:text-[#a96c20]"
                >
                  {settings.contactPhone}
                </a>
              </div>
            )}
            {settings?.contactEmail && (
              <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
                <h2 className="font-bold text-[#4e2e0e] mb-2">ایمیل</h2>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="text-[#6d4014] hover:text-[#a96c20]"
                >
                  {settings.contactEmail}
                </a>
              </div>
            )}
            {settings?.contactAddress && (
              <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
                <h2 className="font-bold text-[#4e2e0e] mb-2">آدرس</h2>
                <p className="text-sm text-[#6d4014]">{settings.contactAddress}</p>
              </div>
            )}
            {settings?.workingHours && (
              <div className="bg-white border border-[#e8cfa8] rounded-2xl p-5">
                <h2 className="font-bold text-[#4e2e0e] mb-2">ساعات پاسخگویی</h2>
                <p className="text-sm text-[#6d4014]">{settings.workingHours}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
