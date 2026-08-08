import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS, scoreLead, getFlags, enrichLead } from "@/lib/outreach";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_TARGETS.length;
  const target = WEEKLY_TARGETS[week];

  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));
  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};

  const queries = INDUSTRIES[target.industry] ?? [];
  const seen = new Set<string>();
  const leads: any[] = [];

  for (const city of target.cities) {
    for (const query of queries.slice(0, 1)) {
      try {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " in " + city)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        for (const place of (searchData.results ?? []).slice(0, 10)) {
          if (seen.has(place.place_id) || contactedIds.has(place.place_id)) continue;
          seen.add(place.place_id);

          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours,reviews&key=${apiKey}`;
          const detail = ((await (await fetch(detailUrl)).json()).result) ?? {};
          const reviewTexts = (detail.reviews ?? []).map((r: any) => r.text ?? "");

          leads.push({
            id: place.place_id,
            name: detail.name ?? place.name,
            phone: detail.formatted_phone_number ?? null,
            website: detail.website ?? null,
            address: detail.formatted_address ?? place.formatted_address,
            rating: detail.rating ?? place.rating ?? null,
            reviewCount: detail.user_ratings_total ?? place.user_ratings_total ?? 0,
            industry: target.industry,
            city,
            score: scoreLead(detail, reviewTexts, weights),
            flags: getFlags(detail, reviewTexts),
            scrapedAt: new Date().toISOString(),
            messaged: false,
            converted: false,
            enriched: false,
          });
        }
      } catch { /* skip */ }
    }
  }

  // Enrich leads with websites
  await Promise.all(leads.filter(l => l.website).map(async (lead) => {
    const enriched = await enrichLead(lead.website);
    Object.assign(lead, enriched, { enriched: true });
  }));

  const newLeads = leads.filter(l => !existingIds.has(l.id));
  const merged = [...newLeads, ...existing].slice(0, 500);
  await redis.set("outreach:leads", merged);

  // Weekly email report
  const topLeads = [...newLeads].sort((a, b) => b.score - a.score).slice(0, 5);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  // Conversion stats from learning data
  const learningLog = await redis.get<any[]>("outreach:learning_log") ?? [];
  const converted = learningLog.filter((e: any) => e.converted).length;
  const totalSent = learningLog.length;
  const convRate = totalSent > 0 ? ((converted / totalSent) * 100).toFixed(1) : "N/A";

  if (newLeads.length > 0) {
    const body = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `WEEKLY LEAD REPORT — CyberCraft360`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Industry:        ${target.industry}`,
      `Cities:          ${target.cities.join(", ")}`,
      `New leads:       ${newLeads.length}`,
      `DB total:        ${merged.length}`,
      `Conversion rate: ${convRate}% (${converted}/${totalSent} messaged)`,
      ``,
      `TOP 5 LEADS THIS WEEK`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...topLeads.map((l, i) => [
        ``,
        `${i + 1}. ${l.name}`,
        `   Score:   ${l.score}`,
        `   City:    ${l.city}`,
        `   Phone:   ${l.phone ?? "—"}`,
        `   Email:   ${l.email ?? "—"}`,
        `   Owner:   ${l.ownerName ?? "—"}`,
        `   Website: ${l.website ?? "—"}`,
        `   Flags:   ${l.flags?.join(", ") ?? "—"}`,
      ].join("\n")),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `View all leads → ${siteUrl}/admin`,
    ].join("\n");

    fetch(`${siteUrl}/api/notify-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify({ subject: `Weekly Leads: ${newLeads.length} new ${target.industry} prospects`, body }),
    }).catch(() => {});
  }

  console.log(`[lead-scrape-cron] ${target.industry} | ${newLeads.length} new | week ${week}`);
  return NextResponse.json({ ok: true, industry: target.industry, new: newLeads.length, total: merged.length });
}
