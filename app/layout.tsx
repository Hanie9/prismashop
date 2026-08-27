import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import ScrollToTop from "./components/ScrollToTop";
import { SessionProvider } from "./components/SessionProvider";
import { ShopProvider } from "./components/ShopProvider";
import { SiteSettingsProvider } from "./components/SiteSettingsProvider";
import StorefrontChrome from "./components/StorefrontChrome";
import { WishlistProvider } from "./components/WishlistProvider";
import { getApiBase, type SiteSettings } from "./lib/api";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${getApiBase()}/api/settings`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return {};
    const settings = (await res.json()) as SiteSettings;
    const title = settings.brandSubtitle
      ? `${settings.brandName} | ${settings.brandSubtitle}`
      : settings.brandName;
    return { title, description: settings.brandTagline || undefined };
  } catch {
    return {};
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf6ee]">
        <SessionProvider>
          <SiteSettingsProvider>
            <ShopProvider>
              <CartProvider>
                <WishlistProvider>
                  <ScrollToTop />
                  <StorefrontChrome>{children}</StorefrontChrome>
                </WishlistProvider>
              </CartProvider>
            </ShopProvider>
          </SiteSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
