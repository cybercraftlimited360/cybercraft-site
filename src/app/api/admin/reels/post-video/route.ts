import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const FB_API = "https://graph.facebook.com/v20.0";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

async function postReelToInstagram(videoUrl: string, caption: string) {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { error: "IG_USER_ID or IG_ACCESS_TOKEN not set" };

  const containerRes = await fetch(`${FB_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "REELS", video_url: videoUrl, caption, share_to_feed: true, access_token: token }),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) return { error: container.error?.message ?? "Instagram container creation failed" };

  const containerId = container.id;
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${FB_API}/${containerId}?fields=status_code&access_token=${token}`);
    const statusData = await statusRes.json();
    if (statusData.status_code === "FINISHED") break;
    if (statusData.status_code === "ERROR") return { error: "Instagram video processing failed" };
  }

  const publishRes = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) return { error: published.error?.message ?? "Instagram publish failed" };
  return { id: published.id };
}

async function postVideoToFacebook(videoUrl: string, caption: string) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) return { error: "FB_PAGE_ID or FB_PAGE_TOKEN not set" };

  const res = await fetch(`${FB_API}/${pageId}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: videoUrl, description: caption, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message ?? "Facebook video post failed" };
  return { id: data.id };
}

async function postImageToLinkedIn(caption: string) {
  const cronSecret = process.env.CRON_SECRET;
  const res = await fetch(`${SITE_URL}/api/social/linkedin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
    body: JSON.stringify({ text: caption }),
  });
  const d = await res.json();
  return d.ok ? { id: d.id } : { error: d.error ?? "LinkedIn post failed" };
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { renderId, platforms } = await req.json().catch(() => ({}));
  if (!renderId) return NextResponse.json({ error: "renderId required" }, { status: 400 });

  const job = await redis.get<any>(`reels:shotstack:${renderId}`);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.videoUrl) return NextResponse.json({ error: "Video not ready yet" }, { status: 400 });

  const platformList: string[] = platforms ?? job.platforms ?? ["instagram", "facebook"];
  const captions = job.captions ?? {};
  const results: Record<string, any> = {};

  await Promise.all(platformList.map(async (platform: string) => {
    const caption = captions[platform] ?? captions.instagram ?? "";
    if (platform === "instagram") results.instagram = await postReelToInstagram(job.videoUrl, caption);
    else if (platform === "facebook") results.facebook = await postVideoToFacebook(job.videoUrl, caption);
    else if (platform === "linkedin") results.linkedin = await postImageToLinkedIn(caption);
  }));

  const log = await redis.get<unknown[]>("reels:auto_posts") ?? [];
  log.unshift({ renderId, videoUrl: job.videoUrl, postedAt: new Date().toISOString(), results, source: "manual" });
  await redis.set("reels:auto_posts", log.slice(0, 50));

  await redis.set(`reels:shotstack:${renderId}`, { ...job, status: "posted", results, postedAt: new Date().toISOString() }, { ex: 48 * 3600 });

  if (typeof job.campaignIndex === "number" && job.campaignIndex >= 0) {
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    if (!used.includes(job.campaignIndex)) {
      used.push(job.campaignIndex);
      await redis.set("reels:used_campaign_indexes", used);
    }
  }

  return NextResponse.json({ ok: true, results });
}
