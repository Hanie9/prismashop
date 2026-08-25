"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";
import { api, type BlogPost } from "../lib/api";
import { formatBlogDate, formatReadTime } from "../data/blog-posts";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await api.listBlogPosts();
        if (!cancelled) setPosts(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "بارگذاری مقالات ناموفق بود.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-3">بلاگ حروف کالیگرافی</h1>
        <p className="text-[#6d4014] mb-8 text-sm sm:text-base">
          راهنماها و ایده‌های کاربردی فقط درباره حروف کالیگرافی چوبی؛ از انتخاب و نصب تا نگهداری و هدیه.
        </p>

        {error ? (
          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center text-red-700">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-[#e8cfa8] rounded-2xl p-10 text-center text-[#6d4014]">
            نتیجه‌ای پیدا نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {posts.map((post) => (
              <article key={post.slug} className="bg-white border border-[#e8cfa8] rounded-2xl overflow-hidden">
                <img src={post.cover} alt={post.title} className="w-full h-44 object-cover" />
                <div className="p-4 sm:p-5">
                  <p className="text-xs text-[#a96c20] mb-2">
                    {post.category} • {formatReadTime(post.readTimeMinutes)}
                  </p>
                  <h2 className="font-bold text-[#2e1a08] mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-[#6d4014] line-clamp-3 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#a96c20] shrink-0">
                      {formatBlogDate(post.createdAt)}
                    </span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm text-[#6d4014] font-medium hover:text-[#a96c20]"
                    >
                      مطالعه مقاله
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
