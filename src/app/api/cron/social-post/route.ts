import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function pickLayout(campaignIndex: number): number {
  return (campaignIndex % 4) + 1;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  try {
    // Guard: skip if already posted today (prevents double-posts from manual triggers)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
    const recentLog = await redis.get<any[]>("social:auto_posts") ?? [];
    const alreadyPostedToday = recentLog.some(
      (p: any) => p.postedAt && p.postedAt.startsWith(today) && p.source !== "manual"
    );
    if (alreadyPostedToday) {
      return NextResponse.json({ ok: false, skipped: true, reason: "Already posted today", date: today });
    }

    // Step 1: Generate copy + fetch Pexels photo (campaign index tracked inside generate-post)
    const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({}),
    });

    if (!genRes.ok) {
      return NextResponse.json({ ok: false, error: "Copy generation failed" }, { status: 500 });
    }

    const { copy, photoUrl, campaign, week, day, campaignIndex } = await genRes.json();
    const layout = pickLayout(campaignIndex ?? 0);

    // Step 2: Build image URLs
    const imageBase = `${siteUrl}/social-image`;
    const imageParams = new URLSearchParams({
      hl: copy.imageHeadline,
      sl: copy.imageSubline,
      bd: copy.imageBody,
      layout: String(layout),
      ...(photoUrl ? { photo: photoUrl } : {}),
    });

    const squareImageUrl = `${imageBase}?${imageParams.toString()}&aspect=square`;
    const landscapeImageUrl = `${imageBase}?${imageParams.toString()}&aspect=landscape`;

    // Step 3: Save to review queue instead of posting directly
    const pending = await redis.get<any[]>("social:pending_posts") ?? [];
    const entry = {
      id: `sp_${Date.now()}`,
      campaignIndex,
      campaign,
      week,
      day,
      layout,
      copy,
      photoUrl,
      squareImageUrl,
      landscapeImageUrl,
      generatedAt: new Date().toISOString(),
      status: "pending",
    };
    pending.unshift(entry);
    await redis.set("social:pending_posts", pending.slice(0, 20));

    console.log(`[social-cron] Queued for review: ${copy.imageHeadline}`);
    return NextResponse.json({ ok: true, queued: true, id: entry.id, headline: copy.imageHeadline, campaign, week, day, layout, squareImageUrl, landscapeImageUrl });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
