import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Session = {
  id: string;
  firstSeen: string;
  lastSeen: string;
  ip: string;
  location: string;
  flag: string;
  org: string;
  timezone: string;
  pages: string[];
  events: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, referrer, utm_source, utm_medium, utm_campaign, utm_content, sessionId, event } = body;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const ua = req.headers.get("user-agent") || "";

    // Skip bots
    if (/bot|crawl|spider|slurp|facebookexternalhit|prerender/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    // ── If this is a behavior event ping (no page), just update the session ──
    if (event && sessionId && !page) {
      if (sessionId) {
        const sessions = await redis.get<Session[]>("visits:sessions") ?? [];
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx !== -1) {
          sessions[idx].events = [...new Set([...sessions[idx].events, event])];
          sessions[idx].lastSeen = new Date().toISOString();
          await redis.set("visits:sessions", sessions.slice(0, 200));
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ── Vercel edge geo headers ──
    const vercelCity    = req.headers.get("x-vercel-ip-city") ?? "";
    const vercelRegion  = req.headers.get("x-vercel-ip-country-region") ?? "";
    const vercelCountry = req.headers.get("x-vercel-ip-country") ?? "";
    const vercelTz      = req.headers.get("x-vercel-ip-timezone") ?? "";
    const vercelLat     = req.headers.get("x-vercel-ip-latitude") ?? "";
    const vercelLon     = req.headers.get("x-vercel-ip-longitude") ?? "";
    const vercelFlag    = req.headers.get("x-vercel-ip-flag") ?? "";

    let geo: { city?: string; region?: string; country?: string; isp?: string; org?: string; proxy?: boolean; hosting?: boolean } = {
      city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
      region: vercelRegion || undefined,
      country: vercelCountry || undefined,
    };

    // Always fetch org/ISP from ip-api.com (non-blocking, used for company identification)
    // Falls back gracefully — Vercel geo handles location accuracy
    let orgName = "";
    if (ip && ip !== "unknown" && ip !== "127.0.0.1" && !ip.startsWith("192.168")) {
      try {
        const fields = vercelCountry
          ? "isp,org,status"
          : "city,regionName,country,isp,org,proxy,hosting,status";
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`, {
          signal: AbortSignal.timeout(2000),
        });
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          orgName = geoData.org || geoData.isp || "";
          // Strip ASN prefix: "AS1234 Comcast" → "Comcast"
          orgName = orgName.replace(/^AS\d+\s+/i, "").trim();
          if (!vercelCountry) {
            geo = {
              city: geoData.city,
              region: geoData.regionName,
              country: geoData.country,
              isp: geoData.isp,
              org: geoData.org,
              proxy: geoData.proxy,
              hosting: geoData.hosting,
            };
          }
        }
      } catch { /* non-blocking */ }
    }

    const location = [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown location";
    const isp = geo.isp || orgName || "";
    const isVpn = geo.proxy === true;
    const isDatacenter = geo.hosting === true;

    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const visit = {
      ip,
      location,
      isp,
      org: orgName,
      isVpn,
      isDatacenter,
      flag: vercelFlag,
      timezone: vercelTz,
      lat: vercelLat,
      lon: vercelLon,
      page: page || "/",
      referrer: referrer || "",
      ua: ua.slice(0, 120),
      time: now.toISOString(),
      utm_source: utm_source || "",
      utm_medium: utm_medium || "",
      utm_campaign: utm_campaign || "",
      utm_content: utm_content || "",
      sessionId: sessionId || "",
    };

    // ── Session tracking ──
    if (sessionId) {
      const sessions = await redis.get<Session[]>("visits:sessions") ?? [];
      const idx = sessions.findIndex(s => s.id === sessionId);
      if (idx !== -1) {
        // Update existing session
        const s = sessions[idx];
        if (!s.pages.includes(page || "/")) s.pages.push(page || "/");
        s.lastSeen = now.toISOString();
        if (orgName && !s.org) s.org = orgName;
        await redis.set("visits:sessions", sessions.slice(0, 200));
      } else {
        // New session
        const newSession: Session = {
          id: sessionId,
          firstSeen: now.toISOString(),
          lastSeen: now.toISOString(),
          ip,
          location,
          flag: vercelFlag,
          org: orgName,
          timezone: vercelTz,
          pages: [page || "/"],
          events: [],
        };
        sessions.unshift(newSession);
        await redis.set("visits:sessions", sessions.slice(0, 200));
      }
    }

    // ── Classify traffic source ──
    const SEARCH_ENGINES = ["google", "bing", "yahoo", "duckduckgo", "baidu", "yandex", "ecosia"];
    const referrerHost = referrer ? new URL(referrer.startsWith("http") ? referrer : "https://" + referrer).hostname.replace("www.", "") : "";
    const isSearchOrganic = !utm_source && SEARCH_ENGINES.some(e => referrerHost.includes(e));
    const isDirect = !utm_source && !referrer;
    const isReferral = !utm_source && !!referrer && !isSearchOrganic;
    const trafficSource = utm_source || (isSearchOrganic ? "organic" : isDirect ? "direct" : "referral");

    // ── Skip datacenter/bot traffic from all counters ──
    if (isDatacenter) {
      return NextResponse.json({ ok: true });
    }

    // ── Save to recent visits list (keep last 200) ──
    const existing = await redis.get<typeof visit[]>("visits:recent") ?? [];
    existing.unshift({ ...visit, trafficSource, isOrganic: isSearchOrganic });
    await redis.set("visits:recent", existing.slice(0, 200));

    // ── Count unique visitors by session (not page views) ──
    const isNewSession = sessionId && !existing.slice(1).some((v: any) => v.sessionId === sessionId);
    if (isNewSession || !sessionId) {
      // Unique visitor counters
      await redis.hincrby("visitors:daily", dateKey, 1);
      if (isSearchOrganic) await redis.hincrby("visitors:organic:daily", dateKey, 1);
      if (isDirect) await redis.hincrby("visitors:direct:daily", dateKey, 1);
      if (isReferral) await redis.hincrby("visitors:referral:daily", dateKey, 1);
      if (utm_source) await redis.hincrby("visitors:paid:daily", dateKey, 1);
    }

    // ── Always count page views (separate from unique visitors) ──
    await redis.hincrby("visits:daily", dateKey, 1);

    // Track UTM source stats
    if (utm_source) {
      await redis.hincrby("traffic:sources", utm_source, 1);
      await redis.hincrby(`traffic:campaigns`, utm_campaign || utm_source, 1);
      await redis.hincrby(`traffic:daily:${dateKey}:${utm_source}`, "visits", 1);
    }
    if (isSearchOrganic) {
      await redis.hincrby("traffic:sources", "organic_search", 1);
    }

    // Throttled email notification — max 1 per 5 minutes
    const throttleKey = "visits:last_notified";
    const lastNotified = await redis.get<string>(throttleKey);
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    if (!lastNotified || new Date(lastNotified).getTime() < fiveMinAgo) {
      await redis.set(throttleKey, now.toISOString());

      const todayCount = await redis.hget<number>("visitors:daily", dateKey) ?? 1;

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
          <td style="padding:9px 0;font-size:13px;font-weight:600;color:#a78bfa;">${vercelFlag ? vercelFlag + " " : ""}${location}${vercelTz ? ` · ${vercelTz}` : ""}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Organization</td>
          <td style="padding:9px 0;font-size:13px;color:${orgName ? "#22c55e" : "rgba(255,255,255,0.4)"};">${orgName || isp || "—"}</td>
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
