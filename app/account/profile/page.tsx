"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import BackLink from "../../components/BackLink";
import PageLoader from "../../components/PageLoader";
import SearchableSelect from "../../components/SearchableSelect";
import { useAuth } from "../../components/SessionProvider";
import { api, type CustomerProfile } from "../../lib/api";
import { getCitiesForProvince, IRAN_PROVINCE_NAMES } from "../../lib/iran-locations";
import { isValidPassword } from "../../lib/validation";

const inputClass =
  "w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm text-[#2e1a08] focus:border-[#d4a96a] focus:outline-none";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm text-[#6d4014]">
      {label}
      <div className="relative mt-1.5">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pl-11`}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a96c20] transition-colors hover:text-[#6d4014]"
          aria-label={visible ? "مخفی کردن رمز" : "نمایش رمز"}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {visible ? (
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
    </label>
  );
}

export default function AccountProfilePage() {
  const router = useRouter();
  const { ready, isCustomer, isLoggedIn, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const cities = useMemo(() => getCitiesForProvince(province), [province]);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/");
      return;
    }
    if (!isCustomer) {
      setLoading(false);
      setError("صفحه مشخصات فقط برای حساب مشتری در دسترس است.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setProfile(me);
        setFirstName(me.firstName);
        setLastName(me.lastName);
        setProvince(me.province || "");
        setCity(me.city || "");
        setAddress(me.address || "");
        setPostalCode(me.postalCode || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "بارگذاری مشخصات ناموفق بود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn, isCustomer, router]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage("");
    setProfileError("");
    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("نام و نام خانوادگی الزامی است.");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        province: province.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        postalCode: postalCode.trim() || null,
      });
      setProfile(updated);
      setProfileMessage("مشخصات با موفقیت ذخیره شد.");
      await refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "ذخیره مشخصات ناموفق بود.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("رمز عبور فعلی را وارد کنید.");
      return;
    }
    if (!isValidPassword(newPassword)) {
      setPasswordError("رمز جدید باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("تکرار رمز جدید مطابقت ندارد.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("رمز جدید باید با رمز فعلی متفاوت باشد.");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordMessage(res.message || "رمز عبور با موفقیت تغییر کرد.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "تغییر رمز ناموفق بود.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-[#faf6ee]">
        <PageLoader label="در حال بارگذاری مشخصات..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf6ee]">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
          <BackLink href="/">بازگشت به صفحه اصلی</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#2e1a08] sm:text-3xl">حساب کاربری</h1>
          <p className="mt-1 text-sm text-[#a96c20]">مشاهده و ویرایش مشخصات شخصی</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-[#e8cfa8] bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-[#2e1a08]">اطلاعات تماس</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-4 py-3">
                <p className="text-xs text-[#a96c20]">ایمیل</p>
                <p className="mt-1 text-sm font-medium text-[#2e1a08]" dir="ltr">
                  {profile?.email}
                </p>
              </div>
              <div className="rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-4 py-3">
                <p className="text-xs text-[#a96c20]">شماره تماس</p>
                <p className="mt-1 text-sm font-medium text-[#2e1a08]" dir="ltr">
                  {profile?.mobile}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#a96c20]">
              ایمیل و شماره موبایل برای امنیت حساب قابل ویرایش نیستند.
            </p>
          </section>

          <section className="rounded-3xl border border-[#e8cfa8] bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-[#2e1a08]">مشخصات و آدرس</h2>
            <form onSubmit={(e) => void saveProfile(e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[#6d4014]">
                  نام
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                    required
                  />
                </label>
                <label className="block text-sm text-[#6d4014]">
                  نام خانوادگی
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={`mt-1.5 ${inputClass}`}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-sm text-[#6d4014]">استان</p>
                  <SearchableSelect
                    id="province"
                    value={province}
                    options={IRAN_PROVINCE_NAMES}
                    open={openSelect === "province"}
                    onOpenChange={setOpenSelect}
                    onChange={(next) => {
                      setProvince(next);
                      setCity(getCitiesForProvince(next).includes(city) ? city : "");
                    }}
                    placeholder="انتخاب استان"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-sm text-[#6d4014]">شهر</p>
                  <SearchableSelect
                    id="city"
                    value={city}
                    options={cities}
                    open={openSelect === "city"}
                    onOpenChange={setOpenSelect}
                    onChange={setCity}
                    placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                    disabled={!province}
                  />
                </div>
              </div>

              <label className="block text-sm text-[#6d4014]">
                آدرس
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                  placeholder="آدرس کامل پستی"
                />
              </label>

              <label className="block text-sm text-[#6d4014] sm:max-w-xs">
                کد پستی
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                  dir="ltr"
                  placeholder="۱۰ رقم"
                />
              </label>

              {profileError && <p className="text-sm text-red-600">{profileError}</p>}
              {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4e2e0e] disabled:opacity-60"
              >
                {savingProfile ? "در حال ذخیره..." : "ذخیره مشخصات"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-[#e8cfa8] bg-white p-5 sm:p-6">
            <h2 className="mb-1 text-lg font-bold text-[#2e1a08]">تغییر رمز عبور</h2>
            <p className="mb-4 text-sm text-[#a96c20]">
              برای امنیت حساب، رمز جدید باید حداقل ۸ کاراکتر باشد.
            </p>
            <form onSubmit={(e) => void savePassword(e)} className="space-y-4 sm:max-w-md">
              <PasswordField
                label="رمز عبور فعلی"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
              <PasswordField
                label="رمز عبور جدید"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label="تکرار رمز جدید"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />

              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              {passwordMessage && <p className="text-sm text-emerald-700">{passwordMessage}</p>}

              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-xl bg-[#8a5419] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#6d4014] disabled:opacity-60"
              >
                {savingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
