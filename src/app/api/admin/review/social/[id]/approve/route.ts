import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-token") === process.env.ADMIN_TOKEN;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await req.json().catch(() => ({}));
  // Optional overrides from the editor
  const { copy: editedCopy, platforms: enabledPlatforms } = body as {
    copy?: Record<string, string>;
    platforms?: string[];
  };

  const pending = await redis.get<any[]>("social:pending_posts") ?? [];
  const entry = pending.find((p) => p.id === id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
  const copy = editedCopy ? { ...entry.copy, ...editedCopy } : entry.copy;
  const toPost = enabledPlatforms ?? ["instagram", "facebook", "linkedin"];

  // Rebuild image URLs with any edits applied
  const squareImageUrl = entry.squareImageUrl;
  const landscapeImageUrl = entry.landscapeImageUrl;

  const calls: Promise<Response>[] = [];
  if (toPost.includes("instagram")) {
    calls.push(fetch(`${siteUrl}/api/social/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ message: copy.instagramCaption, imageUrl: squareImageUrl, platforms: ["instagram"] }),
    }));
  }
  if (toPost.includes("facebook")) {
    calls.push(fetch(`${siteUrl}/api/social/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ message: copy.facebookCaption, imageUrl: landscapeImageUrl, platforms: ["facebook"] }),
    }));
  }
  if (toPost.includes("linkedin")) {
    calls.push(fetch(`${siteUrl}/api/social/linkedin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ text: copy.linkedinCaption, imageUrl: landscapeImageUrl }),
    }));
  }

  const responses = await Promise.all(calls);
  const results: Record<string, any> = {};
  let ri = 0;
  if (toPost.includes("instagram")) results.instagram = await responses[ri++]?.json().catch(() => ({ error: "parse failed" }));
  if (toPost.includes("facebook"))  results.facebook  = await responses[ri++]?.json().catch(() => ({ error: "parse failed" }));
  if (toPost.includes("linkedin"))  results.linkedin  = await responses[ri++]?.json().catch(() => ({ error: "parse failed" }));

  const anySuccess = Object.values(results).some((r: any) => !r?.error);

  // Remove from pending
  const updated = pending.filter((p) => p.id !== id);
  await redis.set("social:pending_posts", updated);

  // Mark campaign as used only on success
  if (anySuccess) {
    const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
    if (!used.includes(entry.campaignIndex)) {
      used.push(entry.campaignIndex);
      await redis.set("social:used_campaign_indexes", used);
    }

    const log = await redis.get<any[]>("social:auto_posts") ?? [];
    log.unshift({
      campaignIndex: entry.campaignIndex,
      campaign: entry.campaign,
      week: entry.week,
      day: entry.day,
      layout: entry.layout,
      headline: copy.imageHeadline,
      photoUrl: entry.photoUrl,
      squareImageUrl,
      landscapeImageUrl,
      postedAt: new Date().toISOString(),
      results,
      source: "approved",
    });
    await redis.set("social:auto_posts", log.slice(0, 50));
  }

  return NextResponse.json({ ok: true, results });
}

// DELETE — reject / discard
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pending = await redis.get<any[]>("social:pending_posts") ?? [];
  await redis.set("social:pending_posts", pending.filter((p) => p.id !== params.id));
  return NextResponse.json({ ok: true });
}
