"use client";

import { useMemo } from "react";
import { DateTimeBadge, PhoneBadge } from "../../components/AdminMeta";
import { useShop } from "../../components/ShopProvider";

type CustomerRow = {
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city: string;
  province: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("fa-IR")} تومان`;
}

export default function AdminCustomersPage() {
  const { orders } = useShop();

  const customers = useMemo(() => {
    const map = new Map<string, CustomerRow>();

    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const key = order.customer.phone.trim();
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastOrderAt) {
          existing.lastOrderAt = order.createdAt;
          existing.firstName = order.customer.firstName;
          existing.lastName = order.customer.lastName;
          existing.city = order.customer.city;
          existing.province = order.customer.province;
          existing.email = order.customer.email;
        }
      } else {
        map.set(key, {
          key,
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          phone: order.customer.phone,
          email: order.customer.email,
          city: order.customer.city,
          province: order.customer.province,
          ordersCount: 1,
          totalSpent: order.total,
          lastOrderAt: order.createdAt,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
  }, [orders]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">مشتریان</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          اطلاعات مشتریانی که حداقل یک سفارش ثبت کرده‌اند
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white py-16 text-center text-sm text-[#a96c20]">
          هنوز مشتری‌ای از طریق سفارش ثبت نشده است.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {customers.map((c) => (
              <div key={c.key} className="rounded-3xl border border-[#ead7bb] bg-white p-4">
                <p className="font-bold text-[#2e1a08]">
                  {c.firstName} {c.lastName}
                </p>
                <div className="mt-2">
                  <PhoneBadge phone={c.phone} />
                </div>
                {c.email && (
                  <p dir="ltr" className="mt-2 text-xs text-[#a96c20]">
                    {c.email}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#a96c20]">
                  {c.province} / {c.city}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-[#fffaf5] px-3 py-2">
                    <p className="text-[#a96c20]">سفارش‌ها</p>
                    <p className="mt-1 font-bold text-[#2e1a08]">
                      {c.ordersCount.toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#fffaf5] px-3 py-2">
                    <p className="text-[#a96c20]">مجموع خرید</p>
                    <p className="mt-1 font-bold text-[#4e2e0e]">{formatMoney(c.totalSpent)}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-1.5 text-[11px] text-[#a96c20]">آخرین سفارش</p>
                  <DateTimeBadge value={c.lastOrderAt} />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-3xl border border-[#ead7bb] bg-white md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-[#fffaf5] text-[#6d4014]">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">نام</th>
                  <th className="px-4 py-3 text-right font-medium">تماس</th>
                  <th className="px-4 py-3 text-right font-medium">شهر</th>
                  <th className="px-4 py-3 text-right font-medium">تعداد سفارش</th>
                  <th className="px-4 py-3 text-right font-medium">مجموع خرید</th>
                  <th className="px-4 py-3 text-right font-medium">آخرین سفارش</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.key} className="border-t border-[#f1e3cf]">
                    <td className="px-4 py-3 align-middle font-bold text-[#2e1a08]">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <PhoneBadge phone={c.phone} />
                      {c.email && (
                        <p dir="ltr" className="mt-1.5 text-[11px] text-[#a96c20]">
                          {c.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-[#6d4014]">
                      {c.province} / {c.city}
                    </td>
                    <td className="px-4 py-3 align-middle font-bold">
                      {c.ordersCount.toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3 align-middle whitespace-nowrap font-bold text-[#4e2e0e]">
                      {formatMoney(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <DateTimeBadge value={c.lastOrderAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
