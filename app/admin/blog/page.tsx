"use client";

import { FormEvent, useEffect, useState } from "react";
import DialogCloseButton from "../../components/DialogCloseButton";
import ImageUploadField from "../../components/ImageUploadField";
import PageLoader from "../../components/PageLoader";
import { api, type BlogPost } from "../../lib/api";
import { formatBlogDate, formatReadTime } from "../../lib/blog-format";

type FormState = {
  id: number | null;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  readTimeMinutes: string;
  content: string;
  published: boolean;
};

const emptyForm = (): FormState => ({
  id: null,
  slug: "",
  title: "",
  excerpt: "",
  cover: "",
  category: "حروف کالیگرافی",
  readTimeMinutes: "5",
  content: "",
  published: true,
});

function slugFromTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseContent(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function contentToText(content: string[]) {
  return content.join("\n");
}

function DeleteBlogDialog({
  post,
  open,
  busy,
  onCancel,
  onConfirm,
}: {
  post: BlogPost | null;
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

  if (!open || !post) return null;

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
        aria-labelledby="delete-blog-dialog-title"
        className="relative max-h-[min(90dvh,28rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>
        <h2 id="delete-blog-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          حذف مقاله
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">
          آیا مطمئن هستید که می‌خواهید مقاله «{post.title}» را حذف کنید؟ این عمل قابل بازگشت نیست.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419] disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "در حال حذف…" : "بله، حذف شود"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.adminListBlogPosts();
      setPosts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری مقالات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setEditing(false);
    setForm(emptyForm());
    setError("");
    setOpen(true);
  };

  const startEdit = (post: BlogPost) => {
    setEditing(true);
    setForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      cover: post.cover,
      category: post.category,
      readTimeMinutes: String(post.readTimeMinutes),
      content: contentToText(post.content),
      published: post.published,
    });
    setError("");
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const slug = form.slug.trim() || slugFromTitle(form.title);
    const readTimeMinutes = Number(form.readTimeMinutes);
    const content = parseContent(form.content);

    if (!form.title.trim() || !form.excerpt.trim()) {
      setError("عنوان و خلاصه مقاله الزامی است.");
      setSaving(false);
      return;
    }
    if (!slug) {
      setError("شناسه مقاله (slug) الزامی است.");
      setSaving(false);
      return;
    }
    if (!form.cover.trim()) {
      setError("لطفاً تصویر کاور را انتخاب یا وارد کنید.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(readTimeMinutes) || readTimeMinutes < 1) {
      setError("زمان مطالعه باید عدد معتبر باشد.");
      setSaving(false);
      return;
    }
    if (content.length === 0) {
      setError("متن مقاله باید حداقل یک پاراگراف داشته باشد (هر خط یک پاراگراف).");
      setSaving(false);
      return;
    }

    const body = {
      slug,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      cover: form.cover.trim(),
      category: form.category.trim() || "حروف کالیگرافی",
      readTimeMinutes,
      content,
      published: form.published,
    };

    try {
      if (editing && form.id != null) {
        const updated = await api.adminUpdateBlogPost(form.id, body);
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const created = await api.adminCreateBlogPost(body);
        setPosts((prev) => [created, ...prev]);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ذخیره مقاله ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError("");
    try {
      await api.adminDeleteBlogPost(deleteTarget.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف مقاله ناموفق بود.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2e1a08] sm:text-2xl">بلاگ</h1>
          <p className="mt-1 text-sm text-[#6d4014]">
            عنوان، متن، تصویر و انتشار مقالات را مدیریت کنید
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="w-full rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white sm:w-auto"
        >
          + مقاله جدید
        </button>
      </div>

      {error && !open ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-[#ead7bb] bg-white p-10 text-center text-[#6d4014]">
          هنوز مقاله‌ای ثبت نشده است.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="overflow-hidden rounded-3xl border border-[#ead7bb] bg-white"
            >
              <img src={post.cover} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#2e1a08]">{post.title}</p>
                    <p className="mt-1 text-xs text-[#a96c20]">
                      {post.category} · {formatReadTime(post.readTimeMinutes)}
                    </p>
                    <p className="mt-1 text-xs text-[#6d4014]">{formatBlogDate(post.createdAt)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      post.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {post.published ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-[#6d4014]">{post.excerpt}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(post)}
                    className="rounded-xl border border-[#ead7bb] px-3 py-2 text-xs font-medium text-[#6d4014]"
                  >
                    ویرایش
                  </button>
                  <button
                    type="button"
                    disabled={busyId === post.id}
                    onClick={() => setDeleteTarget(post)}
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

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#2e1a08]">
                {editing ? "ویرایش مقاله" : "مقاله جدید"}
              </h2>
              <DialogCloseButton onClick={() => setOpen(false)} />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-[#4e2e0e]">عنوان</span>
                <input
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      title,
                      slug: editing ? prev.slug : slugFromTitle(title),
                    }));
                  }}
                  className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm"
                  required
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-[#4e2e0e]">شناسه (slug)</span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  dir="ltr"
                  className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm"
                  placeholder="calligraphy-decor-guide"
                  required
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-[#4e2e0e]">خلاصه</span>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm"
                  required
                />
              </label>

              <ImageUploadField
                label="تصویر کاور"
                value={form.cover}
                onChange={(cover) => setForm((prev) => ({ ...prev, cover }))}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[#4e2e0e]">دسته‌بندی</span>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-[#4e2e0e]">زمان مطالعه (دقیقه)</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={form.readTimeMinutes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, readTimeMinutes: e.target.value }))
                    }
                    className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium text-[#4e2e0e]">متن مقاله</span>
                <span className="block text-xs text-[#a96c20]">هر خط یک پاراگراف است.</span>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full rounded-xl border border-[#ead7bb] px-3 py-2.5 text-sm leading-7"
                  required
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[#4e2e0e]">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
                  className="h-4 w-4 rounded border-[#ead7bb]"
                />
                منتشر شده (در سایت نمایش داده شود)
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[#ead7bb] px-4 py-2.5 text-sm font-medium text-[#6d4014]"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? "در حال ذخیره…" : editing ? "ذخیره تغییرات" : "افزودن مقاله"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteBlogDialog
        post={deleteTarget}
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
