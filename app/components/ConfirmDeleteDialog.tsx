"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  warning?: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteDialog({
  open,
  title,
  description,
  warning,
  confirmLabel = "بله، حذف شود",
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" data-admin-sheet>
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={busy ? undefined : onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-dialog-title"
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
        <h2 id="confirm-delete-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          {title}
        </h2>
        <div className="mb-4 text-sm leading-7 text-[#6d4014]">{description}</div>
        {warning ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
            {warning}
          </div>
        ) : (
          <div className="mb-2" />
        )}
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
            {busy ? "در حال حذف…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
