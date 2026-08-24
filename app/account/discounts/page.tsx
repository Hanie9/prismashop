"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoader from "../../components/PageLoader";
import PriceText from "../../components/PriceText";
import { useAuth } from "../../components/SessionProvider";
import { api } from "../../lib/api";
import type { Coupon } from "../../lib/shop-types";

function couponBenefitText(coupon: Coupon): string {
  if (coupon.type === "percent") {
    return `${coupon.value.toLocaleString("fa-IR")}٪ تخفیف روی مبلغ سفارش`;
  }
  return `${coupon.value.toLocaleString("fa-IR")} تومان تخفیف ثابت روی مبلغ سفارش`;
}

export default function AccountDiscountsPage() {
  const router = useRouter();
  const { ready, isLoggedIn } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listAvailableCoupons();
        if (!cancelled) setCoupons(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "بارگذاری تخفیف‌ها ناموفق بود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn, router]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(""), 1800);
    } catch {
      setCopiedCode("");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#2e1a08] sm:text-3xl">تخفیف‌ها</h1>
            <p className="mt-1 text-sm text-[#6d4014]">
              کدهای فعال را ببینید، کپی کنید و هنگام ثبت سفارش اعمال کنید.
            </p>
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-[#8a5419] px-5 py-2.5 text-sm font-bold text-white"
          >
            رفتن به ثبت سفارش
          </Link>
        </div>

        {loading && <PageLoader fullScreen={false} />}
        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && coupons.length === 0 && (
          <div className="rounded-3xl border border-[#e8cfa8] bg-white p-10 text-center">
            <p className="mb-4 text-sm text-[#6d4014]">در حال حاضر کد تخفیف فعالی وجود ندارد.</p>
            <Link
              href="/products"
              className="inline-flex rounded-full bg-[#8a5419] px-6 py-3 text-sm font-bold text-white"
            >
              مشاهده محصولات
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {coupons.map((coupon) => (
            <article
              key={coupon.id}
              className="rounded-3xl border border-[#e8cfa8] bg-white p-4 sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#a96c20]">کد تخفیف</p>
                  <p className="font-black tracking-wide text-[#2e1a08]" dir="ltr">
                    {coupon.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void copyCode(coupon.code)}
                  className="rounded-full border border-[#ead7bb] bg-[#fffaf5] px-4 py-2 text-xs font-bold text-[#8a5419] transition hover:border-[#d4a96a]"
                >
                  {copiedCode === coupon.code ? "کپی شد" : "کپی کد"}
                </button>
              </div>
              <ul className="space-y-1.5 text-sm leading-7 text-[#4e2e0e]">
                <li>{couponBenefitText(coupon)}</li>
                <li>
                  {coupon.minOrder > 0 ? (
                    <>
                      حداقل مبلغ سفارش برای استفاده:{" "}
                      <PriceText amount={coupon.minOrder} className="font-medium" />
                    </>
                  ) : (
                    "بدون حداقل مبلغ سفارش — روی هر سفارشی قابل اعمال است."
                  )}
                </li>
                <li>کد را در صفحه تکمیل سفارش وارد کرده و دکمه «اعمال» را بزنید.</li>
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
