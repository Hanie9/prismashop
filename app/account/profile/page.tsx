"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import BackLink from "../../components/BackLink";
import PageLoader from "../../components/PageLoader";
import SearchableSelect from "../../components/SearchableSelect";
import { useAuth } from "../../components/SessionProvider";
import { api, type CustomerProfile } from "../../lib/api";
import { getCitiesForProvince, IRAN_PROVINCE_NAMES } from "../../lib/iran-locations";

const inputClass =
  "w-full rounded-xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm text-[#2e1a08] focus:border-[#d4a96a] focus:outline-none";

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
            <div className="rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-4 py-3 sm:max-w-sm">
              <p className="text-xs text-[#a96c20]">شماره موبایل</p>
              <p className="mt-1 text-sm font-medium text-[#2e1a08]" dir="ltr">
                {profile?.mobile}
              </p>
            </div>
            <p className="mt-3 text-xs text-[#a96c20]">
              شماره موبایل برای امنیت حساب قابل ویرایش نیست. ورود با کد تأیید انجام می‌شود.
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
        </div>
      </div>
    </div>
  );
}
