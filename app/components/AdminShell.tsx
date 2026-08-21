"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { clearAdminSession, getAdminSession, logoutAdmin } from "../lib/admin-auth";
import DialogCloseButton from "./DialogCloseButton";
import PageLoader from "./PageLoader";
import PullToRefresh from "./PullToRefresh";
import { useAuth } from "./SessionProvider";
import { useShop } from "./ShopProvider";

const links = [
  { href: "/admin", label: "داشبورد", exact: true },
  { href: "/admin/products", label: "محصولات" },
  { href: "/admin/categories", label: "دسته‌بندی‌ها" },
  { href: "/admin/orders", label: "سفارش‌ها" },
  { href: "/admin/customers", label: "مشتریان" },
  { href: "/admin/reviews", label: "نظرات" },
  { href: "/admin/discounts", label: "تخفیف‌ها" },
  { href: "/admin/inventory", label: "موجودی" },
];

function AdminLogoutDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-logout-dialog-title"
        className="relative max-h-[min(90dvh,28rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ea] text-[#a96c20]">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h2 id="admin-logout-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          خروج از پنل ادمین
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">
          آیا مطمئن هستید که می‌خواهید از پنل مدیریت{" "}
          <span className="font-bold text-[#4e2e0e]">پریسما شاپ</span> خارج شوید؟
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#ead7bb] bg-[#fffaf5] py-3 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419]"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-[#8a5419] py-3 text-sm font-bold text-white transition-colors hover:bg-[#6d4014]"
          >
            بله، خروج
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders, products, hydrated: shopHydrated } = useShop();
  const { isAdmin, ready: authReady, refresh } = useAuth();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    const ok = isAdmin || getAdminSession();
    if (!ok && pathname !== "/admin/login") {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [pathname, router, isAdmin, authReady]);

  const handleLogout = async () => {
    await logoutAdmin();
    clearAdminSession();
    await refresh();
    setLogoutDialogOpen(false);
    setMenuOpen(false);
    router.replace("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!ready || !shopHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4efe6]">
        <PageLoader label="در حال بارگذاری پنل..." />
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const lowStock = products.filter((p) => p.active && p.stock > 0 && p.stock <= p.lowStockThreshold).length;

  const NavLinks = () => (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-[#8a5419] font-bold text-white"
                : "font-medium text-[#4e2e0e] hover:bg-[#fff6ea]"
            }`}
          >
            <span>{link.label}</span>
            {link.href === "/admin/orders" && pendingOrders > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-[#fff6ea] text-[#8a5419]"}`}>
                {pendingOrders.toLocaleString("fa-IR")}
              </span>
            )}
            {link.href === "/admin/inventory" && lowStock > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-red-50 text-red-600"}`}>
                {lowStock.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <PullToRefresh>
    <div className="min-h-screen bg-[#f4efe6] text-[#2e1a08]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-l border-[#ead7bb] bg-[#1f1207] p-5 text-[#f3e2c8] lg:flex lg:flex-col">
          <div className="mb-8">
            <p className="text-lg font-black text-white">پنل ادمین</p>
            <p className="mt-1 text-xs text-[#cfa56c]">پریسما شاپ</p>
          </div>
          <div className="flex-1">
            <nav className="space-y-1">
              {links.map((link) => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-[#8a5419] font-bold text-white"
                        : "font-medium text-[#e3c091] hover:bg-[#3b220d] hover:text-white"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.href === "/admin/orders" && pendingOrders > 0 && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                        {pendingOrders.toLocaleString("fa-IR")}
                      </span>
                    )}
                    {link.href === "/admin/inventory" && lowStock > 0 && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200">
                        {lowStock.toLocaleString("fa-IR")}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-6 space-y-2 border-t border-[#4a2b10] pt-4">
            <Link href="/" className="block rounded-xl px-3 py-2.5 text-sm text-[#ddb98a] hover:bg-[#3b220d] hover:text-white">
              مشاهده فروشگاه
            </Link>
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              className="w-full rounded-xl px-3 py-2.5 text-right text-sm text-[#f0b4a0] hover:bg-[#3b220d]"
            >
              خروج از پنل
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-[#ead7bb] bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] lg:hidden"
                  onClick={() => setMenuOpen(true)}
                  aria-label="منوی ادمین"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <line x1="5" y1="7" x2="19" y2="7" strokeLinecap="round" />
                    <line x1="9" y1="12" x2="19" y2="12" strokeLinecap="round" />
                    <line x1="5" y1="17" x2="19" y2="17" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#2e1a08] lg:text-base">مدیریت فروشگاه</p>
                  <p className="hidden text-xs text-[#a96c20] sm:block">کنترل محصولات، سفارش‌ها و موجودی</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-full border border-[#ead7bb] bg-[#fffaf5] px-3 py-2 text-xs font-medium text-[#6d4014] hover:border-[#d4a96a]"
                >
                  فروشگاه
                </Link>
                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 lg:hidden"
                >
                  خروج
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-[#2e1a08]/45" aria-label="بستن" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[82%] max-w-xs bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-black text-[#2e1a08]">منوی ادمین</p>
              <DialogCloseButton onClick={() => setMenuOpen(false)} />
            </div>
            <NavLinks />
            <div className="mt-4 border-t border-[#f1e3cf] pt-4 space-y-2">
              <Link href="/" onClick={() => setMenuOpen(false)} className="block rounded-xl bg-[#fffaf5] px-3 py-2.5 text-sm text-[#6d4014]">
                مشاهده فروشگاه
              </Link>
              <button
                type="button"
                onClick={() => setLogoutDialogOpen(true)}
                className="w-full rounded-xl bg-red-50 px-3 py-2.5 text-right text-sm text-red-600"
              >
                خروج از پنل
              </button>
            </div>
          </aside>
        </div>
      )}

      <AdminLogoutDialog
        open={logoutDialogOpen}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
    </PullToRefresh>
  );
}
