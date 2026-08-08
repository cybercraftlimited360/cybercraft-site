import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS, scoreLead, getFlags, enrichLead } from "@/lib/outreach";

export { INDUSTRIES, WEEKLY_TARGETS };

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const { industry, cities } = await req.json() as { industry: string; cities: string[] };
  const queries = INDUSTRIES[industry];
  if (!queries) return NextResponse.json({ error: "Unknown industry" }, { status: 400 });

  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));

  // Load learned score weights
  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};

  const seen = new Set<string>();
  const leads: any[] = [];

  for (const city of cities.slice(0, 5)) {
    for (const query of queries.slice(0, 2)) {
      try {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " in " + city)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const places = searchData.results ?? [];

        for (const place of places.slice(0, 10)) {
          if (seen.has(place.place_id) || contactedIds.has(place.place_id)) continue;
          seen.add(place.place_id);

          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours,reviews&key=${apiKey}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          const detail = detailData.result ?? {};
          const reviewTexts = (detail.reviews ?? []).map((r: any) => r.text ?? "");

          leads.push({
            id: place.place_id,
            name: detail.name ?? place.name,
            phone: detail.formatted_phone_number ?? null,
            website: detail.website ?? null,
            address: detail.formatted_address ?? place.formatted_address,
            rating: detail.rating ?? place.rating ?? null,
            reviewCount: detail.user_ratings_total ?? place.user_ratings_total ?? 0,
            industry,
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

  // Enrich ALL new leads with websites (not just 20)
  const toEnrich = leads.filter(l => l.website && !existingIds.has(l.id));
  await Promise.all(toEnrich.map(async (lead) => {
    const enriched = await enrichLead(lead.website);
    Object.assign(lead, enriched, { enriched: true });
  }));

  const newLeads = leads.filter(l => !existingIds.has(l.id));
  const merged = [...newLeads, ...existing].slice(0, 500);
  await redis.set("outreach:leads", merged);

  return NextResponse.json({ ok: true, found: leads.length, new: newLeads.length, total: merged.length });
}
