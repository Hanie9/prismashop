"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import MultiImageUploadField from "../../components/MultiImageUploadField";
import PageLoader from "../../components/PageLoader";
import SelectDropdown from "../../components/SelectDropdown";
import { SITE_ICON_NAMES } from "../../components/SiteIcon";
import { useSiteSettings } from "../../components/SiteSettingsProvider";
import { api, type SitePage, type SiteSettings } from "../../lib/api";

const ICON_LABELS: Record<string, string> = {
  shield: "سپر (کیفیت)",
  book: "کتاب (مشاوره)",
  box: "جعبه (بسته‌بندی)",
  truck: "کامیون (ارسال)",
  headset: "هدست (پشتیبانی)",
  star: "ستاره",
  heart: "قلب",
  sparkle: "درخشش",
  phone: "تلفن",
  mail: "ایمیل",
  pin: "موقعیت",
  clock: "ساعت",
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  whatsapp: "واتساپ",
  link: "لینک",
};

const iconOptions = SITE_ICON_NAMES.map((name) => ({
  value: name,
  label: ICON_LABELS[name] ?? name,
}));

const inputClass =
  "w-full rounded-xl border border-[#e8cfa8] bg-[#fffdfa] px-3.5 py-2.5 text-sm text-[#2e1a08] outline-none transition-all placeholder:text-[#c4a882] focus:border-[#a96c20] focus:bg-white focus:ring-2 focus:ring-[#d4a96a]/25";
const labelClass = "mb-1.5 block text-xs font-bold text-[#6d4014]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#4e2e0e] disabled:cursor-not-allowed disabled:opacity-45";
const btnGhost =
  "inline-flex items-center gap-1 rounded-xl border border-[#e8cfa8] bg-[#fffaf5] px-3 py-1.5 text-xs font-bold text-[#6d4014] transition-colors hover:border-[#d4a96a] hover:bg-[#fdf1df]";

type TabId = "identity" | "home" | "shop" | "pages";

const TAB_ICONS: Record<TabId, ReactNode> = {
  identity: (
    <>
      <path d="M12 3 4 7v6c0 4.4 3.4 7.6 8 8.5 4.6-.9 8-4.1 8-8.5V7z" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  shop: (
    <>
      <path d="M4 8h16l-1.2 11a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  pages: (
    <>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h4M9 13h6M9 17h4" />
    </>
  ),
};

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "identity", label: "هویت و تماس", hint: "نام، معرفی، راه‌های ارتباطی" },
  { id: "home", label: "صفحه اصلی", hint: "آمار، مزیت‌ها، تصاویر و بنر" },
  { id: "shop", label: "خرید و محصول", hint: "ارسال، ضمانت، برچسب‌ها" },
  { id: "pages", label: "صفحات محتوایی", hint: "درباره ما، حریم خصوصی" },
];

