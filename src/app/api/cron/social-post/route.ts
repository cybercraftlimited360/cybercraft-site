import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

export const maxDuration = 300; // 5 minutes — covers DALL-E + Pexels + Instagram polling

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
    // Newlines in hl cause %0A in the URL which Meta's crawler rejects
    const safeHl = (copy.headline ?? "").replace(/\n/g, " ");
    // Instagram square: omit bd (body) to keep URL short — Meta's crawler rejects long URLs
    const squareParams = new URLSearchParams({
      ey: copy.eyebrow ?? "", hl: safeHl, ct: copy.cta ?? "",
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

    // Pre-render images and cache in Redis so Meta's crawler gets instant response
    // (the dynamic social-image route takes 3-8s; Meta's crawler times out)
    async function renderAndCache(url: string): Promise<string> {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
        if (!res.ok) return url;
        const buf = await res.arrayBuffer();
        if (buf.byteLength === 0) return url;
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
        await redis.set(`img:${id}`, b64, { ex: 86400 });
        return `${siteUrl}/api/img/${id}`;
      } catch {
        return url;
      }
    }

    const [squareFinalUrl, landscapeFinalUrl] = await Promise.all([
      renderAndCache(squareImageUrl),
      renderAndCache(landscapeImageUrl),
    ]);

    // Step 4: Post to all platforms directly
    const cronHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` };

    const [igRes, fbRes, liRes] = await Promise.all([
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ message: copy.instagramCaption, imageUrl: squareFinalUrl, platforms: ["instagram"] }),
      }),
      fetch(`${siteUrl}/api/social/post`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ message: copy.facebookCaption, imageUrl: landscapeFinalUrl, platforms: ["facebook"] }),
      }),
      fetch(`${siteUrl}/api/social/linkedin`, {
        method: "POST", headers: cronHeaders,
        body: JSON.stringify({ text: copy.linkedinCaption, imageUrl: landscapeFinalUrl }),
      }),
    ]);

    const [igData, fbData, liData] = await Promise.all([
      igRes.json().catch(() => ({ error: "parse failed" })),
      fbRes.json().catch(() => ({ error: "parse failed" })),
      liRes.json().catch(() => ({ error: "parse failed" })),
    ]);

    const results = { instagram: igData, facebook: fbData, linkedin: liData };
    const anySuccess = [igData, fbData, liData].some((r: any) => !r?.error && (r?.ok || r?.results));


    if (anySuccess) {
      const log = await redis.get<any[]>("social:auto_posts") ?? [];
      log.unshift({
        topic, day, frame: frame ?? "", layoutVariant,
        headline: copy.headline,
        photoUrl, squareImageUrl: squareFinalUrl, landscapeImageUrl: landscapeFinalUrl,
        postedAt: new Date().toISOString(),
        results, source: "auto",
      });
      await redis.set("social:auto_posts", log.slice(0, 50));
      console.log(`[social-cron] Posted: ${copy.headline} — IG:${igData?.ok} FB:${fbData?.ok} LI:${liData?.ok}`);

      const platformLines = [
        `<tr><td style="padding:8px 12px;font-weight:600;">Instagram</td><td style="padding:8px 12px;color:${igData?.ok ? "#16a34a" : "#dc2626"};">${igData?.ok ? "✅ Posted" : `❌ ${igData?.error ?? "Failed"}`}</td></tr>`,
        `<tr><td style="padding:8px 12px;font-weight:600;">Facebook</td><td style="padding:8px 12px;color:${fbData?.ok ? "#16a34a" : "#dc2626"};">${fbData?.ok ? "✅ Posted" : `❌ ${fbData?.error ?? "Failed"}`}</td></tr>`,
        `<tr><td style="padding:8px 12px;font-weight:600;">LinkedIn</td><td style="padding:8px 12px;color:${liData?.ok ? "#16a34a" : "#dc2626"};">${liData?.ok ? "✅ Posted" : `❌ ${liData?.error ?? "Failed"}`}</td></tr>`,
      ].join("");
      await sendEmail({
        to: "cybercraftlimited@gmail.com",
        subject: `✅ Social Post Live — ${copy.headline.replace(/\n/g, " ")}`,
        html: `<div style="font-family:sans-serif;padding:24px;max-width:600px;">
          <h2 style="color:#111;">Social Post Published</h2>
          <p><strong>Topic:</strong> ${topic}</p>
          <p><strong>Headline:</strong> ${copy.headline.replace(/\n/g, " ")}</p>
          <table style="border-collapse:collapse;width:100%;margin-top:16px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;">Platform</th><th style="padding:8px 12px;text-align:left;">Result</th></tr></thead>
            <tbody>${platformLines}</tbody>
          </table>
          <p style="color:#6b7280;font-size:12px;margin-top:16px;">${new Date().toISOString()}</p>
        </div>`,
      }).catch(() => {});
    } else {
      await notifyFailure("All platforms", `IG: ${igData?.error ?? "ok"} | FB: ${fbData?.error ?? "ok"} | LI: ${liData?.error ?? "ok"}`);
    }

    return NextResponse.json({ ok: anySuccess, headline: copy.headline, topic, day, frame, results, debug: { photoUrl, squareFinalUrl: squareFinalUrl.slice(0, 200), landscapeFinalUrl: landscapeFinalUrl.slice(0, 200) } });

  } catch (err) {
    console.error("[social-cron] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
