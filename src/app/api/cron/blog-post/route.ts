import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const GITHUB_REPO = "cybercraftlimited360/cybercraft-site";
const GITHUB_BRANCH = "main";
const POSTS_PATH = "src/content/blog";

const KEYWORD_POOL = [
  // Core offering
  "AI phone answering service for small business",
  "how to automate customer follow up",
  "AI vs hiring staff for small business",
  "best AI tools for Houston businesses",
  "how to never miss a business call",
  "AI chatbot for service businesses",
  "automating lead follow up with AI",
  "AI workflow automation for small business",
  "what is conversational AI",
  "AI customer service vs human agents",
  "how to get more leads with AI",
  "AI appointment booking for small business",
  "AI tools that pay for themselves",
  "how AI helps businesses compete with larger companies",
  "AI for contractors and trades businesses",
  "how AI saves small businesses time",
  // Industry-specific
  "AI for HVAC companies",
  "AI for dental offices",
  "AI for real estate agents Houston",
  "AI for restaurant businesses",
  "AI for law firms small business",
  "AI for home services businesses",
  "AI phone agent for plumbers",
  "AI for property management companies",
  "AI for auto repair shops",
  "AI for medical spas and aesthetics clinics",
  "AI for roofing companies",
  "AI for insurance agents",
  "AI for mortgage brokers",
  "AI for cleaning companies",
  // Pain-point long-tail
  "how to stop missing calls when youre on a job",
  "why small businesses lose leads after hours",
  "how to follow up with leads automatically",
  "what happens when you miss a business call",
  "how to book more appointments without hiring staff",
  "how to reduce no-shows for small business",
  "how to qualify leads faster with AI",
  "how to respond to leads in under 5 minutes",
  "how to handle high call volume without more staff",
  "how small businesses can compete 24 7",
  // ROI and cost
  "how much does AI cost for small business",
  "is AI worth it for small business",
  "ROI of AI phone agents for service businesses",
  "how to calculate ROI of business automation",
  "AI vs virtual receptionist cost comparison",
  "how to reduce customer service costs with AI",
  // Houston-local
  "AI automation agency Houston Texas",
  "Houston small business AI solutions",
  "best AI agency Houston TX",
  "AI phone agent Houston business",
  "Houston business automation services",
  // Education
  "how does an AI voice agent work",
  "difference between AI chatbot and AI voice agent",
  "what can AI do for my small business",
  "how to get started with AI for business",
  "AI business automation explained for beginners",
  "how AI lead qualification works",
  "what is an AI phone agent",
  "how to automate customer onboarding",
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

Write a thorough, authoritative blog post targeting this keyword: "${keyword}"

CRITICAL — NEVER DISCLOSE TOOLS OR VENDORS:
- NEVER name any specific software, platform, API, or vendor in the post — no matter what
- Instead use generic descriptions: "AI voice platform", "cloud telephony infrastructure", "large language model", "workflow automation software", "scheduling system", "AI chatbot builder", etc.
- Do NOT mention: ElevenLabs, Twilio, Cerebras, OpenAI, GPT, Redis, Bland AI, Higgsfield, Vercel, Next.js, Shopify, Zapier, Make, n8n, HubSpot, Salesforce, or any other specific product
- CyberCraft360 builds proprietary systems using best-in-class AI components — keep it at that level of abstraction

VOICE & TONE:
- Write like a founder who has seen hundreds of businesses — confident, conversational, occasionally blunt
- Use real-world scenarios and specific dollar amounts, time savings, or business outcomes (e.g. "a plumbing company we worked with was missing 40% of inbound calls on weekends")
- Never use: "in today's fast-paced world", "leverage", "revolutionize", "game-changer", "seamlessly", "cutting-edge", "dive in", "unlock", "empower", or "transform"
- No motivational filler — every sentence must earn its place
- Write to a skeptical, time-poor business owner, not a tech enthusiast

STRUCTURE (follow this exactly):
- Hook paragraph: start mid-thought or with a specific real scenario — NOT a definition or "AI is changing everything"
- 5–6 H2 sections, each answering a specific question a business owner would actually have
- Each section: 3–4 solid paragraphs with specific examples, numbers, or outcomes
- After the main sections: add an H2 "Common Questions" section with 3 real FAQs as H3s, each answered in 2–3 paragraphs
- Close paragraph: CTA to book a free 30-minute strategy call at cybercraft360.com/book — feel like a natural next step, not a pitch
- Link to the booking page at least once as: [Book a free strategy call](https://cybercraft360.com/book)

SEO:
- Title: under 70 characters, includes the keyword naturally, written like something a real person searches
- Meta description: under 155 characters, specific benefit, no hype
- Target length: 1,600–2,200 words — this is a definitive guide, not a quick read
- Use the keyword and natural variations throughout, especially in the first 100 words and in at least 2 H2s

Return ONLY valid JSON in this exact format (no markdown fences, no extra text):
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
      max_tokens: 4000,
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
    const shareMessage = `${post.title}\n\nMost business owners don't realize how much revenue slips through the cracks when phones go unanswered or follow-ups don't happen. We wrote up exactly how to fix it.\n\nFull breakdown → ${blogLink}\n\n#HoustonBusiness #AIAutomation #SmallBusiness #CyberCraft360`;
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