function TabIcon({ id }: { id: TabId }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TAB_ICONS[id]}
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6" />
    </svg>
  );
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#efe0c9] bg-white shadow-[0_2px_18px_rgba(89,48,10,0.05)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f5e9d5] bg-gradient-to-l from-[#fffaf3] to-white px-4 py-3.5 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-black text-[#4e2e0e] sm:text-base">{title}</h2>
          {description && (
            <p className="mt-0.5 text-[11px] text-[#a96c20] sm:text-xs">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

function RepeaterItem({
  index,
  onRemove,
  children,
}: {
  index: number;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#f0e0c6] bg-[#fffaf5] p-3 transition-colors hover:border-[#e0c69c]">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f5e9d5] text-[11px] font-black text-[#8a5419]">
          {(index + 1).toLocaleString("fa-IR")}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="حذف"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#c0705f] transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#f0e0c6] bg-[#fffaf5] px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#4e2e0e]">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-[#a96c20]">{hint}</span>}
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="block h-6 w-11 rounded-full bg-[#e2d2ba] transition-colors peer-checked:bg-[#6d4014]" />
        <span className="pointer-events-none absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5" />
      </span>
    </label>
  );
}

export default function AdminSettingsPage() {
  const { settings: liveSettings, refresh } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [savedForm, setSavedForm] = useState<SiteSettings | null>(null);
  const [pages, setPages] = useState<SitePage[]>([]);
  const [savedPages, setSavedPages] = useState<SitePage[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("identity");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getSiteSettings()
      .then((data) => {
        setForm(data);
        setSavedForm(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "خطا در دریافت تنظیمات"));
    api
      .adminListSitePages()
      .then((list) => {
        setPages(list);
        setSavedPages(list);
        setActivePageId((prev) => prev ?? list[0]?.id ?? null);
      })
      .catch(() => setPages([]));
  }, []);

  if (!form) return <PageLoader fullScreen={false} />;

  const settingsDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const notify = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  };

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api.adminUpdateSiteSettings(form);
      setForm(saved);
      setSavedForm(saved);
      await refresh();
      notify("تنظیمات ذخیره شد");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره تنظیمات ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const activePage = pages.find((p) => p.id === activePageId) ?? null;
  const savedActivePage = savedPages.find((p) => p.id === activePageId) ?? null;
  const pageDirty =
    activePage !== null &&
    JSON.stringify(activePage) !== JSON.stringify(savedActivePage);
  const dirtyPageIds = new Set(
    pages
      .filter(
        (p) =>
          JSON.stringify(p) !==
          JSON.stringify(savedPages.find((s) => s.id === p.id) ?? null),
      )
      .map((p) => p.id),
  );

  const patchPage = (patch: Partial<SitePage>) =>
    setPages((prev) =>
      prev.map((p) => (p.id === activePageId ? { ...p, ...patch } : p)),
    );

  const savePage = async () => {
    if (!activePage) return;
    setSaving(true);
    setError("");
    try {
      const saved = await api.adminUpdateSitePage(activePage.id, {
        title: activePage.title,
        description: activePage.description,
        sections: activePage.sections,
        faqs: activePage.faqs,
        ctaLabel: activePage.ctaLabel,
        ctaHref: activePage.ctaHref,
        published: activePage.published,
      });
      setPages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      setSavedPages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      notify("صفحه ذخیره شد");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره صفحه ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const onPagesTab = tab === "pages";
  const dirty = onPagesTab ? pageDirty : settingsDirty;
  const hasDirtyPages = dirtyPageIds.size > 0;

  return (
    <div className="pb-28">
      <div className="mb-5 overflow-hidden rounded-3xl border border-[#efe0c9] bg-gradient-to-l from-[#fff6ea] via-white to-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-[#2e1a08] sm:text-2xl">تنظیمات سایت</h1>
            <p className="mt-1 text-[11px] leading-6 text-[#a96c20] sm:text-sm">
              محتوای فروشگاه از همین‌جا مدیریت می‌شود و بلافاصله در سایت اعمال می‌شود.
            </p>
          </div>
          {!liveSettings && (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800">
              تنظیمات هنوز در سایت بارگذاری نشده است
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        {/* Section nav */}
        <nav
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:sticky lg:top-24 lg:h-fit lg:grid-cols-1 lg:gap-1.5"
          aria-label="بخش‌های تنظیمات"
        >
          {TABS.map((item) => {
            const active = tab === item.id;
            const showDot = item.id === "pages" ? hasDirtyPages : settingsDirty;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-2.5 rounded-2xl border p-2.5 text-right transition-all lg:gap-3 lg:px-3 lg:py-3 ${
                  active
                    ? "border-[#6d4014] bg-[#6d4014] text-white shadow-[0_8px_22px_rgba(89,48,10,0.2)]"
                    : "border-[#efe0c9] bg-white text-[#6d4014] hover:border-[#d4a96a] hover:bg-[#fffaf5]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    active
                      ? "bg-white/15 text-[#f1d5ad]"
                      : "bg-[#fff6ea] text-[#a96c20] group-hover:bg-[#fdf1df]"
                  }`}
                >
                  <TabIcon id={item.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[11px] font-bold sm:text-xs lg:text-sm">
                      {item.label}
                    </span>
                    {showDot && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                        title="تغییرات ذخیره نشده"
                      />
                    )}
                  </span>
                  <span
                    className={`mt-0.5 hidden text-[11px] lg:block ${
                      active ? "text-[#e8cfa8]" : "text-[#b98a53]"
                    }`}
                  >
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          <form id="site-settings-form" onSubmit={saveSettings} className="space-y-5">
            {tab === "identity" && (
              <>
                <Card title="هویت فروشگاه" description="نام و معرفی کوتاهی که در فوتر و صفحات دیده می‌شود">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>نام فروشگاه</label>
                      <input
                        className={inputClass}
                        value={form.brandName}
                        onChange={(e) => set("brandName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>زیرعنوان کوتاه (کنار لوگو)</label>
                      <input
                        className={inputClass}
                        value={form.brandSubtitle}
                        onChange={(e) => set("brandSubtitle", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>متن کپی‌رایت</label>
                      <input
                        className={inputClass}
                        value={form.copyrightText}
                        onChange={(e) => set("copyrightText", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>معرفی کوتاه</label>
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={form.brandTagline}
                        onChange={(e) => set("brandTagline", e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                <Card title="اطلاعات تماس" description="در فوتر و صفحه تماس با ما نمایش داده می‌شود">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>تلفن (نمایشی)</label>
                      <input
                        className={inputClass}
                        value={form.contactPhone}
                        onChange={(e) => set("contactPhone", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>تلفن (برای لینک تماس)</label>
                      <input
                        dir="ltr"
                        className={inputClass}
                        value={form.contactPhoneLink}
                        onChange={(e) => set("contactPhoneLink", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>ایمیل</label>
                      <input
                        dir="ltr"
                        className={inputClass}
                        value={form.contactEmail}
                        onChange={(e) => set("contactEmail", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>ساعات پاسخگویی</label>
                      <input
                        className={inputClass}
                        value={form.workingHours}
                        onChange={(e) => set("workingHours", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>آدرس</label>
                      <input
                        className={inputClass}
                        value={form.contactAddress}
                        onChange={(e) => set("contactAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </Card>

                <Card
                  title="شبکه‌های اجتماعی"
                  description="آیکون‌های فوتر"
                  action={
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() =>
                        set("socialLinks", [
                          ...form.socialLinks,
                          { label: "", href: "", icon: "instagram" },
                        ])
                      }
                    >
                      + افزودن
                    </button>
                  }
                >
                  {form.socialLinks.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                      هنوز شبکه اجتماعی‌ای اضافه نشده است.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {form.socialLinks.map((social, i) => (
                        <RepeaterItem
                          key={i}
                          index={i}
                          onRemove={() =>
                            set(
                              "socialLinks",
                              form.socialLinks.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          <input
                            className={inputClass}
                            placeholder="نام"
                            value={social.label}
                            onChange={(e) =>
                              set(
                                "socialLinks",
                                form.socialLinks.map((s, idx) =>
                                  idx === i ? { ...s, label: e.target.value } : s,
                                ),
                              )
                            }
                          />
                          <input
                            dir="ltr"
                            className={inputClass}
                            placeholder="https://"
                            value={social.href}
                            onChange={(e) =>
                              set(
                                "socialLinks",
                                form.socialLinks.map((s, idx) =>
                                  idx === i ? { ...s, href: e.target.value } : s,
                                ),
                              )
                            }
                          />
                          <SelectDropdown
                            id={`social-icon-${i}`}
                            label="آیکون"
                            value={social.icon}
                            options={iconOptions}
                            open={openDropdown === `social-icon-${i}`}
                            onOpenChange={setOpenDropdown}
                            onChange={(icon) =>
                              set(
                                "socialLinks",
                                form.socialLinks.map((s, idx) =>
                                  idx === i ? { ...s, icon } : s,
                                ),
                              )
                            }
                          />
                        </RepeaterItem>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {tab === "home" && (
              <>
                <Card
                  title="آمار صفحه اصلی"
                  description="اعداد کوتاهی که زیر هدر نمایش داده می‌شوند"
                  action={
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => set("stats", [...form.stats, { value: "", label: "" }])}
                    >
                      + افزودن
                    </button>
                  }
                >
                  {form.stats.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                      آماری تعریف نشده است.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {form.stats.map((stat, i) => (
                        <RepeaterItem
                          key={i}
                          index={i}
                          onRemove={() =>
                            set("stats", form.stats.filter((_, idx) => idx !== i))
                          }
                        >
                          <input
                            className={inputClass}
                            placeholder="۸۰+"
                            value={stat.value}
                            onChange={(e) =>
                              set(
                                "stats",
                                form.stats.map((s, idx) =>
                                  idx === i ? { ...s, value: e.target.value } : s,
                                ),
                              )
                            }
                          />
                          <input
                            className={inputClass}
                            placeholder="عنوان"
                            value={stat.label}
                            onChange={(e) =>
                              set(
                                "stats",
                                form.stats.map((s, idx) =>
                                  idx === i ? { ...s, label: e.target.value } : s,
                                ),
                              )
                            }
                          />
                        </RepeaterItem>
                      ))}
                    </div>
                  )}
                </Card>

                <Card
                  title="مزیت‌ها (چرا ما؟)"
                  description="بخش معرفی نقاط قوت فروشگاه"
                  action={
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() =>
                        set("features", [
                          ...form.features,
                          { title: "", description: "", icon: "sparkle" },
                        ])
                      }
                    >
                      + افزودن
                    </button>
                  }
                >
                  {form.features.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                      مزیتی تعریف نشده است.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {form.features.map((feature, i) => (
                        <RepeaterItem
                          key={i}
                          index={i}
                          onRemove={() =>
                            set("features", form.features.filter((_, idx) => idx !== i))
                          }
                        >
                          <input
                            className={inputClass}
                            placeholder="عنوان"
                            value={feature.title}
                            onChange={(e) =>
                              set(
                                "features",
                                form.features.map((f, idx) =>
                                  idx === i ? { ...f, title: e.target.value } : f,
                                ),
                              )
                            }
                          />
                          <SelectDropdown
                            id={`feature-icon-${i}`}
                            label="آیکون"
                            value={feature.icon}
                            options={iconOptions}
                            open={openDropdown === `feature-icon-${i}`}
                            onOpenChange={setOpenDropdown}
                            onChange={(icon) =>
                              set(
                                "features",
                                form.features.map((f, idx) =>
                                  idx === i ? { ...f, icon } : f,
                                ),
                              )
                            }
                          />
                          <textarea
                            rows={2}
                            className={inputClass}
                            placeholder="توضیح"
                            value={feature.description}
                            onChange={(e) =>
                              set(
                                "features",
                                form.features.map((f, idx) =>
                                  idx === i ? { ...f, description: e.target.value } : f,
                                ),
                              )
                            }
                          />
                        </RepeaterItem>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="تصاویر هدر" description="اسلایدهای بالای صفحه اصلی">
                  <MultiImageUploadField
                    label="تصاویر هدر"
                    value={form.heroImages}
                    onChange={(images) => set("heroImages", images)}
                  />
                </Card>

                <Card title="بنر تخفیف" description="بخش تبلیغاتی میانه صفحه اصلی">
                  <div className="mb-4">
                    <Toggle
                      label="نمایش بنر تخفیف"
                      hint="در صورت غیرفعال بودن، بنر در صفحه اصلی دیده نمی‌شود."
                      checked={form.promoBanner.enabled}
                      onChange={(enabled) =>
                        set("promoBanner", { ...form.promoBanner, enabled })
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>برچسب بالای بنر</label>
                      <input
                        className={inputClass}
                        value={form.promoBanner.badge}
                        onChange={(e) =>
                          set("promoBanner", { ...form.promoBanner, badge: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>عنوان بنر</label>
                      <input
                        className={inputClass}
                        value={form.promoBanner.title}
                        onChange={(e) =>
                          set("promoBanner", { ...form.promoBanner, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>توضیح بنر</label>
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={form.promoBanner.description}
                        onChange={(e) =>
                          set("promoBanner", {
                            ...form.promoBanner,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>متن دکمه</label>
                      <input
                        className={inputClass}
                        value={form.promoBanner.ctaLabel}
                        onChange={(e) =>
                          set("promoBanner", {
                            ...form.promoBanner,
                            ctaLabel: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>لینک دکمه</label>
                      <input
                        dir="ltr"
                        className={inputClass}
                        value={form.promoBanner.ctaHref}
                        onChange={(e) =>
                          set("promoBanner", {
                            ...form.promoBanner,
                            ctaHref: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <MultiImageUploadField
                      label="تصاویر بنر"
                      value={form.promoBanner.images}
                      onChange={(images) =>
                        set("promoBanner", { ...form.promoBanner, images })
                      }
                    />
                  </div>
                </Card>
              </>
            )}

            {tab === "shop" && (
              <>
                <Card title="اطلاعات خرید و محصول" description="متن‌هایی که در صفحه محصول دیده می‌شوند">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>متن زمان ارسال</label>
                      <input
                        className={inputClass}
                        value={form.shippingTimeText}
                        onChange={(e) => set("shippingTimeText", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>هزینه ارسال (تومان)</label>
                      <input
                        type="number"
                        min={0}
                        dir="ltr"
                        className={inputClass}
                        value={form.shippingCost}
                        onChange={(e) => set("shippingCost", Number(e.target.value) || 0)}
                      />
                      <p className="mt-1.5 text-[11px] text-[#a96c20]">
                        با مقدار صفر، هزینه ارسال در خلاصه سفارش نمایش داده نمی‌شود.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card
                  title="برچسب‌های فوتر"
                  description="نشان‌های کوتاه اعتماد در پایین سایت"
                  action={
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => set("footerBadges", [...form.footerBadges, ""])}
                    >
                      + افزودن
                    </button>
                  }
                >
                  {form.footerBadges.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                      برچسبی تعریف نشده است.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {form.footerBadges.map((item, i) => (
                        <RepeaterItem
                          key={i}
                          index={i}
                          onRemove={() =>
                            set(
                              "footerBadges",
                              form.footerBadges.filter((_, idx) => idx !== i),
                            )
                          }
                        >
                          <input
                            className={inputClass}
                            value={item}
                            onChange={(e) =>
                              set(
                                "footerBadges",
                                form.footerBadges.map((v, idx) =>
                                  idx === i ? e.target.value : v,
                                ),
                              )
                            }
                          />
                        </RepeaterItem>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </form>

          {onPagesTab && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActivePageId(page.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                      page.id === activePageId
                        ? "bg-[#6d4014] text-white"
                        : "border border-[#e8cfa8] bg-white text-[#6d4014] hover:border-[#d4a96a]"
                    }`}
                  >
                    {page.title}
                    {dirtyPageIds.has(page.id) && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        title="تغییرات ذخیره نشده"
                      />
                    )}
                  </button>
                ))}
              </div>

              {activePage && (
                <>
                  <Card title="اطلاعات صفحه">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelClass}>عنوان</label>
                        <input
                          className={inputClass}
                          value={activePage.title}
                          onChange={(e) => patchPage({ title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>شناسه صفحه</label>
                        <input
                          dir="ltr"
                          className={`${inputClass} cursor-not-allowed bg-[#f7f0e5] text-[#8a5419]`}
                          value={activePage.slug}
                          readOnly
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>توضیح کوتاه</label>
                        <textarea
                          rows={3}
                          className={inputClass}
                          value={activePage.description}
                          onChange={(e) => patchPage({ description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>متن دکمه</label>
                        <input
                          className={inputClass}
                          value={activePage.ctaLabel}
                          onChange={(e) => patchPage({ ctaLabel: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>لینک دکمه</label>
                        <input
                          dir="ltr"
                          className={inputClass}
                          value={activePage.ctaHref}
                          onChange={(e) => patchPage({ ctaHref: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Toggle
                          label="نمایش این صفحه در سایت"
                          checked={activePage.published}
                          onChange={(published) => patchPage({ published })}
                        />
                      </div>
                    </div>
                  </Card>

                  <Card
                    title="بخش‌ها"
                    description="هر بخش یک عنوان و چند پاراگراف دارد"
                    action={
                      <button
                        type="button"
                        className={btnGhost}
                        onClick={() =>
                          patchPage({
                            sections: [
                              ...activePage.sections,
                              { heading: "", paragraphs: [""] },
                            ],
                          })
                        }
                      >
                        + افزودن بخش
                      </button>
                    }
                  >
                    {activePage.sections.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                        بخشی اضافه نشده است.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activePage.sections.map((section, i) => (
                          <RepeaterItem
                            key={i}
                            index={i}
                            onRemove={() =>
                              patchPage({
                                sections: activePage.sections.filter((_, idx) => idx !== i),
                              })
                            }
                          >
                            <input
                              className={inputClass}
                              placeholder="عنوان بخش"
                              value={section.heading}
                              onChange={(e) =>
                                patchPage({
                                  sections: activePage.sections.map((s, idx) =>
                                    idx === i ? { ...s, heading: e.target.value } : s,
                                  ),
                                })
                              }
                            />
                            <textarea
                              rows={4}
                              className={inputClass}
                              placeholder="هر پاراگراف در یک خط"
                              value={section.paragraphs.join("\n")}
                              onChange={(e) =>
                                patchPage({
                                  sections: activePage.sections.map((s, idx) =>
                                    idx === i
                                      ? {
                                          ...s,
                                          paragraphs: e.target.value
                                            .split("\n")
                                            .map((p) => p.trim())
                                            .filter(Boolean),
                                        }
                                      : s,
                                  ),
                                })
                              }
                            />
                          </RepeaterItem>
                        ))}
                      </div>
                    )}
                  </Card>

                  {activePage.slug !== "privacy" && (
                  <Card
                    title="سوالات متداول"
                    description="در انتهای همین صفحه نمایش داده می‌شود"
                    action={
                      <button
                        type="button"
                        className={btnGhost}
                        onClick={() =>
                          patchPage({
                            faqs: [...activePage.faqs, { question: "", answer: "" }],
                          })
                        }
                      >
                        + افزودن سوال
                      </button>
                    }
                  >
                    {activePage.faqs.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[#e8cfa8] py-6 text-center text-xs text-[#a96c20]">
                        سوالی اضافه نشده است.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activePage.faqs.map((faq, i) => (
                          <RepeaterItem
                            key={i}
                            index={i}
                            onRemove={() =>
                              patchPage({
                                faqs: activePage.faqs.filter((_, idx) => idx !== i),
                              })
                            }
                          >
                            <input
                              className={inputClass}
                              placeholder="سوال"
                              value={faq.question}
                              onChange={(e) =>
                                patchPage({
                                  faqs: activePage.faqs.map((f, idx) =>
                                    idx === i ? { ...f, question: e.target.value } : f,
                                  ),
                                })
                              }
                            />
                            <textarea
                              rows={2}
                              className={inputClass}
                              placeholder="پاسخ"
                              value={faq.answer}
                              onChange={(e) =>
                                patchPage({
                                  faqs: activePage.faqs.map((f, idx) =>
                                    idx === i ? { ...f, answer: e.target.value } : f,
                                  ),
                                })
                              }
                            />
                          </RepeaterItem>
                        ))}
                      </div>
                    )}
                  </Card>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating save bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#ead7bb] bg-white/95 px-3 py-2.5 shadow-[0_14px_40px_rgba(89,48,10,0.18)] backdrop-blur-xl transition-all duration-200 ${
            dirty || saving || message
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          {message ? (
            <span className="px-2 text-xs font-bold text-emerald-700 sm:text-sm">
              {message}
            </span>
          ) : (
            <>
              <span className="hidden px-1 text-xs text-[#8a5419] sm:block">
                {onPagesTab ? "تغییرات صفحه ذخیره نشده" : "تغییرات ذخیره نشده"}
              </span>
              <span className="px-1 text-xs text-[#8a5419] sm:hidden">ذخیره نشده</span>
              {onPagesTab ? (
                <button
                  type="button"
                  onClick={() => void savePage()}
                  disabled={saving || !pageDirty}
                  className={btnPrimary}
                >
                  {saving ? "در حال ذخیره…" : "ذخیره صفحه"}
                </button>
              ) : (
                <button
                  type="submit"
                  form="site-settings-form"
                  disabled={saving || !settingsDirty}
                  className={btnPrimary}
                >
                  {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
