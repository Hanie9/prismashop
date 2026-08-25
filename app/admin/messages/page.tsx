"use client";

import { FormEvent, useEffect, useState } from "react";
import DialogCloseButton from "../../components/DialogCloseButton";
import PageLoader from "../../components/PageLoader";
import { api, type ContactMessage } from "../../lib/api";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeleteMessageDialog({
  message,
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  message: ContactMessage | null;
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={busy ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-message-dialog-title"
        className="relative w-full max-w-md rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
      >
        <h2 id="delete-message-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          حذف پیام
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">
          آیا مطمئن هستید که می‌خواهید پیام «{message.subject}» را حذف کنید؟ این عمل قابل بازگشت نیست.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "در حال حذف…" : "بله، حذف شود"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.adminListContactMessages();
      setMessages(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری پیام‌ها ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openMessage = async (message: ContactMessage) => {
    setSelected(message);
    setReplyDraft(message.reply || "");
    setReplyError("");
    if (message.isRead) return;
    setBusyId(message.id);
    try {
      const updated = await api.adminUpdateContactMessage(message.id, { isRead: true });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelected(updated);
      setReplyDraft(updated.reply || "");
    } catch {
      // keep unread if mark-read fails
    } finally {
      setBusyId(null);
    }
  };

  const toggleRead = async (message: ContactMessage) => {
    setBusyId(message.id);
    setError("");
    try {
      const updated = await api.adminUpdateContactMessage(message.id, {
        isRead: !message.isRead,
      });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      if (selected?.id === updated.id) {
        setSelected(updated);
        setReplyDraft(updated.reply || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "به‌روزرسانی وضعیت ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const saveReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const reply = replyDraft.trim();
    if (!reply) {
      setReplyError("متن پاسخ را وارد کنید.");
      return;
    }
    setReplySaving(true);
    setReplyError("");
    try {
      const updated = await api.adminUpdateContactMessage(selected.id, { reply });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelected(updated);
      setReplyDraft(updated.reply || "");
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "ارسال پاسخ ناموفق بود.");
    } finally {
      setReplySaving(false);
    }
  };

  const clearReply = async () => {
    if (!selected) return;
    if (!confirm("پاسخ این پیام حذف شود؟")) return;
    setReplySaving(true);
    setReplyError("");
    try {
      const updated = await api.adminUpdateContactMessage(selected.id, { reply: "" });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setSelected(updated);
      setReplyDraft("");
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "حذف پاسخ ناموفق بود.");
    } finally {
      setReplySaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError("");
    try {
      await api.adminDeleteContactMessage(deleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف پیام ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const unrepliedCount = messages.filter((m) => !m.reply).length;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">پیام‌های تماس با ما</h1>
        <p className="mt-1 text-sm text-[#6d4014]">
          پیام‌های ارسال‌شده را ببینید و پاسخ پشتیبانی ثبت کنید
        </p>
        <p className="mt-2 text-xs text-[#a96c20]">
          {messages.length.toLocaleString("fa-IR")} پیام
          {unreadCount > 0
            ? ` · ${unreadCount.toLocaleString("fa-IR")} خوانده‌نشده`
            : ""}
          {unrepliedCount > 0
            ? ` · ${unrepliedCount.toLocaleString("fa-IR")} بدون پاسخ`
            : ""}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {messages.length === 0 ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white p-10 text-center text-[#6d4014]">
          هنوز پیامی ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-3xl border bg-white p-4 sm:p-5 ${
                message.isRead ? "border-[#ead7bb]" : "border-[#c2883a] bg-[#fffaf5]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  onClick={() => void openMessage(message)}
                  className="min-w-0 flex-1 text-right"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {!message.isRead ? (
                      <span className="rounded-full bg-[#6d4014] px-2 py-0.5 text-[10px] font-bold text-white">
                        جدید
                      </span>
                    ) : null}
                    {message.reply ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        پاسخ داده شده
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        بدون پاسخ
                      </span>
                    )}
                    <p className="font-bold text-[#2e1a08]">{message.subject}</p>
                  </div>
                  <p className="mt-1 text-sm text-[#6d4014]">
                    {message.firstName} {message.lastName}
                    <span className="mx-1 text-[#d4a96a]">·</span>
                    {formatDateTime(message.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-[#4e2e0e]">{message.message}</p>
                </button>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === message.id}
                    onClick={() => void openMessage(message)}
                    className="rounded-xl border border-[#ead7bb] px-3 py-2 text-xs font-medium text-[#6d4014] disabled:opacity-50"
                  >
                    {message.reply ? "مشاهده / ویرایش پاسخ" : "پاسخ"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === message.id}
                    onClick={() => void toggleRead(message)}
                    className="rounded-xl border border-[#ead7bb] px-3 py-2 text-xs font-medium text-[#6d4014] disabled:opacity-50"
                  >
                    {message.isRead ? "خوانده‌نشده" : "خوانده‌شده"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === message.id}
                    onClick={() => setDeleteTarget(message)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#2e1a08]">{selected.subject}</h2>
                <p className="mt-1 text-sm text-[#a96c20]">
                  {formatDateTime(selected.createdAt)}
                </p>
              </div>
              <DialogCloseButton
                onClick={() => {
                  setSelected(null);
                  setReplyError("");
                }}
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <span className="text-[#a96c20]">نام:</span>{" "}
                  <span className="font-medium text-[#2e1a08]">
                    {selected.firstName} {selected.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-[#a96c20]">موبایل:</span>{" "}
                  <a
                    href={`tel:${selected.mobile}`}
                    className="font-medium text-[#6d4014] hover:underline"
                    dir="ltr"
                  >
                    {selected.mobile}
                  </a>
                </p>
                <p className="sm:col-span-2">
                  <span className="text-[#a96c20]">ایمیل:</span>{" "}
                  <a
                    href={`mailto:${selected.email}`}
                    className="font-medium text-[#6d4014] hover:underline"
                    dir="ltr"
                  >
                    {selected.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ead7bb] bg-white p-4">
              <p className="mb-2 text-xs font-bold text-[#a96c20]">متن پیام کاربر</p>
              <p className="whitespace-pre-wrap leading-8 text-[#4e2e0e]">{selected.message}</p>
            </div>

            <form onSubmit={saveReply} className="mt-4 space-y-3 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#6d4014]">پاسخ پشتیبانی</p>
                {selected.repliedAt ? (
                  <span className="text-[11px] text-[#a96c20]">
                    آخرین پاسخ: {formatDateTime(selected.repliedAt)}
                  </span>
                ) : null}
              </div>
              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                rows={5}
                placeholder="پاسخ خود را برای کاربر بنویسید..."
                className="w-full rounded-xl border border-[#ead7bb] bg-white px-3 py-2.5 text-sm leading-7 text-[#2e1a08]"
              />
              {replyError ? (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                  {replyError}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {selected.reply ? (
                  <button
                    type="button"
                    disabled={replySaving}
                    onClick={() => void clearReply()}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 disabled:opacity-50"
                  >
                    حذف پاسخ
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={replySaving}
                  className="rounded-xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {replySaving
                    ? "در حال ذخیره…"
                    : selected.reply
                      ? "به‌روزرسانی پاسخ"
                      : "ارسال پاسخ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteMessageDialog
        message={deleteTarget}
        open={deleteTarget != null}
        busy={deleteTarget != null && busyId === deleteTarget.id}
        onCancel={() => {
          if (busyId == null) setDeleteTarget(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
