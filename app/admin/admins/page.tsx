"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminBottomSheet from "../../components/AdminBottomSheet";
import { useAuth } from "../../components/SessionProvider";
import { api, type AdminUser } from "../../lib/api";

const emptyForm = {
  mobile: "",
  firstName: "مدیر",
  lastName: "سایت",
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminAdminsPage() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setError("");
    try {
      setAdmins(await api.listAdmins());
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری مدیران ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  };

  const startEdit = (row: AdminUser) => {
    setEditing(row);
    setForm({
      mobile: row.mobile ?? "",
      firstName: row.firstName,
      lastName: row.lastName,
    });
    setFormError("");
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const mobile = form.mobile.trim();
    if (!mobile) {
      setFormError("شماره موبایل الزامی است.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await api.updateAdmin(editing.id, {
          mobile,
          firstName: form.firstName.trim() || "مدیر",
          lastName: form.lastName.trim() || "سایت",
        });
        setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await api.createAdmin({
          mobile,
          firstName: form.firstName.trim() || "مدیر",
          lastName: form.lastName.trim() || "سایت",
        });
        setAdmins((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ذخیره ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: AdminUser) => {
    setBusyId(row.id);
    try {
      const updated = await api.updateAdmin(row.id, { isActive: !row.isActive });
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "به‌روزرسانی ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: AdminUser) => {
    if (!confirm(`حذف ادمین با شماره ${row.mobile ?? "—"}؟`)) return;

    setBusyId(row.id);
    try {
      await api.deleteAdmin(row.id);
      setAdmins((prev) => prev.filter((a) => a.id !== row.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "حذف ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">مدیران</h1>
          <p className="mt-1 text-sm text-[#6d4014]">
            افزودن و مدیریت دسترسی ادمین‌ها با شماره موبایل
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="w-full rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white sm:w-auto"
        >
          + ادمین جدید
        </button>
      </div>

      {error && !open ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white p-10 text-center text-[#6d4014]">
          در حال بارگذاری...
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#e8cfa8] bg-white px-6 py-14 text-center">
          <p className="text-lg font-bold text-[#2e1a08]">هنوز ادمینی ثبت نشده</p>
          <button
            type="button"
            onClick={startCreate}
            className="mt-6 rounded-2xl bg-[#6d4014] px-6 py-2.5 text-sm font-bold text-white"
          >
            افزودن اولین ادمین
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#ead7bb] bg-white">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[#fffaf5] text-[#6d4014]">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">نام</th>
                  <th className="px-4 py-3 text-right font-medium">موبایل</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">تاریخ افزودن</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((row) => {
                  const isSelf = currentAdmin?.id === row.id;
                  return (
                    <tr key={row.id} className="border-t border-[#f1e3cf]">
                      <td className="px-4 py-3 font-medium text-[#2e1a08]">
                        {row.firstName} {row.lastName}
                        {isSelf ? (
                          <span className="mr-2 rounded-full bg-[#fff6ea] px-2 py-0.5 text-[10px] font-bold text-[#8a5419]">
                            شما
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3" dir="ltr">
                        {row.mobile ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={busyId === row.id || isSelf}
                          onClick={() => toggleActive(row)}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold disabled:opacity-50 ${
                            row.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {row.isActive ? "فعال" : "غیرفعال"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#6d4014]">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="rounded-xl border border-[#ead7bb] px-3 py-1.5 text-xs font-medium text-[#6d4014]"
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            disabled={busyId === row.id || isSelf}
                            onClick={() => handleDelete(row)}
                            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 disabled:opacity-50"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {admins.map((row) => {
              const isSelf = currentAdmin?.id === row.id;
              return (
                <div key={row.id} className="rounded-2xl border border-[#f1e3cf] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#2e1a08]">
                        {row.firstName} {row.lastName}
                        {isSelf ? (
                          <span className="mr-2 rounded-full bg-[#fff6ea] px-2 py-0.5 text-[10px] font-bold text-[#8a5419]">
                            شما
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-[#6d4014]" dir="ltr">
                        {row.mobile ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-[#a96c20]">{formatDate(row.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === row.id || isSelf}
                      onClick={() => toggleActive(row)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold disabled:opacity-50 ${
                        row.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {row.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="rounded-xl border border-[#ead7bb] py-2 text-xs font-medium text-[#6d4014]"
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id || isSelf}
                      onClick={() => handleDelete(row)}
                      className="rounded-xl border border-red-200 py-2 text-xs font-medium text-red-600 disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AdminBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "ویرایش ادمین" : "ادمین جدید"}
        onSubmit={onSubmit}
        maxWidth="lg"
      >
        <label className="mb-3 block text-sm font-medium text-[#4e2e0e]">
          شماره موبایل
          <input
            required
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]"
            dir="ltr"
            placeholder="09123456789"
            inputMode="tel"
          />
        </label>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#4e2e0e]">
            نام
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]"
            />
          </label>
          <label className="block text-sm font-medium text-[#4e2e0e]">
            نام خانوادگی
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]"
            />
          </label>
        </div>
        {formError ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{formError}</p>
        ) : null}
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
            disabled={saving}
            className="rounded-2xl bg-[#6d4014] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </AdminBottomSheet>
    </div>
  );
}
