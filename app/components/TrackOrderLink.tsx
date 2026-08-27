"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import LoginPromptDialog from "./LoginPromptDialog";
import { useAuth } from "./SessionProvider";

const ORDERS_HREF = "/account/orders";

export default function TrackOrderLink({
  className,
  children = "پیگیری سفارش",
  onNavigate,
}: {
  className?: string;
  children?: React.ReactNode;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { isLoggedIn, ready } = useAuth();
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          if (!ready) return;
          onNavigate?.();
          if (!isLoggedIn) {
            setPromptOpen(true);
            return;
          }
          router.push(ORDERS_HREF);
        }}
      >
        {children}
      </button>

      <LoginPromptDialog
        open={promptOpen}
        title="ورود برای پیگیری سفارش"
        description="برای دیدن وضعیت سفارش‌هایتان ابتدا وارد حساب کاربری شوید."
        onCancel={() => setPromptOpen(false)}
        onConfirm={() => {
          setPromptOpen(false);
          router.push(`/auth/login?next=${encodeURIComponent(ORDERS_HREF)}`);
        }}
      />
    </>
  );
}
