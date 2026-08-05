import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const FB_API = "https://graph.facebook.com/v20.0";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

async function postReelToInstagram(videoUrl: string, caption: string): Promise<{ id?: string; error?: string }> {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { error: "IG_USER_ID or IG_ACCESS_TOKEN not set" };

  // Create container for Reel
  const containerRes = await fetch(`${FB_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: token,
    }),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) {
    return { error: container.error?.message ?? "Instagram container creation failed" };
  }

  // Poll until video is processed (up to 90s)
  const containerId = container.id;
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${FB_API}/${containerId}?fields=status_code&access_token=${token}`);
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") break;
    if (statusData.status_code === "ERROR") return { error: "Instagram video processing failed" };
  }

  // Publish
  const publishRes = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) return { error: published.error?.message ?? "Instagram publish failed" };
  return { id: published.id };
}

async function postVideoToFacebook(videoUrl: string, caption: string): Promise<{ id?: string; error?: string }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) return { error: "FB_PAGE_ID or FB_PAGE_TOKEN not set" };

  const res = await fetch(`${FB_API}/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_url: videoUrl,
      description: caption,
      access_token: token,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message ?? "Facebook video post failed" };
  return { id: data.id };
}

async function postImageToLinkedIn(caption: string, imageUrl?: string): Promise<{ id?: string; error?: string }> {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const res = await fetch(`${SITE_URL}/api/social/linkedin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
      body: JSON.stringify({ text: caption, imageUrl }),
    });
    const d = await res.json();
    return d.ok ? { id: d.id } : { error: d.error ?? "LinkedIn post failed" };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { id: renderId, status, url: videoUrl } = body;

  if (status !== "done" || !videoUrl || !renderId) {
    console.log("[shotstack-webhook] render not done or missing data:", { renderId, status });
    return NextResponse.json({ ok: true });
  }

  // Retrieve job context
  const job = await redis.get<any>(`reels:shotstack:${renderId}`);
  if (!job) {
    console.error("[shotstack-webhook] No job found for renderId:", renderId);
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }

  // Idempotency guard — if already posted or processing, skip to prevent duplicates
  if (job.status === "posted" || job.status === "processing") {
    console.log("[shotstack-webhook] Already processed, skipping:", renderId, job.status);
    return NextResponse.json({ ok: true, skipped: true, status: job.status });
  }

  // Mark as processing immediately before any async work to prevent race condition duplicates
  await redis.set(`reels:shotstack:${renderId}`, { ...job, status: "processing" }, { ex: 48 * 3600 });

  const { captions, platforms, campaignIndex, autoPost } = job;

  // Preview-only mode — just store the video URL, don't post
  if (autoPost === false) {
    await redis.set(`reels:shotstack:${renderId}`, { ...job, status: "done", videoUrl, readyAt: new Date().toISOString() }, { ex: 48 * 3600 });
    console.log("[shotstack-webhook] Preview-only render done:", renderId, videoUrl);
    return NextResponse.json({ ok: true, preview: true, videoUrl });
  }

  const platformList: string[] = platforms ?? ["instagram", "facebook"];
  const results: Record<string, any> = {};

  // Post to each platform in parallel
  await Promise.all(platformList.map(async (platform: string) => {
    const caption = captions?.[platform] ?? captions?.instagram ?? "";
    if (platform === "instagram") {
      results.instagram = await postReelToInstagram(videoUrl, caption);
    } else if (platform === "facebook") {
      results.facebook = await postVideoToFacebook(videoUrl, caption);
    } else if (platform === "linkedin") {
      results.linkedin = await postImageToLinkedIn(caption);
    }
  }));

  // Log to Redis
  const log = await redis.get<unknown[]>("reels:auto_posts") ?? [];
  log.unshift({
    renderId,
    videoUrl,
    campaignIndex,
    postedAt: new Date().toISOString(),
    results,
    source: "auto",
  });
  await redis.set("reels:auto_posts", log.slice(0, 50));

  // Update job status
  await redis.set(`reels:shotstack:${renderId}`, { ...job, status: "posted", videoUrl, results, postedAt: new Date().toISOString() }, { ex: 48 * 3600 });

  // Mark campaign used if it was a scheduled one
  if (typeof campaignIndex === "number" && campaignIndex >= 0) {
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    if (!used.includes(campaignIndex)) {
      used.push(campaignIndex);
      await redis.set("reels:used_campaign_indexes", used);
    }
  }

  console.log("[shotstack-webhook] Posted reel", renderId, "→", JSON.stringify(results));
  return NextResponse.json({ ok: true, results });
}
