"use client";

import { FormEvent, useState } from "react";
import DialogCloseButton from "../../components/DialogCloseButton";
import ImageUploadField from "../../components/ImageUploadField";
import { useShop } from "../../components/ShopProvider";
import type { Category } from "../../lib/shop-types";

const empty = { id: "", name: "", icon: "🪵", image: "" };

export default function AdminCategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory } =
    useShop();
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const startCreate = () => {
    setEditing(false);
    setForm(empty);
    setError("");
    setOpen(true);
  };

  const startEdit = (cat: Category) => {
    setEditing(true);
    setForm({ ...cat });
    setError("");
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const id = form.id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id || !form.name.trim()) {
      setError("شناسه و نام دسته‌بندی الزامی است.");
      return;
    }
    if (!form.image.trim()) {
      setError("لطفاً تصویر دسته را از دستگاه انتخاب کنید یا آدرس وارد کنید.");
      return;
    }

    try {
      if (editing) {
        await updateCategory(form.id, {
          name: form.name.trim(),
          icon: form.icon.trim() || "📦",
          image: form.image.trim(),
        });
      } else {
        if (categories.some((c) => c.id === id)) {
          setError("این شناسه دسته‌بندی از قبل وجود دارد.");
          return;
        }
        await addCategory({
          id,
          name: form.name.trim(),
          icon: form.icon.trim() || "📦",
          image: form.image.trim(),
        });
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره ناموفق بود.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-[#6d4014]">نام، آیکون و تصویر دسته‌ها را مدیریت کنید</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="w-full rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white sm:w-auto"
        >
          + دسته جدید
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <div key={cat.id} className="overflow-hidden rounded-3xl border border-[#ead7bb] bg-white">
              <img src={cat.image} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#2e1a08]">{cat.name}</p>
                    <p className="text-xs text-[#a96c20]">
                      {cat.id} · {count.toLocaleString("fa-IR")} محصول
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(cat)}
                    className="rounded-xl border border-[#ead7bb] px-3 py-2 text-xs font-medium text-[#6d4014]"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (count > 0) {
                        alert("ابتدا محصولات این دسته را منتقل یا حذف کنید.");
                        return;
                      }
                      if (confirm("حذف این دسته‌بندی؟")) deleteCategory(cat.id);
                    }}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2e1a08]/45 p-3 sm:p-4">
          <form
            onSubmit={onSubmit}
            className="max-h-[min(90dvh,40rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-4 shadow-xl sm:rounded-[28px] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#2e1a08]">
                {editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
              </h2>
              <DialogCloseButton onClick={() => setOpen(false)} />
            </div>
            {!editing && (
              <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
                شناسه انگلیسی
                <input
                  required
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
                  dir="ltr"
                  placeholder="calligraphy"
                />
              </label>
            )}
            <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
              نام فارسی
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
              آیکون (ایموجی)
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm"
              />
            </label>
            <div className="mb-3">
              <ImageUploadField
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
                label="تصویر دسته‌بندی"
              />
            </div>
            {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-[#ead7bb] px-5 py-2.5 text-sm text-[#6d4014]"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white"
              >
                ذخیره
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
