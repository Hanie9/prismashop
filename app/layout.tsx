import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { CartProvider } from "./components/CartProvider";
import { WishlistProvider } from "./components/WishlistProvider";

export const metadata: Metadata = {
  title: "پریسما شاپ | فروشگاه تخصصی محصولات چوبی",
  description: "پریسما شاپ - تخصصی‌ترین فروشگاه آنلاین محصولات چوبی، مبلمان، دکوری و ابزار نجاری در ایران",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf6ee]">
        <CartProvider>
          <WishlistProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
