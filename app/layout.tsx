import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./components/CartProvider";
import ScrollToTop from "./components/ScrollToTop";
import { SessionProvider } from "./components/SessionProvider";
import { ShopProvider } from "./components/ShopProvider";
import StorefrontChrome from "./components/StorefrontChrome";
import { WishlistProvider } from "./components/WishlistProvider";

export const metadata: Metadata = {
  title: "پریسما شاپ | فروشگاه تخصصی محصولات چوبی",
  description:
    "پریسما شاپ - تخصصی‌ترین فروشگاه آنلاین محصولات چوبی، مبلمان، دکوری و ابزار نجاری در ایران",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf6ee]">
        <SessionProvider>
          <ShopProvider>
            <CartProvider>
              <WishlistProvider>
                <ScrollToTop />
                <StorefrontChrome>{children}</StorefrontChrome>
              </WishlistProvider>
            </CartProvider>
          </ShopProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
