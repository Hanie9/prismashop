"use client";

import { FormEvent, useState } from "react";
import DialogCloseButton from "../../components/DialogCloseButton";
import SelectDropdown from "../../components/SelectDropdown";
import { useShop } from "../../components/ShopProvider";
import type { Coupon } from "../../lib/shop-types";

const empty = {
  id: "",
  code: "",
  type: "percent" as Coupon["type"],
  value: "",
  active: true,
  minOrder: "0",
};

const typeOptions = [
  { value: "percent", label: "درصدی" },
  { value: "fixed", label: "مبلغ ثابت" },
];

export default function AdminDiscountsPage() {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useShop();
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    setOpenDropdown(null);
    setOpen(true);
  };

  const startEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      active: coupon.active,
      minOrder: String(coupon.minOrder),
    });
    setOpenDropdown(null);
    setOpen(true);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    if (!code) return;
    const value = Number(form.value) || 0;
    const minOrder = Math.max(0, Number(form.minOrder) || 0);
    if (form.type === "percent" && (value <= 0 || value > 100)) {
      alert("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.");
      return;
    }
    if (form.type === "fixed" && value <= 0) {
      alert("مبلغ تخفیف باید بیشتر از صفر باشد.");
      return;
    }

    if (editingId) {
      updateCoupon(editingId, {
        code,
        type: form.type,
        value,
        active: form.active,
        minOrder,
      });
    } else {
      const id = `coupon-${Date.now()}`;
      if (coupons.some((c) => c.code.toUpperCase() === code)) {
        alert("این کد تخفیف از قبل وجود دارد.");
        return;
      }
      addCoupon({ id, code, type: form.type, value, active: form.active, minOrder });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">تخفیف‌ها</h1>
          <p className="mt-1 text-sm text-[#6d4014]">کدهای تخفیف درصدی و مبلغی را مدیریت کنید</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="w-full rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white sm:w-auto"
        >
          + کد تخفیف
        </button>
      </div>

      <div className="grid gap-3">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="flex flex-col gap-3 rounded-3xl border border-[#ead7bb] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 text-right">
              <p className="font-black tracking-wide text-[#2e1a08]">
                <span dir="ltr" className="inline-block">
                  {coupon.code}
                </span>
              </p>
              <p className="mt-1 text-sm leading-7 text-[#6d4014]">
                {coupon.type === "percent"
                  ? `${coupon.value.toLocaleString("fa-IR")}٪ تخفیف`
                  : `${coupon.value.toLocaleString("fa-IR")} تومان تخفیف`}
                {coupon.minOrder > 0 &&
                  ` · حداقل سفارش ${coupon.minOrder.toLocaleString("fa-IR")} تومان`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => updateCoupon(coupon.id, { active: !coupon.active })}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  coupon.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {coupon.active ? "فعال" : "غیرفعال"}
              </button>
              <button
                type="button"
                onClick={() => startEdit(coupon)}
                className="rounded-xl border border-[#ead7bb] px-3 py-1.5 text-xs font-medium text-[#6d4014]"
              >
                ویرایش
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("حذف این کد تخفیف؟")) deleteCoupon(coupon.id);
                }}
                className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e1a08]/45 p-3 sm:p-4">
          <form
            onSubmit={onSubmit}
            className="max-h-[min(90dvh,36rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-4 shadow-xl sm:rounded-[28px] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#2e1a08]">
                {editingId ? "ویرایش تخفیف" : "تخفیف جدید"}
              </h2>
              <DialogCloseButton
                onClick={() => {
                  setOpenDropdown(null);
                  setOpen(false);
                }}
              />
            </div>
            <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
              کد تخفیف
              <input
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
                dir="ltr"
              />
            </label>
            <div className="mb-3">
              <p className="mb-1.5 text-sm font-medium text-[#4e2e0e]">نوع</p>
              <SelectDropdown
                id="discount-type"
                label="نوع تخفیف"
                value={form.type}
                options={typeOptions}
                open={openDropdown === "discount-type"}
                onOpenChange={setOpenDropdown}
                onChange={(value) =>
                  setForm({ ...form, type: value as Coupon["type"] })
                }
              />
            </div>
            <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
              مقدار
              <input
                required
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
                dir="ltr"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
              حداقل مبلغ سفارش
              <input
                type="number"
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
                dir="ltr"
              />
            </label>
            <label className="mb-4 flex items-center gap-2 text-sm text-[#4e2e0e]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              فعال باشد
            </label>
            <div className="flex gap-2">
              <button type="submit" className="rounded-2xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white">
                ذخیره
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  setOpen(false);
                }}
                className="rounded-2xl border border-[#ead7bb] px-5 py-2.5 text-sm text-[#6d4014]"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
