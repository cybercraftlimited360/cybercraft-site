import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(secret: string) {
  return Buffer.from(`cc360:${secret}:v2`).toString("base64");
}
function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;
  return token === makeToken(secret);
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const previewData = body.previewData;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  // If preview data passed, post it directly (user already approved it)
  if (previewData?.copy && previewData?.squareImageUrl && previewData?.landscapeImageUrl) {
    const { copy, squareImageUrl, landscapeImageUrl, campaignIndex } = previewData;

    const [igRes, fbRes, liRes] = await Promise.all([
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({ message: copy.instagramCaption, imageUrl: squareImageUrl, platforms: ["instagram"] }),
      }),
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({ message: copy.facebookCaption, imageUrl: landscapeImageUrl, platforms: ["facebook"] }),
      }),
      fetch(`${siteUrl}/api/social/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({ text: copy.linkedinCaption, imageUrl: landscapeImageUrl }),
      }),
    ]);

    const results = {
      instagram: await igRes.json().catch(() => ({ error: "parse failed" })),
      facebook: await fbRes.json().catch(() => ({ error: "parse failed" })),
      linkedin: await liRes.json().catch(() => ({ error: "parse failed" })),
    };

    // Log to Redis
    const log = await redis.get<unknown[]>("social:auto_posts") ?? [];
    log.unshift({
      headline: copy.imageHeadline,
      squareImageUrl,
      landscapeImageUrl,
      postedAt: new Date().toISOString(),
      results,
      source: "manual",
    });
    await redis.set("social:auto_posts", log.slice(0, 50));

    // Mark campaign as used
    if (typeof campaignIndex === "number") {
      const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
      if (!used.includes(campaignIndex)) {
        used.push(campaignIndex);
        await redis.set("social:used_campaign_indexes", used);
      }
    }

    return NextResponse.json({ ok: true, headline: copy.imageHeadline, results });
  }

  // Fallback: trigger the cron directly (no preview data)
  const res = await fetch(`${siteUrl}/api/cron/social-post`, {
    method: "GET",
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
