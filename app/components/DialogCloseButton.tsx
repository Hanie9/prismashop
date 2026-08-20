"use client";

type Props = {
  onClick: () => void;
  label?: string;
  className?: string;
};

export default function DialogCloseButton({
  onClick,
  label = "بستن",
  className = "",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#8a5419] shadow-[0_4px_12px_rgba(89,48,10,0.06)] transition-all duration-200 hover:border-[#d4a96a] hover:bg-[#fff6ea] hover:text-[#6d4014] hover:shadow-[0_6px_16px_rgba(89,48,10,0.1)] active:scale-95 ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        className="transition-transform duration-200 group-hover:rotate-90"
      >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
}
