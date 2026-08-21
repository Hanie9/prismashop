"use client";

import { useMemo, useState } from "react";
import { DateTimeBadge, PhoneBadge } from "../../components/AdminMeta";
import DialogCloseButton from "../../components/DialogCloseButton";
import SelectDropdown from "../../components/SelectDropdown";
import { useShop } from "../../components/ShopProvider";
import type { Order } from "../../lib/shop-types";

const statusOptions: { value: Order["status"]; label: string }[] = [
  { value: "pending", label: "در انتظار" },
  { value: "processing", label: "در حال پردازش" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "cancelled", label: "لغو شده" },
];

const statusTone: Record<Order["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-sky-50 text-sky-700 border-sky-200",
  shipped: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

function formatMoney(value: number) {
  return (
    <>
      {value.toLocaleString("fa-IR")}
      <span className="ms-[1mm] inline-block">تومان</span>
    </>
  );
}

function CustomerCell({
  firstName,
  lastName,
  phone,
}: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-bold text-[#2e1a08]">
        {firstName} {lastName}
      </p>
      <div className="mt-1.5">
        <PhoneBadge phone={phone} />
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useShop();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Order["status"] | "all">("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<Record<string, Order["status"]>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const selectedDraft = selected
    ? (draftStatus[selected.id] ?? selected.status)
    : null;
  const selectedStatusLabel =
    statusOptions.find((o) => o.value === (selectedDraft ?? selected?.status))?.label ?? "";

  const getDraft = (order: Order) => draftStatus[order.id] ?? order.status;
  const isDirty = (order: Order) => getDraft(order) !== order.status;

  const setDraft = (orderId: string, status: Order["status"]) => {
    setSaveError("");
    setDraftStatus((prev) => ({ ...prev, [orderId]: status }));
  };

  const saveStatus = async (order: Order) => {
    const next = getDraft(order);
    if (next === order.status) return;
    setSavingId(order.id);
    setSaveError("");
    try {
      await updateOrderStatus(order.id, next);
      setDraftStatus((prev) => {
        const { [order.id]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "ذخیره وضعیت ناموفق بود.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">سفارش‌ها</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          همه سفارش‌های ثبت‌شده توسط مشتریان در اینجا نمایش داده می‌شود
        </p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="همه" />
        {statusOptions.map((opt) => (
          <FilterChip
            key={opt.value}
            active={filter === opt.value}
            onClick={() => setFilter(opt.value)}
            label={opt.label}
          />
        ))}
      </div>

      {saveError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white py-16 text-center text-sm text-[#a96c20]">
          سفارشی برای نمایش وجود ندارد.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((order) => (
              <div key={order.id} className="rounded-3xl border border-[#ead7bb] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#2e1a08]">{order.trackingCode}</p>
                    <div className="mt-2">
                      <DateTimeBadge value={order.createdAt} />
                    </div>
                  </div>
                  <p className="shrink-0 text-left text-sm font-black text-[#4e2e0e]">
                    {formatMoney(order.total)}
                  </p>
                </div>
                <div className="mt-3">
                  <CustomerCell
                    firstName={order.customer.firstName}
                    lastName={order.customer.lastName}
                    phone={order.customer.phone}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <SelectDropdown
                    id={`mobile-${order.id}`}
                    label="وضعیت سفارش"
                    value={getDraft(order)}
                    options={statusOptions}
                    open={openDropdown === `mobile-${order.id}`}
                    onOpenChange={setOpenDropdown}
                    onChange={(value) => setDraft(order.id, value as Order["status"])}
                    size="sm"
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!isDirty(order) || savingId === order.id}
                      onClick={() => void saveStatus(order)}
                      className="flex-1 rounded-2xl bg-[#6d4014] px-4 py-2 text-xs font-bold text-white hover:bg-[#4e2e0e] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingId === order.id ? "در حال ذخیره..." : "ذخیره وضعیت"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(order.id)}
                      className="rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-2 text-xs font-medium text-[#6d4014]"
                    >
                      جزئیات
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden rounded-3xl border border-[#ead7bb] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#fffaf5] text-[#6d4014]">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">کد پیگیری</th>
                    <th className="px-4 py-3 text-right font-medium">مشتری</th>
                    <th className="px-4 py-3 text-right font-medium">مبلغ</th>
                    <th className="min-w-[16rem] px-4 py-3 text-right font-medium">وضعیت</th>
                    <th className="px-4 py-3 text-right font-medium">جزئیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr key={order.id} className="border-t border-[#f1e3cf]">
                      <td className="px-4 py-3 align-middle">
                        <p className="font-bold text-[#2e1a08]">{order.trackingCode}</p>
                        <div className="mt-2">
                          <DateTimeBadge value={order.createdAt} />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <CustomerCell
                          firstName={order.customer.firstName}
                          lastName={order.customer.lastName}
                          phone={order.customer.phone}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <p className="font-black text-[#4e2e0e]">{formatMoney(order.total)}</p>
                      </td>
                      <td className="min-w-[16rem] px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <SelectDropdown
                            id={`desk-${order.id}`}
                            label="وضعیت سفارش"
                            value={getDraft(order)}
                            options={statusOptions}
                            open={openDropdown === `desk-${order.id}`}
                            onOpenChange={setOpenDropdown}
                            onChange={(value) => setDraft(order.id, value as Order["status"])}
                            size="sm"
                            className="w-full max-w-[11.5rem]"
                          />
                          <button
                            type="button"
                            disabled={!isDirty(order) || savingId === order.id}
                            onClick={() => void saveStatus(order)}
                            className="shrink-0 rounded-2xl bg-[#6d4014] px-3 py-2 text-xs font-bold text-white hover:bg-[#4e2e0e] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingId === order.id ? "..." : "ذخیره"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedId(order.id)}
                          className="rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-3 py-1.5 text-xs font-medium text-[#6d4014]"
                        >
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e1a08]/45 p-3 sm:p-4">
          <div className="max-h-[min(92dvh,44rem)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-[#fffdf9] shadow-[0_24px_60px_rgba(89,48,10,0.2)] sm:rounded-[28px]">
            <div className="sticky top-0 z-10 border-b border-[#ead7bb] bg-gradient-to-l from-[#fff6ea] to-white px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-[#2e1a08]">{selected.trackingCode}</h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone[selected.status]}`}
                    >
                      {selectedStatusLabel}
                    </span>
                  </div>
                  <div className="mt-2">
                    <DateTimeBadge value={selected.createdAt} />
                  </div>
                </div>
                <DialogCloseButton onClick={() => setSelectedId(null)} />
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              <div className="rounded-3xl border border-[#ead7bb] bg-white p-4">
                <p className="mb-3 text-xs font-bold text-[#a96c20]">وضعیت سفارش</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <SelectDropdown
                    id={`detail-${selected.id}`}
                    label="وضعیت سفارش"
                    value={selectedDraft ?? selected.status}
                    options={statusOptions}
                    open={openDropdown === `detail-${selected.id}`}
                    onOpenChange={setOpenDropdown}
                    onChange={(value) => setDraft(selected.id, value as Order["status"])}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    disabled={!isDirty(selected) || savingId === selected.id}
                    onClick={() => void saveStatus(selected)}
                    className="rounded-2xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4e2e0e] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingId === selected.id ? "در حال ذخیره..." : "ذخیره وضعیت"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ead7bb] bg-white p-4 sm:p-5">
                <p className="mb-4 text-sm font-black text-[#2e1a08]">اطلاعات مشتری</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ea] text-base font-black text-[#8a5419]">
                    {selected.customer.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#2e1a08]">
                      {selected.customer.firstName} {selected.customer.lastName}
                    </p>
                    <div className="mt-1.5">
                      <PhoneBadge phone={selected.customer.phone} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    label="استان / شهر"
                    value={`${selected.customer.province} / ${selected.customer.city}`}
                  />
                  <InfoCard label="کد پستی" value={selected.customer.postalCode} ltr />
                  <div className="sm:col-span-2">
                    <InfoCard label="آدرس" value={selected.customer.address} />
                  </div>
                  {selected.customer.notes && (
                    <div className="sm:col-span-2">
                      <InfoCard label="یادداشت" value={selected.customer.notes} />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[#ead7bb] bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <p className="text-sm font-black text-[#2e1a08]">اقلام سفارش</p>
                  <span className="rounded-full bg-[#fff6ea] px-2.5 py-1 text-[11px] font-bold text-[#8a5419]">
                    {selected.items.length.toLocaleString("fa-IR")} قلم
                  </span>
                </div>
                <div className="space-y-3">
                  {selected.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.name}`}
                      className="flex items-center gap-3 rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] p-3"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-[#2e1a08]">{item.name}</p>
                        <p className="mt-1 text-xs text-[#a96c20]">
                          {item.qty.toLocaleString("fa-IR")} × {formatMoney(item.price)}
                        </p>
                      </div>
                      <p className="shrink-0 text-left text-sm font-black text-[#4e2e0e]">
                        {formatMoney(item.price * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#ead7bb] bg-white p-4 sm:p-5">
                <p className="mb-4 text-sm font-black text-[#2e1a08]">خلاصه مبلغ</p>
                <div className="space-y-3 text-sm">
                  <MoneyRow label="جمع کل" value={selected.subtotal} />
                  <MoneyRow
                    label="هزینه ارسال"
                    value={selected.shipping}
                    free={selected.shipping === 0}
                  />
                  {selected.discount > 0 && (
                    <MoneyRow label="تخفیف" value={-selected.discount} accent="green" />
                  )}
                  {selected.couponCode && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff6ea] px-3 py-2 text-xs text-[#8a5419]">
                      <span>کد تخفیف</span>
                      <span dir="ltr" className="font-bold tracking-wide">
                        {selected.couponCode}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 border-t border-[#f1e3cf] pt-3">
                    <span className="font-black text-[#2e1a08]">مبلغ نهایی</span>
                    <span className="text-lg font-black text-[#6d4014]">
                      {formatMoney(selected.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
        active ? "bg-[#6d4014] text-white" : "border border-[#ead7bb] bg-white text-[#6d4014]"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({
  label,
  value,
  ltr,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-3 py-2.5">
      <p className="text-[11px] text-[#a96c20]">{label}</p>
      <p
        className="mt-1 text-sm font-medium leading-6 text-[#2e1a08]"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  free,
  accent,
}: {
  label: string;
  value: number;
  free?: boolean;
  accent?: "green";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[#6d4014]">{label}</span>
      <span
        className={`font-bold ${
          accent === "green" ? "text-green-700" : "text-[#2e1a08]"
        }`}
      >
        {free ? "رایگان" : formatMoney(value)}
      </span>
    </div>
  );
}
