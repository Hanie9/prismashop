"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteIcon from "./SiteIcon";
import { useSiteSettings } from "./SiteSettingsProvider";
import TrackOrderLink from "./TrackOrderLink";

const footerLinks = {
  quick: [
    { name: "صفحه اصلی", href: "/" },
    { name: "همه محصولات", href: "/products" },
    { name: "علاقه‌مندی‌ها", href: "/wishlist" },
    { name: "بلاگ", href: "/blog" },
  ],
  support: [{ name: "حریم خصوصی", href: "/privacy" }],
};

export default function Footer() {
  const pathname = usePathname();
  const { settings } = useSiteSettings();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <footer className="mt-14 bg-[#1f1207] text-[#f3e2c8]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-7">
        <div className="rounded-[26px] border border-[#4a2b10] bg-gradient-to-l from-[#261608] to-[#35200d] px-5 md:px-8 py-6 md:py-7 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8a5419] to-[#4e2e0e] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#f5e9d5" strokeWidth="1.5" fill="none"/>
                    <path d="M12 2V22M3 7L21 17M21 7L3 17" stroke="#d4a96a" strokeWidth="1" opacity="0.7"/>
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-black text-white">{settings?.brandName}</div>
                  {settings?.brandSubtitle && (
                    <div className="text-xs text-[#cfa56c]">{settings.brandSubtitle}</div>
                  )}
                </div>
              </div>
              {settings?.brandTagline && (
                <p className="mt-3 text-sm leading-7 text-[#e3c091]">{settings.brandTagline}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(settings?.footerBadges ?? []).map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-[#3b220d] px-3 py-1 text-[11px] text-[#d9b17d]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">دسترسی سریع</h3>
              <div className="grid grid-cols-2 gap-2">
                {footerLinks.quick.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-[#5d3814] px-3 py-2 text-xs text-center text-[#ddb98a] hover:text-white hover:border-[#c2883a] hover:bg-[#3b220d]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">ارتباط با ما</h3>
              <div className="space-y-2 text-sm text-[#ddb98a]">
                {settings?.contactPhone && <div>{settings.contactPhone}</div>}
                {settings?.contactEmail && <div>{settings.contactEmail}</div>}
                {settings?.workingHours && (
                  <div className="text-xs text-[#b98a53]">{settings.workingHours}</div>
                )}
              </div>
              {(settings?.socialLinks?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {settings!.socialLinks.map((social) => (
                    <a
                      key={social.href}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      title={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#5d3814] text-[#ddb98a] transition-colors hover:border-[#c2883a] hover:bg-[#3b220d] hover:text-white"
                    >
                      <SiteIcon name={social.icon} size={17} strokeWidth={1.7} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#b98a53] text-center md:text-right">
          <span>{settings?.copyrightText}</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <TrackOrderLink className="hover:text-[#f0d3ac]" />
            {footerLinks.support.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#f0d3ac]">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
