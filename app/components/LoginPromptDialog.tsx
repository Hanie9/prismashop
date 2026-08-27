"use client";

import { useEffect } from "react";

export default function LoginPromptDialog({
  open,
  title = "ورود به حساب کاربری",
  description = "برای ادامه ابتدا باید وارد حساب کاربری شوید یا ثبت نام کنید. می‌خواهید به صفحه ورود بروید؟",
  cancelLabel = "فعلا نه",
  confirmLabel = "رفتن به ورود",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-dialog-title"
        className="relative w-full max-w-md rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4e5] text-[#8a5419]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </div>
        <h2 id="login-prompt-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          {title}
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">{description}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-[#8a5419] py-3 text-sm font-bold text-white transition-colors hover:bg-[#6d4014]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
