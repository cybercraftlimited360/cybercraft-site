import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — CyberCraft360 | AI Insights for Houston Businesses",
  description: "Practical AI tips, case studies, and strategies for small and mid-size businesses in Houston looking to automate, grow, and compete.",
  openGraph: {
    title: "Blog — CyberCraft360",
    description: "Practical AI tips and strategies for Houston businesses.",
    url: "https://cybercraft360.com/blog",
    siteName: "CyberCraft360",
    type: "website",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#e4e6f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-sm font-medium text-[#a78bfa] hover:text-white transition-colors">
          ← CyberCraft360
        </Link>
        <Link
          href="/book"
          className="text-sm bg-[#a78bfa] text-[#0f1117] font-semibold px-4 py-2 rounded-full hover:bg-white transition-colors"
        >
          Book a Call
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a78bfa] mb-4 font-medium">
            CyberCraft360 Blog
          </p>
          <h1 className="text-5xl font-light text-white mb-4" style={{ fontFamily: "var(--font-cormorant)" }}>
            AI for the Real World
          </h1>
          <p className="text-[#8b8fa8] text-lg max-w-xl">
            Practical strategies for Houston businesses ready to automate, capture more leads, and stop leaving money on the table.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-[#8b8fa8]">No posts yet — check back soon.</p>
        ) : (
          <div className="space-y-px">
            {posts.map((post, i) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-white/5 rounded-xl p-8 hover:border-[#a78bfa]/30 hover:bg-white/[0.02] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium text-[#a78bfa] bg-[#a78bfa]/10 px-2.5 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2 group-hover:text-[#a78bfa] transition-colors leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-[#8b8fa8] text-sm leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                  </div>
                  <span className="text-[#a78bfa] opacity-0 group-hover:opacity-100 transition-opacity text-lg mt-1 shrink-0">
                    →
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-[#8b8fa8]">
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 border border-[#a78bfa]/20 rounded-2xl p-10 text-center bg-[#a78bfa]/5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#a78bfa] mb-3 font-medium">Free Strategy Call</p>
          <h2 className="text-3xl font-light text-white mb-3" style={{ fontFamily: "var(--font-cormorant)" }}>
            See What AI Would Do for Your Business
          </h2>
          <p className="text-[#8b8fa8] mb-7 max-w-md mx-auto text-sm">
            30 minutes with Saad — no pitch, just a real look at what we'd build for you specifically.
          </p>
          <Link
            href="/book"
            className="inline-block bg-[#a78bfa] text-[#0f1117] font-semibold px-8 py-3 rounded-full hover:bg-white transition-colors text-sm"
          >
            Book Your Free Call
          </Link>
        </div>
      </div>
    </main>
  );
}
