import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const GITHUB_REPO = "cybercraftlimited360/cybercraft-site";
const GITHUB_BRANCH = "main";
const POSTS_PATH = "src/content/blog";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-token") === process.env.ADMIN_TOKEN;
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
      message: `Publish blog post: ${slug}`,
      content: encoded,
      branch: GITHUB_BRANCH,
    }),
  });
  return res.ok;
}

// POST — approve: optionally accept edited content in body, then commit
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const { content: editedContent } = body as { content?: string };

  const pending = await redis.get<any[]>("blog:pending_posts") ?? [];
  const entry = pending.find((p) => p.id === id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const finalContent = editedContent ?? entry.content;
  const committed = await commitToGitHub(entry.slug, finalContent);
  if (!committed) return NextResponse.json({ error: "GitHub commit failed" }, { status: 500 });

  // Remove from pending
  const updated = pending.filter((p) => p.id !== id);
  await redis.set("blog:pending_posts", updated);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
  const blogLink = `${siteUrl}/blog/${entry.slug}`;

  // Trigger Google indexing
  fetch(`${siteUrl}/api/seo/index-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ url: blogLink }),
  }).catch(() => {});

  // Bing IndexNow — instant ping so Bing crawls the new post same day
  const bingKey = process.env.BING_INDEXNOW_KEY;
  if (bingKey) {
    fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: "cybercraft360.com",
        key: bingKey,
        keyLocation: `https://cybercraft360.com/${bingKey}.txt`,
        urlList: [blogLink],
      }),
    }).catch(() => {});
  }

  // Share to social
  const shareMessage = `${entry.title}\n\nMost business owners don't realize how much revenue slips through the cracks when phones go unanswered or follow-ups don't happen. We wrote up exactly how to fix it.\n\nFull breakdown → ${blogLink}\n\n#AIAutomation #SmallBusiness #BusinessAutomation #CyberCraft360`;
  const ogImageUrl = entry.ogImageUrl ?? `${siteUrl}/og?title=${encodeURIComponent(entry.title)}`;

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
      facebook: await fbRes.json().catch(() => ({ error: "parse failed" })),
      linkedin: await liRes.json().catch(() => ({ error: "parse failed" })),
      instagram: await igRes.json().catch(() => ({ error: "parse failed" })),
    };
  } catch (e) {
    socialResult = { error: String(e) };
  }

  // Log published post
  const log = await redis.get<any[]>("blog:auto_posts") ?? [];
  log.unshift({ slug: entry.slug, keyword: entry.keyword, title: entry.title, publishedAt: new Date().toISOString(), social: socialResult });
  await redis.set("blog:auto_posts", log.slice(0, 100));

  return NextResponse.json({ ok: true, slug: entry.slug, blogLink, social: socialResult });
}

// DELETE — reject / discard
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pending = await redis.get<any[]>("blog:pending_posts") ?? [];
  await redis.set("blog:pending_posts", pending.filter((p) => p.id !== params.id));
  return NextResponse.json({ ok: true });
}
