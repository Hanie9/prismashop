"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";
import SiteIcon from "../components/SiteIcon";
import { useSiteSettings } from "../components/SiteSettingsProvider";
import { api, type SitePage } from "../lib/api";

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const [page, setPage] = useState<SitePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getSitePage("about")
      .then((data) => {
        if (!cancelled) setPage(data);
      })
      .catch(() => {
        if (!cancelled) setPage(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader />;

  const stats = settings?.stats ?? [];
  const values = settings?.features ?? [];
  const sections = page?.sections ?? [];
  const faqs = page?.faqs ?? [];
  const [firstSection, ...restSections] = sections;
  const heroImage = settings?.heroImages?.[0];

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      {/* Hero */}
      <section className="mx-4 lg:mx-auto lg:max-w-7xl lg:px-6 xl:px-4 mt-4 lg:mt-6">
        <div className="relative overflow-hidden rounded-[28px] md:rounded-[36px] bg-gradient-to-br from-[#2e1a08] via-[#4e2e0e] to-[#6d4014] px-5 py-10 sm:px-6 sm:py-14 md:px-12 md:py-20">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px),
                  repeating-linear-gradient(-45deg, #d4a96a 0px, #d4a96a 1px, transparent 1px, transparent 40px)`,
              }}
            />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4a96a]/30 bg-[#d4a96a]/15 px-4 py-1.5 text-sm font-medium text-[#f1d5ad]">
                <span className="h-2 w-2 rounded-full bg-[#d4a96a] animate-pulse" />
                داستان {settings?.brandName}
              </span>
              <h1 className="mb-4 text-2xl sm:text-3xl md:text-5xl font-black leading-tight text-white">
                {page?.title}
              </h1>
              {page?.description && (
                <p className="max-w-xl text-sm md:text-base leading-8 text-[#e8cfa8]">
                  {page.description}
                </p>
              )}

              {stats.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-5 sm:gap-6 md:gap-10">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-xl sm:text-2xl font-black text-[#d4a96a]">{stat.value}</div>
                      <div className="mt-0.5 text-xs text-[#c2883a]">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {heroImage && (
              <div className="relative hidden lg:block h-[280px] xl:h-[320px] overflow-hidden rounded-[28px] border-2 border-[#d4a96a]/25">
                <Image
                  src={heroImage}
                  alt={page?.title ?? ""}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 0px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2e1a08]/60 to-transparent" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story + values */}
      {(firstSection || values.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-14 md:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center xl:gap-12">
            {firstSection && (
              <div className="relative overflow-hidden rounded-[28px] border border-[#e8cfa8] bg-white shadow-[0_16px_40px_rgba(89,48,10,0.08)]">
                <div className="p-6 md:p-8">
                  <h2 className="mb-4 text-2xl font-black text-[#2e1a08]">{firstSection.heading}</h2>
                  {firstSection.paragraphs.map((text, i) => (
                    <p
                      key={i}
                      className="mb-4 text-sm leading-8 text-[#6d4014] md:text-base last:mb-0"
                    >
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {values.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-[#e8cfa8] bg-white p-6 transition-colors hover:border-[#d4a96a] hover:shadow-[0_12px_30px_rgba(89,48,10,0.08)]"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff6ea] text-[#a96c20]">
                    <SiteIcon name={item.icon} size={24} />
                  </div>
                  <h3 className="mb-2 font-bold text-[#4e2e0e]">{item.title}</h3>
                  <p className="text-sm leading-7 text-[#6d4014]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Remaining sections */}
      {restSections.map((section) => (
        <section
          key={section.heading}
          className="mx-4 lg:mx-auto lg:max-w-7xl lg:px-6 xl:px-4 pb-8"
        >
          <div className="rounded-[28px] border border-[#e8cfa8] bg-[#f5e9d5] px-6 py-10 md:px-10 md:py-12 text-center">
            <h2 className="mb-3 text-2xl font-black text-[#2e1a08]">{section.heading}</h2>
            {section.paragraphs.map((text, i) => (
              <p
                key={i}
                className="mx-auto max-w-2xl text-sm leading-8 text-[#6d4014] md:text-base"
              >
                {text}
              </p>
            ))}
          </div>
        </section>
      ))}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 pb-8">
          <div className="rounded-[28px] border border-[#e8cfa8] bg-white p-6 sm:p-8 md:p-10 shadow-[0_16px_40px_rgba(89,48,10,0.08)]">
            <h2 className="mb-6 text-xl md:text-2xl font-black text-[#2e1a08]">
              سوالات متداول
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {faqs.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-[20px] border border-[#e8cfa8] bg-[#fffaf5] px-5 py-4 transition-colors open:bg-white hover:border-[#d4a96a]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#4e2e0e] marker:hidden">
                    <span>{item.question}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-[#a96c20] transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-[#6d4014]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 pb-16">
        <div className="relative overflow-hidden rounded-[28px] border border-[#e8cfa8] bg-white p-6 sm:p-8 md:p-10 shadow-[0_16px_40px_rgba(89,48,10,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,169,106,0.12),transparent_50%)]" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="mb-2 text-xl md:text-2xl font-black text-[#2e1a08]">برای شروع آماده‌اید؟</h3>
              <p className="text-sm text-[#6d4014]">محصولات ما را ببینید.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href={page?.ctaHref || "/products"}
                className="rounded-full bg-[#8a5419] px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_10px_24px_rgba(138,84,25,0.25)] transition-all hover:bg-[#6d4014]"
              >
                {page?.ctaLabel || "مشاهده محصولات"}
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-[#e8cfa8] bg-[#fffaf5] px-8 py-3.5 text-center text-sm font-medium text-[#6d4014] transition-all hover:border-[#d4a96a] hover:text-[#8a5419]"
              >
                تماس با ما
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
