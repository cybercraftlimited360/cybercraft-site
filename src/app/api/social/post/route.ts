import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const FB_API = "https://graph.facebook.com/v20.0";

async function postToFacebook(message: string, imageUrl?: string, link?: string): Promise<{ id?: string; error?: string; debug?: unknown }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) return { error: "FB_PAGE_ID or FB_PAGE_TOKEN not set" };

  if (imageUrl) {
    // Post with image — use form-urlencoded (most reliable for Graph API /photos)
    const params = new URLSearchParams({
      caption: link ? `${message}\n\n${link}` : message,
      url: imageUrl,
      access_token: token,
    });
    const res = await fetch(`${FB_API}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error?.message ?? "Facebook photo post failed", debug: { status: res.status, body: data, imageUrl } };
    return { id: data.id };
  }

  // Text-only post
  const params = new URLSearchParams({ message, access_token: token });
  if (link) params.set("link", link);
  const res = await fetch(`${FB_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message ?? "Facebook post failed", debug: data };
  return { id: data.id };
}

async function postToInstagram(imageUrl: string, caption: string): Promise<{ id?: string; error?: string; debug?: unknown }> {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { error: "IG_USER_ID or IG_ACCESS_TOKEN not set" };

  const containerParams = new URLSearchParams({ image_url: imageUrl, caption, access_token: token });
  const containerRes = await fetch(`${FB_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: containerParams.toString(),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) {
    return { error: container.error?.message ?? "Instagram container creation failed", debug: { status: containerRes.status, body: container, imageUrl } };
  }

  // Poll until container status is FINISHED (Instagram needs time to download/process the image)
  let statusCode = "IN_PROGRESS";
  for (let attempt = 0; attempt < 8 && statusCode !== "FINISHED"; attempt++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`${FB_API}/${container.id}?fields=status_code&access_token=${token}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      statusCode = statusData.status_code ?? "IN_PROGRESS";
      if (statusCode === "ERROR") return { error: "Instagram container processing failed", debug: statusData };
    }
  }
  if (statusCode !== "FINISHED") {
    return { error: `Instagram container not ready after polling (status: ${statusCode})`, debug: { containerId: container.id } };
  }

  const publishParams = new URLSearchParams({ creation_id: container.id, access_token: token });
  const publishRes = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: publishParams.toString(),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) return { error: published.error?.message ?? "Instagram publish failed", debug: published };
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
    results.facebook = await postToFacebook(message, imageUrl, link);
  }

  if (targets.includes("instagram") && imageUrl) {
    results.instagram = await postToInstagram(imageUrl, message);
  } else if (targets.includes("instagram") && !imageUrl) {
    results.instagram = { error: "imageUrl required for Instagram" };
  }

  const anyError = Object.values(results).some((r) => r.error);
  return NextResponse.json({ ok: !anyError, results }, { status: anyError ? 207 : 200 });
}
