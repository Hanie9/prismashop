"use client";

import { useRef, useState } from "react";
import { api } from "../lib/api";
import { MAX_PRODUCT_IMAGES } from "../lib/product-images";

type Props = {
  value: string[];
  onChange: (images: string[]) => void;
  label?: string;
  max?: number;
};

export default function MultiImageUploadField({
  value,
  onChange,
  label = "تصاویر محصول",
  max = MAX_PRODUCT_IMAGES,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const remaining = Math.max(0, max - value.length);

  const addImages = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("فقط فایل تصویری مجاز است.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const slots = Math.min(remaining, list.length);
      if (slots <= 0) {
        setError(`حداکثر ${max.toLocaleString("fa-IR")} تصویر می‌توانید اضافه کنید.`);
        return;
      }
      if (list.length > slots) {
        setError(`فقط ${slots.toLocaleString("fa-IR")} تصویر دیگر قابل افزودن است.`);
      }

      const next: string[] = [...value];
      for (let i = 0; i < slots; i += 1) {
        const uploaded = await api.uploadImage(list[i]);
        next.push(uploaded.url);
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveToCover = (index: number) => {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    if (remaining <= 0) {
      setError(`حداکثر ${max.toLocaleString("fa-IR")} تصویر می‌توانید اضافه کنید.`);
      return;
    }
    onChange([...value, url]);
    setUrlDraft("");
    setError("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#4e2e0e]">{label}</p>
        <p className="text-xs text-[#a96c20]">
          {value.length.toLocaleString("fa-IR")} از {max.toLocaleString("fa-IR")} تصویر
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, index) => (
          <div
            key={`${index}-${src.slice(0, 24)}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-[#ead7bb] bg-[#fffaf5]"
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-[#6d4014] px-2 py-0.5 text-[10px] font-bold text-white">
                کاور
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-[#2e1a08]/70 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {index !== 0 && (
                <button
                  type="button"
                  onClick={() => moveToCover(index)}
                  className="flex-1 rounded-lg bg-white/90 py-1 text-[10px] font-bold text-[#6d4014]"
                >
                  کاور
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="flex-1 rounded-lg bg-red-500/90 py-1 text-[10px] font-bold text-white"
              >
                حذف
              </button>
            </div>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#d4a96a] bg-[#fffaf5] text-[#a96c20] transition hover:border-[#8a5419] hover:text-[#6d4014] disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="px-1 text-[10px] font-medium">
              {loading ? "..." : "افزودن"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void addImages(e.target.files);
        }}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={loading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-4 py-2.5 text-sm font-bold text-[#6d4014] transition hover:border-[#d4a96a] disabled:opacity-50"
        >
          {loading ? "در حال آماده‌سازی..." : "انتخاب چند عکس از دستگاه"}
        </button>
      </div>

      <p className="text-xs leading-6 text-[#a96c20]">
        چند تصویر را همزمان انتخاب کنید. تصویر اول به‌عنوان کاور در لیست محصولات نمایش داده می‌شود.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-xs font-medium text-[#6d4014]">
          افزودن با آدرس (اختیاری)
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]"
            dir="ltr"
            placeholder="https://..."
          />
        </label>
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlDraft.trim() || remaining <= 0}
          className="rounded-2xl bg-[#6d4014] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          افزودن لینک
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
