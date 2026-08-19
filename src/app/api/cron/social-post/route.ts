import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

async function notifyFailure(step: string, detail: string) {
  await sendEmail({
    to: "cybercraftlimited@gmail.com",
    subject: `⚠️ Social Post FAILED — ${step}`,
    html: `<div style="font-family:sans-serif;padding:24px;"><h2 style="color:#dc2626;">Social Post Cron Failed</h2><p><strong>Step:</strong> ${step}</p><p><strong>Detail:</strong> ${detail}</p><p style="color:#6b7280;font-size:12px;">${new Date().toISOString()}</p></div>`,
  }).catch(() => {});
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
      await notifyFailure("Copy generation", err.slice(0, 300));
      return NextResponse.json({ ok: false, error: "Copy generation failed" }, { status: 500 });
    }

    const { copy, photoUrl, landscapePhotoUrl, topic, day, frame, layoutVariant } = await genRes.json();

    // Step 2: Build image URLs using new param names (ey=eyebrow, hl=headline, bd=body, ct=cta, layout, aspect, photo)
    const imageBase = `${siteUrl}/social-image`;
    const lv = String(layoutVariant ?? 1);
    const squareParams = new URLSearchParams({
      ey: copy.eyebrow ?? "", hl: copy.headline ?? "", bd: copy.body ?? "", ct: copy.cta ?? "",
      layout: lv, aspect: "square",
      ...(photoUrl ? { photo: photoUrl } : {}),
    });
    const landscapeParams = new URLSearchParams({
      ey: copy.eyebrow ?? "", hl: copy.headline ?? "", bd: copy.body ?? "", ct: copy.cta ?? "",
      layout: lv, aspect: "landscape",
      ...(landscapePhotoUrl ? { photo: landscapePhotoUrl } : photoUrl ? { photo: photoUrl } : {}),
    });

    const squareImageUrl   = `${imageBase}?${squareParams.toString()}`;
    const landscapeImageUrl = `${imageBase}?${landscapeParams.toString()}`;

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
        topic, day, frame: frame ?? "", layoutVariant,
        headline: copy.headline,
        photoUrl, squareImageUrl, landscapeImageUrl,
        postedAt: new Date().toISOString(),
        results, source: "auto",
      });
      await redis.set("social:auto_posts", log.slice(0, 50));
      console.log(`[social-cron] Posted: ${copy.headline} — IG:${igData?.ok} FB:${fbData?.ok} LI:${liData?.ok}`);
    }

    return NextResponse.json({ ok: anySuccess, headline: copy.headline, topic, day, frame, results });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
