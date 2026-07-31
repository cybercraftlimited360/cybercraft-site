import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPost } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — CyberCraft360`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://cybercraft360.com/blog/${slug}`,
      siteName: "CyberCraft360",
      type: "article",
      publishedTime: post.date,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#e4e6f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/blog" className="text-sm font-medium text-[#a78bfa] hover:text-white transition-colors">
          ← All Posts
        </Link>
        <Link
          href="/book"
          className="text-sm bg-[#a78bfa] text-[#0f1117] font-semibold px-4 py-2 rounded-full hover:bg-white transition-colors"
        >
          Book a Call
        </Link>
      </nav>

      <article className="max-w-2xl mx-auto px-6 py-20">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-6">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-[#a78bfa] bg-[#a78bfa]/10 px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1
          className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-[#8b8fa8] mb-12 pb-8 border-b border-white/5">
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        {/* Content */}
        <div className="prose-blog">
          <MDXRemote source={post.content} />
        </div>

        {/* CTA */}
        <div className="mt-20 border border-[#a78bfa]/20 rounded-2xl p-10 text-center bg-[#a78bfa]/5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a78bfa] mb-3 font-medium">Free Strategy Call</p>
          <h2 className="text-3xl font-light text-white mb-3" style={{ fontFamily: "var(--font-cormorant)" }}>
            Ready to See This in Action?
          </h2>
          <p className="text-[#8b8fa8] mb-7 text-sm max-w-sm mx-auto">
            30 minutes with Saad — we'll show you exactly what we'd build for your business.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[#a78bfa] text-[#0f1117] font-semibold px-8 py-3 rounded-full hover:bg-white transition-colors text-sm"
          >
            Book Your Free Call
          </Link>
        </div>
      </article>
    </main>
  );
}
