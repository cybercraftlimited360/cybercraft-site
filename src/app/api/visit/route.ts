import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { page, referrer } = await req.json();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const ua = req.headers.get("user-agent") || "";

    // Skip bots
    if (/bot|crawl|spider|slurp|facebookexternalhit|prerender/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    // IP geolocation (free, no key needed)
    let geo: { city?: string; region?: string; country?: string; isp?: string; proxy?: boolean; hosting?: boolean } = {};
    if (ip && ip !== "unknown" && ip !== "127.0.0.1" && !ip.startsWith("192.168")) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,isp,proxy,hosting,status`, { signal: AbortSignal.timeout(2000) });
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          geo = { city: geoData.city, region: geoData.regionName, country: geoData.country, isp: geoData.isp, proxy: geoData.proxy, hosting: geoData.hosting };
        }
      } catch { /* non-blocking */ }
    }

    const location = [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown location";
    const isp = geo.isp || "";
    const isVpn = geo.proxy === true;
    const isDatacenter = geo.hosting === true;

    const now = new Date();
    const visit = {
      ip,
      location,
      isp,
      isVpn,
      isDatacenter,
      page: page || "/",
      referrer: referrer || "",
      ua: ua.slice(0, 120),
      time: now.toISOString(),
    };

    // Save to Redis list (keep last 200)
    const existing = await redis.get<typeof visit[]>("visits:recent") ?? [];
    existing.unshift(visit);
    await redis.set("visits:recent", existing.slice(0, 200));

    // Increment daily counter
    const dateKey = now.toISOString().slice(0, 10);
    await redis.hincrby("visits:daily", dateKey, 1);

    // Throttled email notification — max 1 per 5 minutes
    const throttleKey = "visits:last_notified";
    const lastNotified = await redis.get<string>(throttleKey);
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    if (!lastNotified || new Date(lastNotified).getTime() < fiveMinAgo) {
      await redis.set(throttleKey, now.toISOString());

      // Get recent visit count for context
      const todayCount = await redis.hget<number>("visits:daily", dateKey) ?? 1;

      const { sendEmail } = await import("@/lib/mailer");
      await sendEmail({
        to: "cybercraftlimited@gmail.com",
        subject: `👀 Someone is on cybercraft360.com — ${page || "/"}`,
        html: `
<div style="background:#0a0c12;padding:32px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0f1117;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:28px 28px 24px;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 10px;">CyberCraft360 · Live Visitor</p>
      <h2 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 20px;">👀 Someone just landed on your site</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);width:90px;">Page</td>
          <td style="padding:9px 0;font-size:13px;font-weight:600;color:#00d4ff;">${page || "/"}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Location</td>
          <td style="padding:9px 0;font-size:13px;font-weight:600;color:#a78bfa;">${location}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">ISP</td>
          <td style="padding:9px 0;font-size:13px;color:rgba(255,255,255,0.6);">${isp || "—"}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">IP</td>
          <td style="padding:9px 0;font-size:13px;color:rgba(255,255,255,0.4);font-family:monospace;">${ip}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Referrer</td>
          <td style="padding:9px 0;font-size:13px;color:rgba(255,255,255,0.6);">${referrer || "Direct / unknown"}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Today</td>
          <td style="padding:9px 0;font-size:13px;font-weight:700;color:#22c55e;">${todayCount} visit${todayCount === 1 ? "" : "s"} so far</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Time</td>
          <td style="padding:9px 0;font-size:13px;color:rgba(255,255,255,0.5);">${now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" })} CT</td>
        </tr>
      </table>
      <a href="https://cybercraft360.com/admin" style="display:block;text-align:center;margin-top:20px;padding:11px 20px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">Open Dashboard →</a>
    </div>
  </div>
</div>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[visit]", err);
    return NextResponse.json({ ok: false });
  }
}
