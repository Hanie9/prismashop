"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

const SESSION_STORAGE_KEY = "prismashop-session";

type Session = {
  email: string;
  fullName: string;
  remember: boolean;
  loggedInAt: string;
};

function LogoutIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UserSessionBadge({
  displayName,
  onLogoutClick,
}: {
  displayName: string;
  onLogoutClick: () => void;
}) {
  return (
    <div className="hidden md:flex items-center rounded-full border border-[#ead7bb] bg-[#fffaf5] p-1 pe-1 ps-4 transition-colors hover:border-[#d4a96a]">
      <span className="max-w-[180px] truncate pe-3 text-sm font-medium text-[#4e2e0e]">{displayName}</span>
      <button
        type="button"
        onClick={onLogoutClick}
        aria-label="خروج از حساب"
        title="خروج"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#a96c20] transition-colors hover:bg-[#f5e9d5] hover:text-[#8a5419]"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

function LoginAuthLink() {
  return (
    <Link
      href="/auth/login"
      className="hidden md:flex items-center gap-2 rounded-full border border-[#ead7bb] bg-[#fffaf5] px-4 py-2.5 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419]"
    >
      <UserIcon />
      <span>ورود / عضویت</span>
    </Link>
  );
}

function UserSessionMobileRow({
  displayName,
  onLogoutClick,
}: {
  displayName: string;
  onLogoutClick: () => void;
}) {
  return (
    <div className="col-span-2 flex items-center justify-between rounded-2xl border border-[#f1e3cf] bg-[#fffaf5] px-4 py-2.5">
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#4e2e0e]">{displayName}</span>
      <button
        type="button"
        onClick={onLogoutClick}
        aria-label="خروج از حساب"
        title="خروج"
        className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#a96c20] transition-colors hover:bg-[#f5e9d5] hover:text-[#8a5419]"
      >
        <LogoutIcon />
      </button>
    </div>
  );
}

function LogoutConfirmDialog({
  open,
  displayName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  displayName: string;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px]"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        className="relative w-full max-w-md rounded-[28px] border border-[#ead7bb] bg-white p-6 shadow-[0_24px_60px_rgba(89,48,10,0.22)]"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ea] text-[#a96c20]">
          <LogoutIcon />
        </div>
        <h2 id="logout-dialog-title" className="mb-2 text-lg font-black text-[#3d2410]">
          خروج از حساب
        </h2>
        <p className="mb-6 text-sm leading-7 text-[#6d4014]">
          {displayName ? (
            <>
              آیا مطمئن هستید که می‌خواهید از حساب{" "}
              <span className="font-bold text-[#4e2e0e]">{displayName}</span> خارج شوید؟
            </>
          ) : (
            "آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟"
          )}
        </p>
        <div className="flex gap-3">
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

const categories = [
  { name: "محصولات چوبی خام", href: "/products?cat=raw" },
  { name: "مبلمان چوبی", href: "/products?cat=furniture" },
  { name: "دکوری و تزئینی", href: "/products?cat=decorative" },
  { name: "حروف کالیگرافی", href: "/products?cat=calligraphy" },
  { name: "ابزار نجاری", href: "/products?cat=tools" },
  { name: "رنگ و پوشش", href: "/products?cat=paint" },
];

const mainLinks = [
  { name: "صفحه اصلی", href: "/" },
  { name: "محصولات", href: "/products" },
  { name: "بلاگ", href: "/blog" },
  { name: "درباره ما", href: "/about" },
  { name: "تماس با ما", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    const loadSession = () => {
      try {
        const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
    };

    loadSession();
    window.addEventListener("storage", loadSession);
    window.addEventListener("prismashop-auth-change", loadSession);
    return () => {
      window.removeEventListener("storage", loadSession);
      window.removeEventListener("prismashop-auth-change", loadSession);
    };
  }, [pathname]);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setMenuOpen(false);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setMenuOpen(false);
    setLogoutDialogOpen(false);
    window.dispatchEvent(new Event("prismashop-auth-change"));
    router.push("/");
    router.refresh();
  };

  const displayName = session?.fullName || session?.email || "";

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="border-b border-[#ead7bb] bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(89,48,10,0.07)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-6 py-4">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8a5419] to-[#4e2e0e] flex items-center justify-center shadow-[0_10px_25px_rgba(89,48,10,0.18)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none"/>
                  <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <div className="text-lg md:text-xl font-black text-[#3d2410] leading-tight">پریسما شاپ</div>
                <div className="text-[11px] md:text-xs text-[#a96c20] leading-tight">دکور و حروف کالیگرافی چوبی</div>
              </div>
            </Link>

            <div className="hidden md:block flex-1">
              <form className="relative" onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در محصولات، تابلوها و حروف کالیگرافی..."
                  className="w-full h-[52px] rounded-full border border-[#e6caa2] bg-[#fffaf5] pr-6 pl-[60px] text-sm text-[#4e2e0e] shadow-inner shadow-[#f3e3cb] placeholder:text-[#b68548] focus:outline-none focus:border-[#c2883a] focus:ring-4 focus:ring-[#d4a96a]/15"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#8a5419] text-white hover:bg-[#6d4014] flex items-center justify-center shadow-sm"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              </form>
            </div>

            <div className="mr-auto flex items-center gap-2.5 shrink-0">
              {!session ? (
                <LoginAuthLink />
              ) : (
                <UserSessionBadge displayName={displayName} onLogoutClick={() => setLogoutDialogOpen(true)} />
              )}

              <Link
                href="/cart"
                className="relative flex items-center justify-center w-11 h-11 rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a] hover:text-[#8a5419]"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#a96c20] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_4px_10px_rgba(169,108,32,0.35)]">
                    {totalItems.toLocaleString("fa-IR")}
                  </span>
                )}
              </Link>

              <button
                className="md:hidden flex items-center justify-center w-11 h-11 rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e]"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="باز کردن منو"
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen ? (
                    <path d="M6 18 18 6M6 6l12 12"/>
                  ) : (
                    <>
                      <line x1="4" y1="6" x2="20" y2="6"/>
                      <line x1="4" y1="12" x2="20" y2="12"/>
                      <line x1="4" y1="18" x2="20" y2="18"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 border-t border-[#f3e6d1] py-3">
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full bg-[#8a5419] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(138,84,25,0.2)] hover:bg-[#6d4014]">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <span>دسته‌بندی‌ها</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <ul className="absolute right-0 top-full mt-3 z-50 w-64 rounded-3xl border border-[#ead7bb] bg-white p-2 shadow-[0_22px_50px_rgba(89,48,10,0.15)] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200">
                {categories.map((cat) => (
                  <li key={cat.href}>
                    <Link
                      href={cat.href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#4e2e0e] hover:bg-[#f8efe2] hover:text-[#8a5419]"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#c2883a]"></span>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-1 items-center justify-center gap-1">
              {mainLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-[#4e2e0e] hover:bg-[#f8efe2] hover:text-[#8a5419]"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <Link
              href="/products?sale=true"
              className="rounded-full border border-[#f1d6b0] bg-[#fff6ea] px-4 py-2 text-xs font-semibold text-[#a96c20] hover:border-[#d4a96a] hover:text-[#8a5419]"
            >
              تخفیف‌های ویژه
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#f3e6d1] bg-white md:hidden">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <form className="relative" onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full rounded-full border border-[#e6caa2] bg-[#fffaf5] py-3 pr-5 pl-12 text-sm text-[#4e2e0e] focus:outline-none focus:border-[#c2883a]"
                />
                <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a96c20]">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2">
                {mainLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl bg-[#fffaf5] px-4 py-3 text-sm font-medium text-[#4e2e0e] border border-[#f1e3cf]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {!session ? (
                  <Link
                    href="/auth/login"
                    className="col-span-2 rounded-2xl bg-[#fffaf5] px-4 py-3 text-sm font-medium text-[#4e2e0e] border border-[#f1e3cf]"
                    onClick={() => setMenuOpen(false)}
                  >
                    ورود / عضویت
                  </Link>
                ) : (
                  <UserSessionMobileRow displayName={displayName} onLogoutClick={() => setLogoutDialogOpen(true)} />
                )}
              </div>

              <div className="rounded-3xl border border-[#f1e3cf] bg-[#fffaf5] p-3">
                <div className="text-sm font-bold text-[#4e2e0e] mb-2">دسته‌بندی‌ها</div>
                <div className="grid gap-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="rounded-2xl px-3 py-2.5 text-sm text-[#6d4014] hover:bg-[#f5e9d5]"
                      onClick={() => setMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        displayName={displayName}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}
