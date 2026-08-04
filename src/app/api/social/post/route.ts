import { NextRequest, NextResponse } from "next/server";

const FB_API = "https://graph.facebook.com/v20.0";

async function postToFacebook(message: string, link?: string): Promise<{ id?: string; error?: string }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) return { error: "FB_PAGE_ID or FB_PAGE_TOKEN not set" };

  const body: Record<string, string> = { message, access_token: token };
  if (link) body.link = link;

  const res = await fetch(`${FB_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message ?? "Facebook post failed" };
  return { id: data.id };
}

async function postToInstagram(imageUrl: string, caption: string): Promise<{ id?: string; error?: string }> {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { error: "IG_USER_ID or IG_ACCESS_TOKEN not set" };

  // Step 1: Create media container
  const containerRes = await fetch(`${FB_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) {
    return { error: container.error?.message ?? "Instagram container creation failed" };
  }

  // Step 2: Publish
  const publishRes = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) return { error: published.error?.message ?? "Instagram publish failed" };
  return { id: published.id };
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, link, imageUrl, platforms } = await req.json();
  const results: Record<string, { id?: string; error?: string }> = {};

  const targets: string[] = platforms ?? ["facebook", "instagram"];

  if (targets.includes("facebook")) {
    results.facebook = await postToFacebook(message, link);
  }

  if (targets.includes("instagram") && imageUrl) {
    results.instagram = await postToInstagram(imageUrl, message);
  } else if (targets.includes("instagram") && !imageUrl) {
    results.instagram = { error: "imageUrl required for Instagram" };
  }

  const anyError = Object.values(results).some((r) => r.error);
  return NextResponse.json({ ok: !anyError, results }, { status: anyError ? 207 : 200 });
}
