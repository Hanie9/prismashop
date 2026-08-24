"use client";

type Props = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
};

export default function PageLoader({
  label = "در حال بارگذاری...",
  className = "",
  fullScreen = true,
  overlay = false,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        overlay
          ? "fixed inset-0 z-[200] min-h-dvh bg-[#faf6ee]"
          : fullScreen
            ? "min-h-dvh py-16"
            : "py-10"
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-[#e8cfa8] border-t-[#8a5419]"
        aria-hidden
      />
      <span className="text-sm text-[#6d4014]">{label}</span>
    </div>
  );
}
