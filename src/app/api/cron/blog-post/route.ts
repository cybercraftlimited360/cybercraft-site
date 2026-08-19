import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

async function notifyFailure(step: string, detail: string) {
  await sendEmail({
    to: "cybercraftlimited@gmail.com",
    subject: `⚠️ Blog Post FAILED — ${step}`,
    html: `<div style="font-family:sans-serif;padding:24px;"><h2 style="color:#dc2626;">Blog Post Cron Failed</h2><p><strong>Step:</strong> ${step}</p><p><strong>Detail:</strong> ${detail}</p><p style="color:#6b7280;font-size:12px;">${new Date().toISOString()}</p></div>`,
  }).catch(() => {});
}

const GITHUB_REPO = "cybercraftlimited360/cybercraft-site";
const GITHUB_BRANCH = "main";
const POSTS_PATH = "src/content/blog";

const KEYWORD_POOL = [
  // Core offering
  "AI phone answering service for small business",
  "how to automate customer follow up",
  "AI vs hiring staff for small business",
  "best AI tools for small businesses",
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
  "AI for real estate agents",
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
  // USA-wide reach
  "AI automation agency for small business USA",
  "best AI agency for US small businesses",
  "AI phone agent for US service businesses",
  "business automation services across America",
  "AI solutions for small business owners nationwide",
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

// Slugs of existing published posts — used to inject internal links into new posts
const EXISTING_SLUGS = [
  { slug: "ai-receptionist-for-small-business",                          title: "AI Receptionist for Small Business" },
  { slug: "ai-chatbot-for-service-businesses-that-actually-boosts-bookings", title: "AI Chatbot for Service Businesses That Boosts Bookings" },
  { slug: "ai-for-contractors-and-trades-businesses-real-roi-in-the-field", title: "AI for Contractors and Trades Businesses" },
  { slug: "5-signs-your-business-is-ready-for-ai",                       title: "5 Signs Your Business Is Ready for AI" },
  { slug: "how-to-use-ai-to-follow-up-leads",                            title: "How to Use AI to Follow Up With Leads" },
  { slug: "how-ai-saves-small-businesses-time-real-results-from-houston", title: "How AI Saves Small Businesses Time" },
  { slug: "how-ai-helps-small-businesses-compete-with-bigger-companies",  title: "How AI Helps Small Businesses Compete With Bigger Companies" },
  { slug: "how-much-does-a-custom-ai-chatbot-cost",                      title: "How Much Does a Custom AI Chatbot Cost?" },
  { slug: "how-we-built-an-ai-that-books-appointments-while-you-sleep",  title: "How We Built an AI That Books Appointments While You Sleep" },
  { slug: "ai-voice-agents-vs-call-centers",                             title: "AI Voice Agents vs. Call Centers" },
  { slug: "why-small-businesses-need-ai-in-2025",                        title: "Why Small Businesses Need AI" },
  { slug: "what-is-conversational-ai-a-houston-business-owners-guide",   title: "What Is Conversational AI?" },
  { slug: "ai-chatbot-houston-texas",                                     title: "AI Chatbot for Businesses: What's Working in 2026" },
];

function escapeControlCharsInStrings(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped) { result += c; escaped = false; }
    else if (c === "\\") { result += c; escaped = true; }
    else if (c === '"') { result += c; inString = !inString; }
    else if (inString && c.charCodeAt(0) < 32) {
      if (c === "\n") result += "\\n";
      else if (c === "\r") result += "\\r";
      else if (c === "\t") result += "\\t";
      else result += `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
    } else {
      result += c;
    }
  }
  return result;
}

async function generatePost(keyword: string, linkSuggestions: string): Promise<{ title: string; content: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are Saad Imran, founder of CyberCraft360 — a boutique AI agency serving small and mid-size businesses across the United States. You build custom voice agents, chatbots, and workflow automation. You have worked with HVAC companies, dental offices, real estate teams, contractors, and restaurants nationwide. You are direct, specific, and allergic to corporate fluff.

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
- INTERNAL LINKS: naturally weave 2–3 of the following links into the body where they are genuinely relevant. Do NOT force them. Do NOT add a "Related reading" section — embed them inline as anchor text:
${linkSuggestions}
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

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "qwen/qwen3.6-27b",
      messages: [
        { role: "system", content: "/no_think" },
        { role: "user", content: prompt },
      ],
      max_tokens: 6000,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    console.error("[blog-cron] Groq error", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  // Strip <think>...</think> blocks from reasoning models before parsing
  const noThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const stripped = noThink.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const clean = escapeControlCharsInStrings(stripped);

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
  } catch (e) {
    console.error("[blog-cron] JSON parse failed:", String(e), "raw start:", raw.slice(0, 200));
    return null;
  }
}

async function commitToGitHub(slug: string, content: string): Promise<boolean> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) { console.error("[blog-cron] GITHUB_TOKEN not set"); return false; }

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

  if (!res.ok) {
    console.error("[blog-cron] GitHub commit failed", res.status, await res.text());
  }
  return res.ok;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  const secret = process.env.CRON_SECRET;
  if (auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Build internal link suggestions from static list + previously published posts
    const publishedLog = await redis.get<any[]>("blog:auto_posts") ?? [];
    const dynamicSlugs = publishedLog
      .filter((p: any) => p.slug && p.title)
      .map((p: any) => ({ slug: p.slug as string, title: p.title as string }));
    const allSlugs = [...EXISTING_SLUGS, ...dynamicSlugs]
      .filter((v, i, arr) => arr.findIndex(x => x.slug === v.slug) === i);
    const linkSuggestions = allSlugs
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
      .map(p => `- [${p.title}](https://cybercraft360.com/blog/${p.slug})`)
      .join("\n");

    // Pick next keyword (rotate through pool)
    const usedRaw = await redis.get<string[]>("blog:used_keywords") ?? [];
    const available = KEYWORD_POOL.filter(k => !usedRaw.includes(k));
    const pool = available.length > 0 ? available : KEYWORD_POOL;
    const keyword = pool[Math.floor(Math.random() * pool.length)];

    // Generate post
    const post = await generatePost(keyword, linkSuggestions);
    if (!post) {
      await notifyFailure("Content generation", `Keyword: ${keyword} — Groq returned null`);
      return NextResponse.json({ ok: false, error: "Generation failed" }, { status: 500 });
    }

    const slug = slugify(post.title);

    // Commit directly to GitHub — no review queue
    const committed = await commitToGitHub(slug, post.content);
    if (!committed) {
      await notifyFailure("GitHub commit", `slug: ${slug}`);
      return NextResponse.json({ ok: false, error: "GitHub commit failed" }, { status: 500 });
    }

    // Mark keyword as used
    usedRaw.push(keyword);
    await redis.set("blog:used_keywords", usedRaw);

    // Log to Redis for tracking
    const log = await redis.get<any[]>("blog:auto_posts") ?? [];
    log.unshift({ slug, title: post.title, keyword, publishedAt: new Date().toISOString() });
    await redis.set("blog:auto_posts", log.slice(0, 100));

    console.log(`[blog-cron] Published: ${slug}`);
    return NextResponse.json({ ok: true, slug, keyword, title: post.title });

  } catch (err) {
    console.error("[blog-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
