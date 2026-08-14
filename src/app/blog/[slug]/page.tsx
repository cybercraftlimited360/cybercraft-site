import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPost } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import SiteSecondaryNav from "@/components/ui/site-secondary-nav";
import Image from "next/image";
import BlogChecklistCTA from "@/components/ui/blog-checklist-cta";

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
    <main className="min-h-screen bg-[#0a0c12] text-[#e4e6f0]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <SiteSecondaryNav active="blog" />

      <article className="max-w-2xl mx-auto px-6 py-20">
        {/* Tags */}
        <div className="flex items-center gap-2 mb-6">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.1)" }}>
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
        <div className="flex items-center gap-3 text-sm mb-12 pb-8 border-b border-white/5" style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        {/* Content */}
        <div className="prose-blog">
          <MDXRemote source={post.content} />
        </div>

        {/* Lead magnet */}
        <BlogChecklistCTA source={slug} />

        {/* CTA */}
        <div className="mt-20 rounded-2xl p-10 text-center" style={{ border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.04)" }}>
          <p className="text-xs uppercase tracking-[0.2em] mb-3 font-medium" style={{ color: "#00d4ff" }}>Free Strategy Call</p>
          <h2 className="text-3xl font-light text-white mb-3" style={{ fontFamily: "var(--font-cormorant)" }}>
            Ready to See This in Action?
          </h2>
          <p className="mb-7 text-sm max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            30 minutes with Saad — we&apos;ll show you exactly what we&apos;d build for your business.
          </p>
          <Link
            href="/book"
            className="inline-block font-semibold px-8 py-3 rounded-xl text-sm no-underline transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}
          >
            Book Your Free Call
          </Link>
        </div>
      </article>
    </main>
  );
}
