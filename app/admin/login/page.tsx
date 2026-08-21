"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Admin uses the same storefront login panel. */
export default function AdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/auth/login?next=${encodeURIComponent("/admin")}`);
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe6] text-sm text-[#6d4014]">
      در حال انتقال به صفحه ورود...
    </div>
  );
}
