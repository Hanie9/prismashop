import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "../components/BackLink";
import { getApiBase, type SitePage } from "../lib/api";

async function fetchPage(slug: string): Promise<SitePage | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/pages/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SitePage;
  } catch {
    return null;
  }
}

export default async function GenericPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  const hasCta = Boolean(page.ctaLabel && page.ctaHref);
  const ctaIsContact = hasCta && page.ctaHref.split("?")[0] === "/contact";

  return (
    <div className="min-h-[70vh] bg-[#faf6ee]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <BackLink href="/" className="mb-4">
          بازگشت به صفحه اصلی
        </BackLink>
        <div className="bg-white border border-[#e8cfa8] rounded-3xl p-8 md:p-12">
          <h1 className="text-3xl font-black text-[#2e1a08] mb-4">{page.title}</h1>
          {page.description && (
            <p className="text-[#6d4014] leading-8 mb-8">{page.description}</p>
          )}

          {page.sections.length > 0 && (
            <div className="mb-8 space-y-6">
              {page.sections.map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <h2 className="mb-2 text-lg font-bold text-[#4e2e0e]">{section.heading}</h2>
                  )}
                  {section.paragraphs.map((text, j) => (
                    <p key={j} className="mb-2 text-sm leading-8 text-[#6d4014] last:mb-0">
                      {text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {page.faqs.length > 0 && (
            <div className="mb-8 space-y-3">
              {page.faqs.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-[#e8cfa8] bg-[#fffaf5] px-4 py-3"
                >
                  <summary className="cursor-pointer list-none text-sm font-bold text-[#4e2e0e] marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm leading-7 text-[#6d4014]">{item.answer}</p>
                </details>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {hasCta && (
              <Link
                href={page.ctaHref}
                className="bg-[#6d4014] hover:bg-[#4e2e0e] text-white px-5 py-2.5 rounded-xl transition-colors"
              >
                {page.ctaLabel}
              </Link>
            )}
            {!ctaIsContact && (
              <Link
                href="/contact"
                className={
                  hasCta
                    ? "border border-[#a96c20] text-[#6d4014] hover:bg-[#fdf8f3] px-5 py-2.5 rounded-xl transition-colors"
                    : "bg-[#6d4014] hover:bg-[#4e2e0e] text-white px-5 py-2.5 rounded-xl transition-colors"
                }
              >
                تماس با پشتیبانی
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
