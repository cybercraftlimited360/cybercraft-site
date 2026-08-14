import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function pickLayout(campaignIndex: number): number {
  return (campaignIndex % 4) + 1;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  const secret = process.env.CRON_SECRET;
  if (auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  try {
    // Guard: skip if already posted today (bypass with ?force=true)
    const force = req.nextUrl?.searchParams?.get("force") === "true";
    const today = new Date().toISOString().slice(0, 10);
    if (!force) {
      const recentLog = await redis.get<any[]>("social:auto_posts") ?? [];
      const alreadyPostedToday = recentLog.some(
        (p: any) => p.postedAt && p.postedAt.startsWith(today) && p.source !== "manual"
      );
      if (alreadyPostedToday) {
        return NextResponse.json({ ok: false, skipped: true, reason: "Already posted today", date: today });
      }
    }

    // Step 1: Generate copy + fetch Pexels photo
    const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({}),
    });

    if (!genRes.ok) {
      const err = await genRes.text();
      console.error("[social-cron] Generate failed:", err);
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

    const squareImageUrl  = `${imageBase}?${imageParams.toString()}&aspect=square`;
    const landscapeImageUrl = `${imageBase}?${imageParams.toString()}&aspect=landscape`;

    // Step 3: Post to all platforms directly
    const cronHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` };

    const [igRes, fbRes, liRes] = await Promise.all([
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ message: copy.instagramCaption, imageUrl: squareImageUrl, platforms: ["instagram"] }),
      }),
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ message: copy.facebookCaption, imageUrl: landscapeImageUrl, platforms: ["facebook"] }),
      }),
      fetch(`${siteUrl}/api/social/linkedin`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ text: copy.linkedinCaption, imageUrl: landscapeImageUrl }),
      }),
    ]);

    const [igData, fbData, liData] = await Promise.all([
      igRes.json().catch(() => ({ error: "parse failed" })),
      fbRes.json().catch(() => ({ error: "parse failed" })),
      liRes.json().catch(() => ({ error: "parse failed" })),
    ]);

    const results = { instagram: igData, facebook: fbData, linkedin: liData };
    const anySuccess = [igData, fbData, liData].some((r: any) => !r?.error && (r?.ok || r?.results));

    // Step 4: Mark campaign as used and log (only on at least partial success)
    if (anySuccess) {
      const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
      if (!used.includes(campaignIndex)) {
        used.push(campaignIndex);
        await redis.set("social:used_campaign_indexes", used);
      }
    }

    if (anySuccess) {
      const log = await redis.get<any[]>("social:auto_posts") ?? [];
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
        source: "auto",
      });
      await redis.set("social:auto_posts", log.slice(0, 50));
      console.log(`[social-cron] Posted: ${copy.imageHeadline} — IG:${igData?.ok} FB:${fbData?.ok} LI:${liData?.ok}`);
    }

    return NextResponse.json({ ok: anySuccess, headline: copy.imageHeadline, campaign, week, day, results });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
