"use client";

export function formatAdminDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatAdminTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhoneBadge({ phone, className = "" }: { phone: string; className?: string }) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#ead7bb] bg-[#fffaf5] px-2.5 py-1 ${className}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="shrink-0 text-[#a96c20]"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span dir="ltr" className="truncate text-xs font-semibold tracking-wide text-[#6d4014]">
        {phone}
      </span>
    </div>
  );
}

export function EmailBadge({ email, className = "" }: { email: string; className?: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#dce8f5] bg-[#f5f9fd] px-2.5 py-1 transition-colors hover:border-[#b7d0ea] hover:bg-[#ebf3fb] ${className}`}
      title={email}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="shrink-0 text-[#5b82a8]"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
      <span dir="ltr" className="truncate text-xs font-medium tracking-wide text-[#3d5a73]">
        {email}
      </span>
    </a>
  );
}

export function DateTimeBadge({
  value,
  className = "",
}: {
  value: string | Date;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-col gap-0.5 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-right ${className}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4e2e0e]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="shrink-0 text-[#a96c20]"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>{formatAdminDate(value)}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[#8a5419]">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="shrink-0 text-[#c2883a]"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
        <span dir="ltr" className="font-medium tracking-wide">
          {formatAdminTime(value)}
        </span>
      </div>
    </div>
  );
}
