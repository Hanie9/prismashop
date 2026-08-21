"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BackLink from "../../components/BackLink";
import PageLoader from "../../components/PageLoader";
import PriceText from "../../components/PriceText";
import { useAuth } from "../../components/SessionProvider";
import { api } from "../../lib/api";
import type { Order } from "../../lib/shop-types";

const statusLabel: Record<Order["status"], string> = {
  pending: "در انتظار",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { ready, isCustomer, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace(`/auth/login?next=${encodeURIComponent("/account/orders")}`);
      return;
    }
    if (!isCustomer) {
      setLoading(false);
      setError("تاریخچه سفارش فقط برای حساب مشتری در دسترس است.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await api.myOrders();
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "بارگذاری سفارش‌ها ناموفق بود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, isLoggedIn, isCustomer, router]);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-[#2e1a08] sm:text-3xl">سفارش‌های من</h1>
          <Link href="/products" className="text-sm font-medium text-[#8a5419] hover:underline">
            ادامه خرید
          </Link>
        </div>

        {loading && <PageLoader fullScreen={false} />}
        {error && (
          <div className="mb-4 space-y-3">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
            <BackLink href="/">بازگشت به صفحه اصلی</BackLink>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-3xl border border-[#e8cfa8] bg-white p-10 text-center">
            <p className="mb-4 text-[#6d4014]">هنوز سفارشی ثبت نکرده‌اید.</p>
            <Link
              href="/products"
              className="inline-flex rounded-full bg-[#8a5419] px-6 py-3 text-sm font-bold text-white"
            >
              مشاهده محصولات
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border border-[#e8cfa8] bg-white p-4 sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-[#a96c20]">کد پیگیری</p>
                  <p className="font-bold tracking-wide text-[#2e1a08]" dir="ltr">
                    {order.trackingCode}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff6ea] px-3 py-1 text-xs font-bold text-[#8a5419]">
                  {statusLabel[order.status]}
                </span>
              </div>
              <p className="mb-3 text-xs text-[#6d4014]">
                {new Date(order.createdAt).toLocaleString("fa-IR")}
              </p>
              <ul className="mb-3 space-y-1 text-sm text-[#4e2e0e]">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`} className="flex justify-between gap-3">
                    <span>
                      {item.name} × {item.qty.toLocaleString("fa-IR")}
                    </span>
                    <span dir="ltr">
                      {(item.price * item.qty).toLocaleString("fa-IR")}
                      <span className="ms-[1mm] inline-block">تومان</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-[#f1e3cf] pt-3 text-sm font-bold text-[#2e1a08]">
                <span>مبلغ نهایی</span>
                <span>
                  <PriceText amount={order.total} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
