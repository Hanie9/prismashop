"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

type Props = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  open: boolean;
  onOpenChange: (id: string | null) => void;
  className?: string;
  size?: "sm" | "md";
};

type MenuPos = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

export default function SelectDropdown({
  id,
  label,
  value,
  onChange,
  options,
  open,
  onOpenChange,
  className = "",
  size = "md",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const [mounted, setMounted] = useState(false);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPos(null);
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
      const width = Math.max(rect.width, 180);

      // Keep menu aligned to the right edge of the button in RTL layouts
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
    // Recalculate after menu mounts with real height
    const raf = window.requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length, label]);

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
            className={`origin-top overflow-hidden rounded-2xl border border-[#ead7bb]/80 bg-white/95 shadow-[0_20px_50px_rgba(89,48,10,0.18)] backdrop-blur-xl ${
              pos.openUp ? "animate-dropdown-up" : "animate-dropdown-down"
            }`}
          >
            {label && (
              <div className="border-b border-[#f5e9d5] px-3.5 py-2 text-[11px] font-medium text-[#a96c20]">
                {label}
              </div>
            )}
            <ul className="max-h-60 overflow-auto p-1.5" role="listbox">
              {options.map((option) => {
                const active = value === option.value;
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(option.value);
                        onOpenChange(null);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition-colors ${
                        active
                          ? "bg-[#fdf1df] font-semibold text-[#6d4014]"
                          : "text-[#4e2e0e] hover:bg-[#f8efe2]"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {active && (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-[#a96c20]"
                          aria-hidden
                        >
                          <path d="m5 13 4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
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
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => onOpenChange(open ? null : id)}
        className={`relative w-full truncate rounded-2xl border bg-white text-right text-[#4e2e0e] shadow-sm transition-all hover:border-[#d4a96a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a96a]/40 ${
          size === "sm" ? "px-3 pl-10 py-2 text-xs" : "px-4 pl-12 py-2.5 text-sm"
        } ${open ? "border-[#a96c20] ring-2 ring-[#d4a96a]/25" : "border-[#e8cfa8]"}`}
      >
        {selectedLabel}
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#a96c20] transition-transform duration-200 ${
            size === "sm" ? "left-3" : "left-4"
          } ${open ? "rotate-180" : "rotate-0"}`}
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
