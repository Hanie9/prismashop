"use client";

import { useEffect, useState } from "react";
import { DateTimeBadge, EmailBadge, PhoneBadge } from "../../components/AdminMeta";
import { api } from "../../lib/api";

type CustomerRow = {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  city: string;
  province: string;
  address?: string | null;
  postalCode?: string | null;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  registeredAt?: string | null;
  isRegistered: boolean;
};

function formatMoney(value: number) {
  return (
    <>
      {value.toLocaleString("fa-IR")}
      <span className="ms-[1mm] inline-block">تومان</span>
    </>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.customers();
        if (!cancelled) setCustomers(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "بارگذاری مشتریان ناموفق بود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">مشتریان</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          همه کاربران ثبت‌نام‌شده و خریداران مهمان
        </p>
      </div>

      {loading && <p className="text-sm text-[#6d4014]">در حال بارگذاری...</p>}
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && customers.length === 0 ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white py-16 text-center text-sm text-[#a96c20]">
          هنوز مشتری‌ای ثبت نشده است.
        </div>
      ) : (
        !loading &&
        !error && (
          <>
            <div className="space-y-3 md:hidden">
              {customers.map((c) => (
                <div
                  key={c.phone}
                  className="rounded-3xl border border-[#ead7bb] bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1.5">
                      <p className="font-bold text-[#2e1a08]">
                        {c.firstName} {c.lastName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PhoneBadge phone={c.phone} />
                        {c.email ? <EmailBadge email={c.email} /> : null}
                      </div>
                    </div>
                    {c.isRegistered ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        عضو سایت
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[#fff6ea] px-2.5 py-1 text-[11px] font-bold text-[#a96c20]">
                        مهمان
                      </span>
                    )}
                  </div>
                  <p className="mb-2 text-xs text-[#a96c20]">
                    {[c.province, c.city].filter(Boolean).join(" / ") || "—"}
                  </p>
                  {c.address && (
                    <p className="mb-2 line-clamp-2 text-xs text-[#6d4014]">{c.address}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4e2e0e]">
                    <span>{c.ordersCount.toLocaleString("fa-IR")} سفارش</span>
                    <span className="font-bold">{formatMoney(c.totalSpent)}</span>
                  </div>
                  {(c.lastOrderAt || c.registeredAt) && (
                    <div className="mt-2">
                      <DateTimeBadge value={c.lastOrderAt || c.registeredAt || ""} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-[#ead7bb] bg-white md:block">
              <table className="w-full text-sm">
                <thead className="bg-[#fffaf5] text-[#6d4014]">
                  <tr>
                    <th className="px-4 py-3 text-right font-bold">مشتری</th>
                    <th className="px-4 py-3 text-right font-bold">تماس</th>
                    <th className="px-4 py-3 text-right font-bold">شهر</th>
                    <th className="px-4 py-3 text-right font-bold">سفارش</th>
                    <th className="px-4 py-3 text-right font-bold">مجموع خرید</th>
                    <th className="px-4 py-3 text-right font-bold">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.phone} className="border-t border-[#f1e3cf]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#2e1a08]">
                          {c.firstName} {c.lastName}
                        </p>
                        {c.email ? (
                          <div className="mt-1.5">
                            <EmailBadge email={c.email} />
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <PhoneBadge phone={c.phone} />
                      </td>
                      <td className="px-4 py-3 text-[#4e2e0e]">
                        {[c.province, c.city].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="px-4 py-3">{c.ordersCount.toLocaleString("fa-IR")}</td>
                      <td className="px-4 py-3 font-bold text-[#2e1a08]">
                        {formatMoney(c.totalSpent)}
                      </td>
                      <td className="px-4 py-3">
                        {c.isRegistered ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            عضو سایت
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#fff6ea] px-2.5 py-1 text-[11px] font-bold text-[#a96c20]">
                            مهمان
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
