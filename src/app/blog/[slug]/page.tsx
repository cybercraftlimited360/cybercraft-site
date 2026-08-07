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
      images: [{
        url: `https://cybercraft360.com/og?title=${encodeURIComponent(post.title)}&tag=${encodeURIComponent(post.tags?.[0] ?? "AI Agency · USA")}`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`https://cybercraft360.com/og?title=${encodeURIComponent(post.title)}&tag=${encodeURIComponent(post.tags?.[0] ?? "AI Agency · USA")}`],
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

// Extract FAQ pairs from markdown: ## Common Questions + ### H3 + paragraph
function extractFAQs(content: string): Array<{ q: string; a: string }> {
  const faqSection = content.split(/^## Common Questions/im)[1] ?? "";
  const matches = [...faqSection.matchAll(/^### (.+)\n+([\s\S]+?)(?=\n###|\n##|$)/gm)];
  return matches.slice(0, 6).map((m) => ({
    q: m[1].trim(),
    a: m[2].replace(/\n+/g, " ").replace(/\[.*?\]\(.*?\)/g, "").trim().slice(0, 300),
  }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const siteUrl = "https://cybercraft360.com";
  const postUrl = `${siteUrl}/blog/${slug}`;
  const faqs = extractFAQs(post.content);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: "Saad Imran", url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: "CyberCraft360",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo-mark.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    image: `${siteUrl}/og?title=${encodeURIComponent(post.title)}&tag=${encodeURIComponent(post.tags?.[0] ?? "AI Agency · USA")}`,
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#e4e6f0]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto" style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(15,17,23,0.92)" }}>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] text-[#a78bfa] font-medium hover:text-white transition-colors">← CyberCraft360</Link>
          <Link href="/blog" className="text-sm text-[#8b8fa8] hover:text-white transition-colors">Blog</Link>
        </div>
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
