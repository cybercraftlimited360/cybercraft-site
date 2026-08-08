import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import SiteSecondaryNav from "@/components/ui/site-secondary-nav";

export const metadata: Metadata = {
  title: "Blog — CyberCraft360 | AI Insights for Small Businesses",
  description: "Practical AI tips, case studies, and strategies for small and mid-size businesses looking to automate, grow, and compete.",
  openGraph: {
    title: "Blog — CyberCraft360",
    description: "Practical AI tips and strategies for small businesses across the US.",
    url: "https://cybercraft360.com/blog",
    siteName: "CyberCraft360",
    type: "website",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-[#0a0c12] text-[#e4e6f0]">
      <SiteSecondaryNav active="blog" />

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-16">
          <p className="text-xs uppercase tracking-[0.2em] mb-4 font-medium" style={{ color: "#00d4ff" }}>
            CyberCraft360 Blog
          </p>
          <h1 className="text-5xl font-light text-white mb-4" style={{ fontFamily: "var(--font-cormorant)" }}>
            AI for the Real World
          </h1>
          <p className="text-lg max-w-xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            Practical strategies for business owners ready to automate, capture more leads, and stop leaving money on the table.
          </p>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.35)" }}>No posts yet — check back soon.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl p-8 transition-all duration-200 no-underline"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.01)",
                  color: "inherit",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ color: "#00d4ff", background: "rgba(0,212,255,0.1)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2
                      className="text-xl font-medium text-white mb-2 leading-snug transition-colors"
                      style={{ fontFamily: "var(--font-jakarta), system-ui, sans-serif" }}
                    >
                      {post.title}
                    </h2>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {post.description}
                    </p>
                  </div>
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-lg mt-1 shrink-0"
                    style={{ color: "#00d4ff" }}
                  >
                    →
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  <span>{formatDate(post.date)}</span>
                  <span>·</span>
                  <span>{post.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="mt-20 rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.04)" }}
        >
          <p className="text-xs uppercase tracking-[0.2em] mb-3 font-medium" style={{ color: "#00d4ff" }}>
            Free Strategy Call
          </p>
          <h2 className="text-3xl font-light text-white mb-3" style={{ fontFamily: "var(--font-cormorant)" }}>
            See What AI Would Do for Your Business
          </h2>
          <p className="mb-7 max-w-md mx-auto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            30 minutes with Saad — no pitch, just a real look at what we&apos;d build for you specifically.
          </p>
          <Link
            href="/book"
            className="inline-block font-semibold px-8 py-3 rounded-xl text-sm no-underline transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
              color: "#fff",
            }}
          >
            Book Your Free Call
          </Link>
        </div>
      </div>
    </main>
  );
}
