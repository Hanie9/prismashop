"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  open: boolean;
  onOpenChange: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  open,
  onOpenChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو...",
  disabled = false,
  className = "",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((option) => option.includes(q));
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPos(null);
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
      const width = Math.max(rect.width, 200);

      let left = rect.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

      setPos({
        top: openUp ? rect.top - 8 : rect.bottom + 8,
        left,
        width,
        openUp,
      });
    };

    updatePosition();
    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, filtered.length, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onOpenChange(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const menu =
    open && mounted && pos
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.openUp ? undefined : pos.top,
              bottom: pos.openUp ? window.innerHeight - pos.top : undefined,
              left: pos.left,
              width: pos.width,
              zIndex: 200,
            }}
            className="overflow-hidden rounded-2xl border border-[#e8cfa8] bg-white shadow-[0_16px_40px_rgba(89,48,10,0.18)]"
          >
            <div className="border-b border-[#f5e9d5] p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-[#e8cfa8] bg-[#fffaf5] px-3 py-2 text-sm text-[#2e1a08] placeholder:text-[#c49a5c] focus:border-[#a96c20] focus:outline-none"
              />
            </div>
            <ul className="max-h-56 overflow-auto" role="listbox">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-center text-sm text-[#a96c20]">موردی یافت نشد</li>
              ) : (
                filtered.map((option) => (
                  <li key={option}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === option}
                      onClick={() => {
                        onChange(option);
                        onOpenChange(null);
                      }}
                      className={`w-full px-4 py-2.5 text-right text-sm transition-colors ${
                        value === option
                          ? "bg-[#fdf1df] font-medium text-[#6d4014]"
                          : "text-[#4e2e0e] hover:bg-[#f8efe2]"
                      }`}
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          onOpenChange(open ? null : id);
        }}
        className={`relative w-full truncate rounded-2xl border bg-[#fffaf5] py-3 ps-5 pl-12 text-right text-sm shadow-sm transition-colors focus:outline-none ${
          disabled
            ? "cursor-not-allowed border-[#ead7bb] text-[#c49a5c] opacity-70"
            : open
              ? "border-[#a96c20] text-[#2e1a08]"
              : "border-[#e8cfa8] text-[#2e1a08] focus:border-[#a96c20]"
        }`}
      >
        {value || <span className="text-[#c49a5c]">{placeholder}</span>}
        <span
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a96c20] transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  );
}
