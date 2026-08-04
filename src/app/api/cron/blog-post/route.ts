import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const GITHUB_REPO = "cybercraftlimited360/cybercraft-site";
const GITHUB_BRANCH = "main";
const POSTS_PATH = "src/content/blog";

const KEYWORD_POOL = [
  "AI phone answering service for small business",
  "how to automate customer follow up",
  "AI vs hiring staff for small business",
  "best AI tools for Houston businesses",
  "how to never miss a business call",
  "AI chatbot for service businesses",
  "automating lead follow up with AI",
  "AI for HVAC companies",
  "AI for dental offices",
  "AI for real estate agents Houston",
  "AI for restaurant businesses",
  "how AI saves small businesses time",
  "AI workflow automation for small business",
  "what is conversational AI",
  "AI customer service vs human agents",
  "how to get more leads with AI",
  "AI appointment booking for small business",
  "AI tools that pay for themselves",
  "how AI helps businesses compete with larger companies",
  "AI for contractors and trades businesses",
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function generatePost(keyword: string): Promise<{ title: string; content: string } | null> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are Saad Imran, founder of CyberCraft360 — a boutique AI agency in Houston, TX that builds custom voice agents, chatbots, and workflow automation for small and mid-size businesses. You have worked with HVAC companies, dental offices, real estate teams, contractors, and restaurants. You are direct, specific, and allergic to corporate fluff.

Write a premium blog post targeting this keyword: "${keyword}"

VOICE & TONE:
- Write like a founder who has seen hundreds of businesses — confident, conversational, occasionally blunt
- Use real-world scenarios and specific dollar amounts, time savings, or business outcomes where relevant (e.g. "a plumbing company we worked with was missing 40% of inbound calls on weekends")
- Never use phrases like "in today's fast-paced world", "leverage", "revolutionize", "game-changer", "seamlessly", "cutting-edge", or "dive in"
- No motivational filler. Every sentence must earn its place
- Write to a business owner who is skeptical and time-poor, not a tech enthusiast

STRUCTURE:
- Hook opening: start mid-thought or with a specific scenario — NOT a definition or "AI is changing everything"
- 3–4 H2 sections with tight, specific paragraphs (no lists — paragraphs only)
- Each section should answer a real question a business owner would actually have
- Close with a CTA to book a free 30-minute strategy call at cybercraft360.com/book — make it feel like a natural next step, not a sales pitch

SEO:
- Title: under 70 characters, includes the keyword naturally, sounds like something a real person would search
- Meta description: under 155 characters, specific benefit, no hype
- Length: 700–950 words

Return ONLY valid JSON in this exact format (no markdown fences):
{
  "title": "The post title here",
  "description": "One sentence meta description under 155 characters",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "body": "The full markdown body of the post here"
}`;

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
      stream: false,
    }),
  });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(clean);
    const date = formatDate(new Date());
    const mdx = `---
title: "${parsed.title.replace(/"/g, "'")}"
description: "${parsed.description.replace(/"/g, "'")}"
date: "${date}"
tags: [${parsed.tags.map((t: string) => `"${t}"`).join(", ")}]
---

${parsed.body}`;
    return { title: parsed.title, content: mdx };
  } catch {
    return null;
  }
}

async function commitToGitHub(slug: string, content: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;

  const filePath = `${POSTS_PATH}/${slug}.mdx`;
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;

  const encoded = Buffer.from(content).toString("base64");

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "CyberCraft360-BlogBot",
    },
    body: JSON.stringify({
      message: `Auto-publish blog post: ${slug}`,
      content: encoded,
      branch: GITHUB_BRANCH,
    }),
  });

  return res.ok;
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pick next keyword (rotate through pool)
    const usedRaw = await redis.get<string[]>("blog:used_keywords") ?? [];
    const available = KEYWORD_POOL.filter(k => !usedRaw.includes(k));
    const pool = available.length > 0 ? available : KEYWORD_POOL; // reset when exhausted
    const keyword = pool[Math.floor(Math.random() * pool.length)];

    // Generate post
    const post = await generatePost(keyword);
    if (!post) {
      return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
    }

    const slug = slugify(post.title);

    // Commit to GitHub
    const committed = await commitToGitHub(slug, post.content);
    if (!committed) {
      return NextResponse.json({ ok: false, error: "GitHub commit failed" }, { status: 500 });
    }

    // Mark keyword as used
    usedRaw.push(keyword);
    await redis.set("blog:used_keywords", usedRaw);

    // Submit to Google Indexing API for same-day crawl
    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com"}/blog/${slug}`;
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com"}/api/seo/index-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ url: blogUrl }),
    }).catch(() => {});

    // Auto-post to Facebook + LinkedIn + Instagram
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
    const blogLink = `${siteUrl}/blog/${slug}`;
    const shareMessage = `New post: ${post.title}\n\nRead more → ${blogLink}`;
    const ogImageUrl = `${siteUrl}/og?title=${encodeURIComponent(post.title)}&tag=${encodeURIComponent(post.tags?.[0] ?? "AI Agency · Houston, TX")}`;
    let socialResult: Record<string, unknown> = {};
    try {
      const [fbRes, liRes, igRes] = await Promise.all([
        fetch(`${siteUrl}/api/social/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ message: shareMessage, link: blogLink, platforms: ["facebook"] }),
        }),
        fetch(`${siteUrl}/api/social/linkedin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ text: shareMessage, link: blogLink, imageUrl: ogImageUrl }),
        }),
        fetch(`${siteUrl}/api/social/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ message: shareMessage, imageUrl: ogImageUrl, platforms: ["instagram"] }),
        }),
      ]);
      socialResult = {
        facebook: await fbRes.json(),
        linkedin: await liRes.json(),
        instagram: await igRes.json(),
      };
    } catch (e) {
      socialResult = { error: String(e) };
    }

    // Log it
    const log = await redis.get<any[]>("blog:auto_posts") ?? [];
    log.unshift({ slug, keyword, title: post.title, publishedAt: new Date().toISOString(), social: socialResult });
    await redis.set("blog:auto_posts", log.slice(0, 100));

    console.log(`[blog-cron] Published: ${slug}`);
    return NextResponse.json({ ok: true, slug, keyword, title: post.title, social: socialResult });

  } catch (err) {
    console.error("[blog-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
