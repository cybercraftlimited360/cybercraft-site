import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const FB_API = "https://graph.facebook.com/v20.0";

async function postToFacebook(content: string): Promise<{ id?: string; error?: string }> {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!pageId || !token) return { error: "FB env vars not set" };

  const res = await fetch(`${FB_API}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error?.message ?? "Facebook post failed" };
  return { id: data.id };
}

async function postToLinkedIn(content: string): Promise<{ id?: string; error?: string }> {
  const token = process.env.LI_ACCESS_TOKEN;
  const personId = process.env.LI_PERSON_ID;
  if (!token || !personId) return { error: "LinkedIn env vars not set" };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.message ?? "LinkedIn post failed" };
  return { id: data.id };
}

async function postToInstagram(imageUrl: string, caption: string): Promise<{ id?: string; error?: string }> {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !token) return { error: "Instagram env vars not set" };

  const containerRes = await fetch(`${FB_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) return { error: container.error?.message ?? "Container failed" };

  const publishRes = await fetch(`${FB_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok) return { error: published.error?.message ?? "Publish failed" };
  return { id: published.id };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();

  // Get all posts due now or in the past
  const raw = await redis.zrangebyscore("scheduled_posts", 0, now);
  if (!raw.length) return NextResponse.json({ ok: true, published: 0 });

  const results = [];

  for (const member of raw) {
    try {
      const post = typeof member === "string" ? JSON.parse(member as string) : member;
      if (post.status !== "pending") continue;

      const postResults: Record<string, { id?: string; error?: string }> = {};

      if (post.platforms.includes("facebook")) {
        postResults.facebook = await postToFacebook(post.content);
      }
      if (post.platforms.includes("linkedin")) {
        postResults.linkedin = await postToLinkedIn(post.content);
      }
      if (post.platforms.includes("instagram") && post.imageUrl) {
        postResults.instagram = await postToInstagram(post.imageUrl, post.content);
      }

      const anyError = Object.values(postResults).some((r) => r.error);
      const updatedPost = {
        ...post,
        status: anyError ? "failed" : "published",
        results: postResults,
        publishedAt: now,
      };

      // Remove old entry and add updated one to a published archive
      await redis.zrem("scheduled_posts", member);
      await redis.lpush("published_posts", JSON.stringify(updatedPost));

      results.push({ id: post.id, results: postResults });
    } catch (e) {
      results.push({ error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, published: results.length, results });
}
