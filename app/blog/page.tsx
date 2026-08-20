import Link from "next/link";
import { blogPosts } from "../data/blog-posts";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2e1a08] mb-3">بلاگ پریسما شاپ</h1>
        <p className="text-[#6d4014] mb-8 text-sm sm:text-base">آموزش‌ها، راهنماها و ایده‌های کاربردی برای کارهای چوبی و کالیگرافی.</p>

        {blogPosts.length === 0 ? (
          <div className="bg-white border border-[#e8cfa8] rounded-2xl p-10 text-center text-[#6d4014]">
            نتیجه‌ای پیدا نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">
            {blogPosts.map((post) => (
              <article key={post.slug} className="bg-white border border-[#e8cfa8] rounded-2xl overflow-hidden">
                <img src={post.cover} alt={post.title} className="w-full h-44 object-cover" />
                <div className="p-4 sm:p-5">
                  <p className="text-xs text-[#a96c20] mb-2">{post.category} • {post.readTime}</p>
                  <h2 className="font-bold text-[#2e1a08] mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-[#6d4014] line-clamp-3 mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#a96c20] shrink-0">{post.date}</span>
                    <Link href={`/blog/${post.slug}`} className="text-sm text-[#6d4014] font-medium hover:text-[#a96c20]">
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
