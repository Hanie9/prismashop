"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCart } from "./CartProvider";
import Footer from "./Footer";
import Navbar from "./Navbar";
import PageLoader from "./PageLoader";
import PullToRefresh from "./PullToRefresh";
import { useAuth } from "./SessionProvider";
import { useShop } from "./ShopProvider";
import { useWishlist } from "./WishlistProvider";

export default function StorefrontChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname.startsWith("/auth");
  const { ready } = useAuth();
  const { loadError, refreshShop, hydrated: shopHydrated } = useShop();
  const { hydrated: cartHydrated } = useCart();
  const { hydrated: wishlistHydrated } = useWishlist();

  const appReady = ready && shopHydrated && cartHydrated && wishlistHydrated;

  if (isAdmin) {
    return <>{children}</>;
  }

  if (!appReady) {
    return <PageLoader overlay />;
  }

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <PullToRefresh>
      <Navbar />
      {loadError && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          <p className="mb-2">فروشگاه موقتاً در دسترس نیست. ارتباط با سرور برقرار نشد.</p>
          <button
            type="button"
            onClick={() => void refreshShop()}
            className="rounded-full bg-[#8a5419] px-4 py-1.5 text-xs font-bold text-white"
          >
            تلاش دوباره
          </button>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </PullToRefresh>
  );
}
