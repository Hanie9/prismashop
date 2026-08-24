"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import DialogCloseButton from "./DialogCloseButton";
import { useAuth } from "./SessionProvider";
import { useShop } from "./ShopProvider";
import { useWishlist } from "./WishlistProvider";

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
  profileHref,
  onLogoutClick,
}: {
  displayName: string;
  profileHref?: string | null;
  onLogoutClick: () => void;
}) {
  return (
    <div className="hidden lg:flex items-center rounded-full border border-[#ead7bb] bg-[#fffaf5] p-1 pe-1 ps-1 xl:ps-1.5 transition-colors hover:border-[#d4a96a]">
      {profileHref ? (
        <Link
          href={profileHref}
          title="مشاهده مشخصات حساب"
          className="max-w-[120px] xl:max-w-[180px] truncate rounded-full px-2.5 xl:px-3 py-1.5 text-sm font-medium text-[#4e2e0e] transition-colors hover:bg-[#f5e9d5] hover:text-[#8a5419]"
        >
          {displayName}
        </Link>
      ) : (
        <span className="max-w-[120px] xl:max-w-[180px] truncate pe-2 xl:pe-3 ps-2 text-sm font-medium text-[#4e2e0e]">
          {displayName}
        </span>
      )}
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
      className="hidden lg:flex items-center gap-2 rounded-full border border-[#ead7bb] bg-[#fffaf5] px-3 xl:px-4 py-2.5 text-sm font-medium text-[#4e2e0e] transition-colors hover:border-[#d4a96a] hover:text-[#8a5419]"
    >
      <UserIcon />
      <span className="hidden xl:inline">ورود / عضویت</span>
      <span className="xl:hidden">ورود</span>
    </Link>
  );
}

