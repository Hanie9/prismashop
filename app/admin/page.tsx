"use client";

import Link from "next/link";
import { useShop } from "../components/ShopProvider";

export default function AdminDashboardPage() {
  const { products, categories, coupons, orders, isLowStock } = useShop();

  const activeProducts = products.filter((p) => p.active);
  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products.filter((p) => isLowStock(p));
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing");
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const activeCoupons = coupons.filter((c) => c.active);

  const stats = [
    { label: "محصولات فعال", value: activeProducts.length, href: "/admin/products", tone: "bg-[#fff6ea]" },
    { label: "سفارش‌های باز", value: pendingOrders.length, href: "/admin/orders", tone: "bg-[#eef6ff]" },
    { label: "موجودی کم", value: lowStock.length, href: "/admin/inventory", tone: "bg-[#fff1f0]" },
    { label: "دسته‌بندی‌ها", value: categories.length, href: "/admin/categories", tone: "bg-[#f3fff0]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">داشبورد</h1>
        <p className="mt-1 text-sm text-[#6d4014]">نمای کلی فروشگاه پریسما شاپ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-3xl border border-[#ead7bb] ${stat.tone} p-5 transition hover:border-[#d4a96a]`}
          >
            <p className="text-sm text-[#6d4014]">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-[#2e1a08]">
              {stat.value.toLocaleString("fa-IR")}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#ead7bb] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-[#2e1a08]">آخرین سفارش‌ها</h2>
            <Link href="/admin/orders" className="text-xs font-medium text-[#a96c20]">
              همه سفارش‌ها
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#a96c20]">هنوز سفارشی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-[#2e1a08]">{order.trackingCode}</p>
                    <p className="text-xs text-[#a96c20]">
                      {order.customer.firstName} {order.customer.lastName} · {order.customer.phone}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#4e2e0e]">
                      {order.total.toLocaleString("fa-IR")} تومان
                    </p>
                    <p className="text-xs text-[#a96c20]">{statusLabel(order.status)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#ead7bb] bg-white p-5">
            <h2 className="font-bold text-[#2e1a08]">فروش تاییدشده</h2>
            <p className="mt-3 text-2xl font-black text-[#6d4014]">
              {revenue.toLocaleString("fa-IR")}
              <span className="ms-[1mm] inline-block text-sm font-medium">تومان</span>
            </p>
            <p className="mt-2 text-xs text-[#a96c20]">
              {orders.filter((o) => o.status !== "cancelled").length.toLocaleString("fa-IR")} سفارش
            </p>
          </div>

          <div className="rounded-3xl border border-[#ead7bb] bg-white p-5">
            <h2 className="font-bold text-[#2e1a08]">هشدار موجودی</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between text-[#6d4014]">
                <span>کم‌موجود</span>
                <span className="font-bold">{lowStock.length.toLocaleString("fa-IR")}</span>
              </li>
              <li className="flex justify-between text-red-600">
                <span>ناموجود</span>
                <span className="font-bold">{outOfStock.length.toLocaleString("fa-IR")}</span>
              </li>
              <li className="flex justify-between text-[#6d4014]">
                <span>کدهای تخفیف فعال</span>
                <span className="font-bold">{activeCoupons.length.toLocaleString("fa-IR")}</span>
              </li>
            </ul>
            <Link
              href="/admin/inventory"
              className="mt-4 block rounded-2xl bg-[#fff1f0] py-2.5 text-center text-xs font-bold text-red-600"
            >
              مدیریت موجودی
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "در انتظار",
    processing: "در حال پردازش",
    shipped: "ارسال شده",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
  };
  return map[status] ?? status;
}
