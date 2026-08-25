"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { onlyDigits } from "../lib/validation";

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
  invalid?: boolean;
};

export default function OtpCodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  onComplete,
  invalid = false,
}: Props) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  const setDigit = (index: number, raw: string) => {
    const cleaned = onlyDigits(raw);
    if (!cleaned) {
      const next = digits.map((d, i) => (i === index ? "" : d)).join("");
      onChange(next);
      return;
    }

    if (cleaned.length > 1) {
      const merged = onlyDigits(value.slice(0, index) + cleaned).slice(0, length);
      onChange(merged);
      const focusAt = Math.min(merged.length, length - 1);
      inputsRef.current[focusAt]?.focus();
      if (merged.length === length) onComplete?.(merged);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    const next = nextDigits.join("");
    onChange(next);
    if (index < length - 1) inputsRef.current[index + 1]?.focus();
    if (next.length === length && !next.includes("")) onComplete?.(next);
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigit(index - 1, "");
      }
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`رقم ${index + 1} کد تأیید`}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 w-10 rounded-xl border bg-white/14 text-center text-lg font-bold text-white outline-none transition-all sm:h-14 sm:w-11 sm:rounded-2xl sm:text-xl ${
            invalid
              ? "border-red-400/70 focus:border-red-300 focus:ring-4 focus:ring-red-400/20"
              : "border-white/15 focus:border-[#f1d5ad]/70 focus:ring-4 focus:ring-[#d4a96a]/20"
          } disabled:opacity-50`}
        />
      ))}
    </div>
  );
}
