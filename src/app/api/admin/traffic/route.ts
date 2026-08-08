import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function isAdmin(req: NextRequest) {
  return req.nextUrl.searchParams.get("secret") === process.env.ADMIN_SECRET ||
    req.headers.get("x-admin-token") === process.env.ADMIN_SECRET ||
    req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // All recent visits
    const visits = await redis.get<any[]>("visits:recent") ?? [];

    // Source totals (instagram, linkedin, facebook, google, direct)
    const rawSources = await redis.hgetall("traffic:sources") ?? {};
    const sources = Object.entries(rawSources).map(([source, count]) => ({
      source,
      visits: Number(count),
    })).sort((a, b) => b.visits - a.visits);

    // Campaign totals
    const rawCampaigns = await redis.hgetall("traffic:campaigns") ?? {};
    const campaigns = Object.entries(rawCampaigns).map(([campaign, count]) => ({
      campaign,
      visits: Number(count),
    })).sort((a, b) => b.visits - a.visits);

    // Daily visit totals (last 30 days) — unique visitors + page views + organic
    const [rawDaily, rawUniqueDaily, rawOrganicDaily, rawDirectDaily, rawReferralDaily] = await Promise.all([
      redis.hgetall("visits:daily"),
      redis.hgetall("visitors:daily"),
      redis.hgetall("visitors:organic:daily"),
      redis.hgetall("visitors:direct:daily"),
      redis.hgetall("visitors:referral:daily"),
    ]);
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().slice(0, 10);
    });
    const daily = last30.map(date => ({
      date,
      visits: Number(rawUniqueDaily?.[date] ?? 0),       // unique visitors
      pageViews: Number(rawDaily?.[date] ?? 0),           // raw page loads
      organic: Number(rawOrganicDaily?.[date] ?? 0),
      direct: Number(rawDirectDaily?.[date] ?? 0),
      referral: Number(rawReferralDaily?.[date] ?? 0),
    }));

    // Top pages
    const pageCounts: Record<string, number> = {};
    for (const v of visits) {
      if (v.page) pageCounts[v.page] = (pageCounts[v.page] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, visits: count }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Blog post performance
    const blogVisits = visits.filter(v => v.page?.startsWith("/blog/"));
    const blogCounts: Record<string, number> = {};
    for (const v of blogVisits) {
      blogCounts[v.page] = (blogCounts[v.page] ?? 0) + 1;
    }
    const blogPerformance = Object.entries(blogCounts)
      .map(([page, count]) => ({ page, visits: count }))
      .sort((a, b) => b.visits - a.visits);

    // UTM-tagged visits with source breakdown
    const utmVisits = visits.filter(v => v.utm_source);
    const bySource: Record<string, { visits: number; campaigns: Set<string>; pages: Record<string, number> }> = {};
    for (const v of utmVisits) {
      if (!bySource[v.utm_source]) bySource[v.utm_source] = { visits: 0, campaigns: new Set(), pages: {} };
      bySource[v.utm_source].visits++;
      if (v.utm_campaign) bySource[v.utm_source].campaigns.add(v.utm_campaign);
      if (v.page) bySource[v.utm_source].pages[v.page] = (bySource[v.utm_source].pages[v.page] ?? 0) + 1;
    }
    const socialBreakdown = Object.entries(bySource).map(([source, data]) => ({
      source,
      visits: data.visits,
      campaigns: Array.from(data.campaigns),
      topPage: Object.entries(data.pages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
    }));

    // Summary stats — unique visitors (bot-filtered, deduplicated)
    const totalVisits = daily.reduce((s, d) => s + d.visits, 0);
    const todayVisits = daily[daily.length - 1]?.visits ?? 0;
    const totalOrganic = daily.reduce((s, d) => s + d.organic, 0);
    const todayOrganic = daily[daily.length - 1]?.organic ?? 0;
    const totalDirect = daily.reduce((s, d) => s + d.direct, 0);
    const totalReferral = daily.reduce((s, d) => s + d.referral, 0);
    const socialVisits = utmVisits.length;
    const directVisits = visits.filter(v => !v.utm_source && !v.referrer).length;

    // Organic search sources from recent visits
    const SEARCH_ENGINES = ["google", "bing", "yahoo", "duckduckgo", "baidu", "yandex", "ecosia"];
    const organicVisits = visits.filter(v => {
      if (v.utm_source) return false;
      try {
        const host = new URL(v.referrer?.startsWith("http") ? v.referrer : "https://" + (v.referrer || "")).hostname.replace("www.", "");
        return SEARCH_ENGINES.some(e => host.includes(e));
      } catch { return false; }
    });
    const organicByEngine: Record<string, number> = {};
    for (const v of organicVisits) {
      try {
        const host = new URL(v.referrer?.startsWith("http") ? v.referrer : "https://" + v.referrer).hostname.replace("www.", "");
        const engine = SEARCH_ENGINES.find(e => host.includes(e)) || "other";
        organicByEngine[engine] = (organicByEngine[engine] ?? 0) + 1;
      } catch { /* skip */ }
    }

    // Recent visits for live feed (last 20, enriched)
    const recentVisits = visits.slice(0, 20).map(v => ({
      ip: v.ip,
      location: v.location,
      flag: v.flag || "",
      page: v.page || "/",
      referrer: v.referrer || "",
      utm_source: v.utm_source || "",
      time: v.time,
      isVpn: v.isVpn || false,
      isDatacenter: v.isDatacenter || false,
    }));

    // Funnel: Homepage → /book → Leads
    const homepageVisits = visits.filter(v => v.page === "/" || v.page === "").length;
    const bookVisits = visits.filter(v => v.page === "/book").length;
    const leads = await redis.get<any[]>("leads:all") ?? [];
    const leadCount = leads.length;
    const funnel = [
      { stage: "Homepage", count: homepageVisits, color: "#00d4ff" },
      { stage: "Book a Call", count: bookVisits, color: "#a78bfa" },
      { stage: "Leads Generated", count: leadCount, color: "#22c55e" },
    ];

    // Sessions (journey + behavior events)
    const sessions = await redis.get<any[]>("visits:sessions") ?? [];

    return NextResponse.json({
      summary: { totalVisits, todayVisits, socialVisits, directVisits, totalOrganic, todayOrganic, totalDirect, totalReferral },
      organicByEngine,
      sources,
      campaigns,
      daily,
      topPages,
      blogPerformance,
      socialBreakdown,
      recentUtm: utmVisits.slice(0, 20),
      recentVisits,
      funnel,
      sessions: sessions.slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
