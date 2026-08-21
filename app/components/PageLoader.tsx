"use client";

type Props = {
  label?: string;
  className?: string;
  fullScreen?: boolean;
};

export default function PageLoader({
  label = "در حال بارگذاری...",
  className = "",
  fullScreen = true,
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "min-h-[50vh] py-16" : "py-10"
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