function UserSessionMobileRow({
  displayName,
  profileHref,
  onLogoutClick,
  onProfileClick,
}: {
  displayName: string;
  profileHref?: string | null;
  onLogoutClick: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-1">
      <div className="min-w-0">
        <p className="text-[11px] text-[#a96c20]">حساب کاربری</p>
        {profileHref ? (
          <Link
            href={profileHref}
            onClick={onProfileClick}
            className="block truncate text-sm font-semibold text-[#3d2410] hover:text-[#8a5419]"
          >
            {displayName}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-[#3d2410]">{displayName}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onLogoutClick}
        aria-label="خروج از حساب"
        title="خروج"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff6ea] text-[#a96c20] transition-colors hover:bg-[#f5e9d5] hover:text-[#8a5419]"
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
        aria-labelledby="logout-dialog-title"
        className="relative max-h-[min(90dvh,28rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] border border-[#ead7bb] bg-white p-5 shadow-[0_24px_60px_rgba(89,48,10,0.22)] sm:rounded-[28px] sm:p-6"
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
  const { totalItems: wishlistCount } = useWishlist();
  const { categories: shopCategories } = useShop();
  const { isLoggedIn, displayName, logout, isAdmin, isCustomer } = useAuth();
  const categories = shopCategories.map((cat) => ({
    name: cat.name,
    href: `/products?cat=${cat.id}`,
  }));
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setCatsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const closeMenu = () => {
    setMenuOpen(false);
    setCatsOpen(false);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    closeMenu();
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setLogoutDialogOpen(false);
    router.replace("/");
  };

  const session = isLoggedIn;
  const profileHref = isCustomer ? "/account/profile" : null;

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="border-b border-[#ead7bb] bg-white/95 backdrop-blur shadow-[0_10px_30px_rgba(89,48,10,0.07)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4">
          <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 py-4">
            <button
              type="button"
              className={`lg:hidden flex items-center justify-center w-11 h-11 shrink-0 rounded-full border transition-colors ${
                menuOpen
                  ? "border-[#d4a96a] bg-[#fff6ea] text-[#8a5419]"
                  : "border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e]"
              }`}
              onClick={() => setMenuOpen(true)}
              aria-label="باز کردن منو"
              aria-expanded={menuOpen}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="5" y1="7" x2="19" y2="7" strokeLinecap="round" />
                <line x1="9" y1="12" x2="19" y2="12" strokeLinecap="round" />
                <line x1="5" y1="17" x2="19" y2="17" strokeLinecap="round" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#8a5419] to-[#4e2e0e] flex items-center justify-center shadow-[0_10px_25px_rgba(89,48,10,0.18)] shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none"/>
                  <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg md:text-xl font-black text-[#3d2410] leading-tight truncate">پریسما شاپ</div>
                <div className="hidden sm:block text-[11px] md:text-xs text-[#a96c20] leading-tight">دکور و حروف کالیگرافی چوبی</div>
              </div>
            </Link>

            <div className="hidden lg:block flex-1 min-w-0">
              <form className="relative max-w-2xl xl:max-w-none" onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در محصولات، تابلوها و حروف کالیگرافی..."
                  className="w-full h-[48px] xl:h-[52px] rounded-full border border-[#e6caa2] bg-[#fffaf5] pr-5 xl:pr-6 pl-[56px] text-sm text-[#4e2e0e] shadow-inner shadow-[#f3e3cb] placeholder:text-[#b68548] focus:outline-none focus:border-[#c2883a] focus:ring-4 focus:ring-[#d4a96a]/15"
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

            <div className="mr-auto flex items-center gap-2 xl:gap-2.5 shrink-0">
              {!session ? (
                <LoginAuthLink />
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <UserSessionBadge
                    displayName={displayName}
                    profileHref={profileHref}
                    onLogoutClick={() => setLogoutDialogOpen(true)}
                  />
                </div>
              )}

              <Link
                href="/wishlist"
                className="relative flex items-center justify-center w-11 h-11 rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a] hover:text-[#8a5419]"
                aria-label="علاقه‌مندی‌ها"
                title="علاقه‌مندی‌ها"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#a96c20] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_4px_10px_rgba(169,108,32,0.35)]">
                    {wishlistCount.toLocaleString("fa-IR")}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative flex items-center justify-center w-11 h-11 rounded-full border border-[#ead7bb] bg-[#fffaf5] text-[#4e2e0e] hover:border-[#d4a96a] hover:text-[#8a5419]"
                aria-label="سبد خرید"
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
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3 border-t border-[#f3e6d1] py-3">
            <div className="relative group shrink-0">
              <button className="flex items-center gap-2 rounded-full bg-[#8a5419] px-4 xl:px-5 py-2.5 xl:py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(138,84,25,0.2)] hover:bg-[#6d4014]">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <span className="hidden xl:inline">دسته‌بندی‌ها</span>
                <span className="xl:hidden">دسته‌ها</span>
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

            <div className="flex flex-1 items-center justify-center gap-0.5 xl:gap-1 min-w-0 overflow-x-auto">
              {mainLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-2.5 xl:px-4 py-2 xl:py-2.5 text-xs xl:text-sm font-medium text-[#4e2e0e] hover:bg-[#f8efe2] hover:text-[#8a5419] whitespace-nowrap"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {session && !isAdmin && (
              <Link
                href="/account/orders"
                className="shrink-0 rounded-full border border-[#f1d6b0] bg-[#fff6ea] px-3 xl:px-4 py-2 text-xs font-semibold text-[#a96c20] hover:border-[#d4a96a] hover:text-[#8a5419] whitespace-nowrap"
              >
                سفارش‌ها
              </Link>
            )}
            {session && isAdmin && (
              <Link
                href="/admin"
                className="shrink-0 rounded-full border border-[#f1d6b0] bg-[#fff6ea] px-3 xl:px-4 py-2 text-xs font-semibold text-[#a96c20] hover:border-[#d4a96a] hover:text-[#8a5419] whitespace-nowrap"
              >
                پنل ادمین
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile side drawer */}
      <div className={`lg:hidden fixed inset-0 z-[70] ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="بستن منو"
          onClick={closeMenu}
          className={`absolute inset-0 bg-[#2e1a08]/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          className={`absolute inset-y-0 right-0 flex w-[82%] max-w-[340px] flex-col bg-[#fffdf9] shadow-[-20px_0_50px_rgba(46,26,8,0.2)] transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="منوی اصلی"
        >
          <div className="flex items-center justify-between border-b border-[#ead7bb] px-4 py-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8a5419] to-[#4e2e0e]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none"/>
                  <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#3d2410]">پریسما شاپ</p>
                <p className="text-[11px] text-[#a96c20]">منوی فروشگاه</p>
              </div>
            </div>
            <DialogCloseButton onClick={closeMenu} />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <form className="relative mb-5" onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full rounded-2xl border border-[#ead7bb] bg-white py-3 pr-4 pl-11 text-sm text-[#3d2410] placeholder:text-[#b98a53] focus:border-[#c2883a] focus:outline-none focus:ring-4 focus:ring-[#d4a96a]/12"
              />
              <button
                type="submit"
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#8a5419] text-white"
                aria-label="جستجو"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>

            <div className="mb-5 space-y-1">
              {mainLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm transition-colors ${
                      active
                        ? "bg-[#fff6ea] font-bold text-[#8a5419]"
                        : "font-medium text-[#4e2e0e] hover:bg-white"
                    }`}
                  >
                    <span>{item.name}</span>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#c2883a]" />}
                  </Link>
                );
              })}
              {session && !isAdmin && (
                <Link
                  href="/account/orders"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold text-[#a96c20] hover:bg-[#fff6ea]"
                >
                  <span>سفارش‌ها</span>
                </Link>
              )}
              {session && isAdmin && (
                <Link
                  href="/admin"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold text-[#a96c20] hover:bg-[#fff6ea]"
                >
                  <span>پنل ادمین</span>
                </Link>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#ead7bb] bg-white">
              <button
                type="button"
                onClick={() => setCatsOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3.5 py-3 text-sm font-semibold text-[#3d2410]"
                aria-expanded={catsOpen}
              >
                <span>دسته‌بندی‌ها</span>
                <span className={`text-[#a96c20] transition-transform duration-200 ${catsOpen ? "rotate-180" : ""}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              {catsOpen && (
                <div className="border-t border-[#f1e3cf] px-2 py-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      className="block rounded-xl px-3 py-2.5 text-sm text-[#6d4014] transition-colors hover:bg-[#fff6ea]"
                      onClick={closeMenu}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#ead7bb] bg-white px-4 py-4">
            {!session ? (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#8a5419] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(138,84,25,0.2)]"
              >
                <UserIcon />
                ورود / عضویت
              </Link>
            ) : (
              <div className="space-y-2">
                <UserSessionMobileRow
                  displayName={displayName}
                  profileHref={profileHref}
                  onLogoutClick={() => setLogoutDialogOpen(true)}
                  onProfileClick={closeMenu}
                />
              </div>
            )}
          </div>
        </aside>
      </div>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        displayName={displayName}
        onCancel={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}
