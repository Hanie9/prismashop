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
            className="overflow-hidden rounded-2xl border border-[#e8cfa8] bg-white shadow-[0_16px_40px_rgba(89,48,10,0.18)]"
          >
            {label && (
              <div className="border-b border-[#f5e9d5] px-3 py-2 text-[11px] text-[#a96c20]">
                {label}
              </div>
            )}
            <ul className="max-h-56 overflow-auto" role="listbox">
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => {
                      onChange(option.value);
                      onOpenChange(null);
                    }}
                    className={`w-full px-4 py-2.5 text-right text-sm transition-colors ${
                      value === option.value
                        ? "bg-[#fdf1df] font-medium text-[#6d4014]"
                        : "text-[#4e2e0e] hover:bg-[#f8efe2]"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
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
        className={`relative w-full rounded-2xl border bg-[#fdf8f3] text-[#4e2e0e] shadow-sm focus:outline-none text-right truncate transition-colors ${
          size === "sm" ? "px-3 pl-10 py-2 text-xs" : "px-4 pl-12 py-2.5 text-sm"
        } ${open ? "border-[#a96c20]" : "border-[#e8cfa8] focus:border-[#a96c20]"}`}
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
