"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import DialogCloseButton from "./DialogCloseButton";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  maxWidth?: "lg" | "2xl";
};

const maxWidthClass = {
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
};

export default function AdminBottomSheet({
  open,
  title,
  onClose,
  children,
  onSubmit,
  maxWidth = "2xl",
}: Props) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const panelClass = `max-h-[92dvh] w-full ${maxWidthClass[maxWidth]} overflow-y-auto overscroll-contain rounded-t-[28px] border border-[#ead7bb] bg-white p-4 shadow-xl sm:rounded-[28px] sm:p-5`;

  const header = (
    <>
      <div className="mb-1 flex justify-center sm:hidden">
        <span className="h-1 w-10 rounded-full bg-[#ead7bb]" aria-hidden />
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#2e1a08]">{title}</h2>
        <DialogCloseButton onClick={onClose} />
      </div>
    </>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2e1a08]/45 p-0 sm:items-center sm:p-4"
      data-admin-sheet
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form
          role="dialog"
          aria-modal="true"
          data-admin-sheet
          onSubmit={onSubmit}
          className={panelClass}
          onClick={(e) => e.stopPropagation()}
        >
          {header}
          {children}
        </form>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          data-admin-sheet
          className={panelClass}
          onClick={(e) => e.stopPropagation()}
        >
          {header}
          {children}
        </div>
      )}
    </div>
  );
}
