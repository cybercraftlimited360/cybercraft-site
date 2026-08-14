import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// POST — generate a draft social or blog post and save it to the pending queue
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const type: "social" | "blog" = body.type === "blog" ? "blog" : "social";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  if (type === "social") {
    // Generate copy + photo via the existing generate-post endpoint
    const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({}),
    });
    if (!genRes.ok) return NextResponse.json({ error: "Copy generation failed" }, { status: 500 });

    const { copy, photoUrl, campaignIndex, campaign, week, day } = await genRes.json();
    const layout = (campaignIndex % 4) + 1;

    const imageParams = new URLSearchParams({
      hl: copy.imageHeadline,
      sl: copy.imageSubline,
      bd: copy.imageBody,
      layout: String(layout),
      ...(photoUrl ? { photo: photoUrl } : {}),
    });

    const id = `sp_${Date.now()}`;
    const entry = {
      id,
      campaignIndex,
      campaign,
      week,
      day,
      layout,
      copy,
      photoUrl,
      squareImageUrl: `${siteUrl}/social-image?${imageParams.toString()}&aspect=square`,
      landscapeImageUrl: `${siteUrl}/social-image?${imageParams.toString()}&aspect=landscape`,
      generatedAt: new Date().toISOString(),
    };

    const pending = await redis.get<any[]>("social:pending_posts") ?? [];
    pending.unshift(entry);
    await redis.set("social:pending_posts", pending.slice(0, 20));

    return NextResponse.json({ ok: true, id, headline: copy.imageHeadline });
  }

  // Blog draft generation
  const KEYWORD_POOL = [
    "AI phone answering service for small business",
    "how to automate customer follow up",
    "AI vs hiring staff for small business",
    "best AI tools for small businesses",
    "how to never miss a business call",
    "AI chatbot for service businesses",
    "automating lead follow up with AI",
    "AI workflow automation for small business",
    "AI appointment booking for small business",
    "AI for HVAC companies",
    "AI for dental offices",
    "AI for real estate agents",
    "AI for home services businesses",
    "AI phone agent for plumbers",
    "why small businesses lose leads after hours",
    "how to follow up with leads automatically",
    "how to book more appointments without hiring staff",
    "how to reduce no-shows for small business",
    "AI automation agency for small business USA",
  ];

  const used = await redis.get<string[]>("blog:used_keywords") ?? [];
  const remaining = KEYWORD_POOL.filter(k => !used.includes(k));
  const keyword = remaining.length > 0
    ? remaining[Math.floor(Math.random() * remaining.length)]
    : KEYWORD_POOL[Math.floor(Math.random() * KEYWORD_POOL.length)];

  const blogCronRes = await fetch(`${siteUrl}/api/cron/blog-post?secret=${process.env.CRON_SECRET}&queue=true`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  if (!blogCronRes.ok) {
    // Fallback: call generate-post directly via Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

    const prompt = `You are Saad Imran, founder of CyberCraft360. Write a blog post for the keyword: "${keyword}". Return JSON only: {"title":"...","description":"...","content":"...mdx content..."}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });
    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { return NextResponse.json({ error: "Parse failed" }, { status: 500 }); }

    const id = `bp_${Date.now()}`;
    const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const entry = { id, keyword, slug, title: parsed.title, description: parsed.description, content: parsed.content, generatedAt: new Date().toISOString() };

    const pending = await redis.get<any[]>("blog:pending_posts") ?? [];
    pending.unshift(entry);
    await redis.set("blog:pending_posts", pending.slice(0, 10));
    return NextResponse.json({ ok: true, id, title: parsed.title });
  }

  const result = await blogCronRes.json();
  return NextResponse.json({ ok: true, ...result });
}
