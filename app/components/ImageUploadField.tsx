"use client";

import { useRef, useState } from "react";
import { api } from "../lib/api";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
};

export default function ImageUploadField({ value, onChange, label = "تصویر محصول" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const uploaded = await api.uploadImage(file);
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#4e2e0e]">{label}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-[#ead7bb] bg-[#fffaf5] sm:mx-0">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[#a96c20]">
              بدون تصویر
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-4 py-3 text-sm font-bold text-[#6d4014] transition hover:border-[#d4a96a] disabled:opacity-60 sm:w-auto"
          >
            {loading ? "در حال آپلود..." : "انتخاب از دستگاه"}
          </button>
          <p className="text-xs leading-6 text-[#a96c20]">
            می‌توانید عکس را از گالری یا فایل‌های گوشی/کامپیوتر انتخاب کنید. تصویر به‌صورت خودکار فشرده می‌شود.
          </p>
          <label className="block text-xs font-medium text-[#6d4014]">
            یا آدرس تصویر (اختیاری)
            <input
              value={value.startsWith("data:") ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#ead7bb] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#d4a96a]"
              dir="ltr"
              placeholder="https://... یا /images/..."
            />
          </label>
          {value.startsWith("data:") && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-medium text-red-600"
            >
              حذف تصویر انتخاب‌شده
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
