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

  const prompt = `Write a detailed, SEO-optimised blog post for CyberCraft360, an AI agency in Houston, TX.

Target keyword: "${keyword}"

Requirements:
- Title: catchy, includes the keyword naturally, under 70 characters
- Length: 600-900 words
- Tone: direct, expert, warm — like a knowledgeable advisor talking to a business owner
- Structure: intro, 3-4 H2 sections, conclusion with CTA
- Every section must provide real, specific value — no filler
- End with a call to action for a free 30-minute strategy call at cybercraft360.com/book
- Do NOT use bullet point lists — use short paragraphs instead
- Do NOT mention competitors by name
- Write as if you are a senior consultant at CyberCraft360

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

    // Auto-post to Facebook + LinkedIn
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
    const blogLink = `${siteUrl}/blog/${slug}`;
    const shareMessage = `New post: ${post.title}\n\nRead more → ${blogLink}`;
    let socialResult: Record<string, unknown> = {};
    try {
      const [fbRes, liRes] = await Promise.all([
        fetch(`${siteUrl}/api/social/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ message: shareMessage, link: blogLink, platforms: ["facebook"] }),
        }),
        fetch(`${siteUrl}/api/social/linkedin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
          body: JSON.stringify({ text: shareMessage, link: blogLink }),
        }),
      ]);
      socialResult = {
        facebook: await fbRes.json(),
        linkedin: await liRes.json(),
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
