import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "../../data/blog-posts";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#faf6ee]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/blog" className="text-sm text-[#6d4014] hover:text-[#a96c20]">← بازگشت به بلاگ</Link>
        <article className="bg-white border border-[#e8cfa8] rounded-3xl overflow-hidden mt-4">
          <img src={post.cover} alt={post.title} className="w-full h-72 object-cover" />
          <div className="p-8">
            <p className="text-sm text-[#a96c20] mb-2">{post.category} • {post.readTime}</p>
            <h1 className="text-3xl font-black text-[#2e1a08] mb-4">{post.title}</h1>
            <p className="text-[#6d4014] mb-6">{post.excerpt}</p>
            <div className="space-y-4">
              {post.content.map((paragraph) => (
                <p key={paragraph} className="leading-8 text-[#4e2e0e]">{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#2e1a08] mb-4">مطالب مرتبط</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="bg-white border border-[#e8cfa8] rounded-2xl p-4 hover:border-[#c2883a]">
                <p className="text-xs text-[#a96c20] mb-2">{item.category}</p>
                <h3 className="font-bold text-[#4e2e0e]">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
