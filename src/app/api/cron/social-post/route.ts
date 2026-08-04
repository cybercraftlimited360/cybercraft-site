import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Rotate through 4 premium layouts
function pickLayout(themeIndex: number): number {
  return (themeIndex % 4) + 1;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  try {
    // Track theme rotation in Redis
    const usedIndexes = await redis.get<number[]>("social:used_theme_indexes") ?? [];
    const TOTAL_THEMES = 20;
    const available = Array.from({ length: TOTAL_THEMES }, (_, i) => i).filter(i => !usedIndexes.includes(i));
    const pool = available.length > 0 ? available : Array.from({ length: TOTAL_THEMES }, (_, i) => i);
    const themeIndex = pool[Math.floor(Math.random() * pool.length)];

    // Step 1: Generate copy + fetch Pexels photo
    const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ themeIndex }),
    });

    if (!genRes.ok) {
      return NextResponse.json({ ok: false, error: "Copy generation failed" }, { status: 500 });
    }

    const { copy, photoUrl, theme } = await genRes.json();

    // Step 2: Build social image URLs
    // Both square (Instagram) and landscape (Facebook/LinkedIn)
    const imageBase = `${siteUrl}/social-image`;
    const layout = pickLayout(themeIndex);

    const imageParams = new URLSearchParams({
      hl: copy.imageHeadline,
      sl: copy.imageSubline,
      bd: copy.imageBody,
      layout: String(layout),
      ...(photoUrl ? { photo: photoUrl } : {}),
    });

    const squareImageUrl = `${imageBase}?${imageParams.toString()}&aspect=square`;
    const landscapeImageUrl = `${imageBase}?${imageParams.toString()}&aspect=landscape`;

    // Step 3: Post to all 3 platforms simultaneously
    const [igRes, fbRes, liRes] = await Promise.all([
      // Instagram — square image, punchy caption
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          message: copy.instagramCaption,
          imageUrl: squareImageUrl,
          platforms: ["instagram"],
        }),
      }),

      // Facebook — landscape image, conversational caption
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          message: copy.facebookCaption,
          imageUrl: landscapeImageUrl,
          platforms: ["facebook"],
        }),
      }),

      // LinkedIn — landscape image, professional caption
      fetch(`${siteUrl}/api/social/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          text: copy.linkedinCaption,
          imageUrl: landscapeImageUrl,
        }),
      }),
    ]);

    const results = {
      instagram: await igRes.json().catch(() => ({ error: "parse failed" })),
      facebook: await fbRes.json().catch(() => ({ error: "parse failed" })),
      linkedin: await liRes.json().catch(() => ({ error: "parse failed" })),
    };

    // Step 4: Mark theme as used
    usedIndexes.push(themeIndex);
    await redis.set("social:used_theme_indexes", usedIndexes);

    // Step 5: Log it
    const log = await redis.get<unknown[]>("social:auto_posts") ?? [];
    log.unshift({
      themeIndex,
      theme,
      layout,
      headline: copy.imageHeadline,
      photoUrl,
      squareImageUrl,
      landscapeImageUrl,
      postedAt: new Date().toISOString(),
      results,
    });
    await redis.set("social:auto_posts", log.slice(0, 50));

    console.log(`[social-cron] Posted: ${copy.imageHeadline}`);
    return NextResponse.json({
      ok: true,
      headline: copy.imageHeadline,
      layout,
      photoUrl,
      squareImageUrl,
      landscapeImageUrl,
      results,
    });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
