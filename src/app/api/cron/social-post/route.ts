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

    // Step 3: Post to all platforms simultaneously
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

    // Step 4: Mark campaign as used
    const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
    if (!used.includes(campaignIndex)) {
      used.push(campaignIndex);
      await redis.set("social:used_campaign_indexes", used);
    }

    // Step 5: Log it
    const log = await redis.get<unknown[]>("social:auto_posts") ?? [];
    log.unshift({
      campaignIndex,
      campaign,
      week,
      day,
      layout,
      headline: copy.imageHeadline,
      photoUrl,
      squareImageUrl,
      landscapeImageUrl,
      postedAt: new Date().toISOString(),
      results,
    });
    await redis.set("social:auto_posts", log.slice(0, 50));

    console.log(`[social-cron] Week ${week} ${day} — ${copy.imageHeadline}`);
    return NextResponse.json({ ok: true, headline: copy.imageHeadline, campaign, week, day, layout, photoUrl, squareImageUrl, landscapeImageUrl, results });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
