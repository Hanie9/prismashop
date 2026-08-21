import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** RTL-friendly back navigation used across the storefront. */
export default function BackLink({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-[#8a5419] transition-colors hover:text-[#6d4014] hover:underline ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
      {children}
    </Link>
  );
}
