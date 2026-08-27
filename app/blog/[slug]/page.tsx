"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BackLink from "../../components/BackLink";
import PageLoader from "../../components/PageLoader";
import { api, type BlogPost } from "../../lib/api";
import { formatReadTime } from "../../lib/blog-format";

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const [detail, list] = await Promise.all([
          api.getBlogPost(slug),
          api.listBlogPosts(),
        ]);
        if (cancelled) return;
        setPost(detail);
        setRelated(list.filter((p) => p.slug !== slug).slice(0, 2));
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <PageLoader />;

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-[#faf6ee] px-4 py-16 text-center">
        <p className="text-[#6d4014] mb-4">مقاله یافت نشد.</p>
        <BackLink href="/blog">بازگشت به بلاگ</BackLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <BackLink href="/blog">بازگشت به بلاگ</BackLink>
        <article className="bg-white border border-[#e8cfa8] rounded-3xl overflow-hidden mt-4">
          <img src={post.cover} alt={post.title} className="w-full h-48 sm:h-64 md:h-72 object-cover" />
          <div className="p-5 sm:p-8">
            <p className="text-sm text-[#a96c20] mb-2">
              {post.category} • {formatReadTime(post.readTimeMinutes)}
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-4 leading-9">{post.title}</h1>
            <p className="text-[#6d4014] mb-6 text-sm sm:text-base">{post.excerpt}</p>
            <div className="space-y-4">
              {post.content.map((paragraph, index) => (
                <p key={`${post.slug}-${index}`} className="leading-8 text-[#4e2e0e] text-sm sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-[#2e1a08] mb-4">مطالب مرتبط</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/blog/${item.slug}`}
                  className="bg-white border border-[#e8cfa8] rounded-2xl p-4 hover:border-[#c2883a]"
                >
                  <p className="text-xs text-[#a96c20] mb-2">{item.category}</p>
                  <h3 className="font-bold text-[#4e2e0e]">{item.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
