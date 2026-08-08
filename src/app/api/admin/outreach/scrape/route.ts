import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

const INDUSTRIES: Record<string, string[]> = {
  "HVAC": ["HVAC contractor", "heating and cooling company", "air conditioning repair"],
  "Dental": ["dental office", "dentist", "dental clinic"],
  "Real Estate": ["real estate agent", "real estate broker", "realtor"],
  "Plumbing": ["plumber", "plumbing company", "plumbing service"],
  "Roofing": ["roofing company", "roofer", "roof repair"],
  "Auto Repair": ["auto repair shop", "mechanic", "car repair"],
  "Cleaning": ["cleaning company", "cleaning service", "janitorial service"],
};

// Score a lead: higher = better prospect (more likely missing calls / underserved)
function scoreLead(place: any): number {
  let score = 0;
  const reviews = place.user_ratings_total ?? 0;
  const rating = place.rating ?? 0;
  // Low review count = small business, likely no receptionist
  if (reviews < 20) score += 30;
  else if (reviews < 50) score += 20;
  else if (reviews < 100) score += 10;
  // Rating 3.5–4.2: good enough to be real, bad enough they may have service issues
  if (rating >= 3.5 && rating <= 4.2) score += 15;
  // Has phone = contactable
  if (place.formatted_phone_number) score += 10;
  // Has website = professional but not enterprise
  if (place.website) score += 5;
  return score;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const { industry, cities } = await req.json() as { industry: string; cities: string[] };
  const queries = INDUSTRIES[industry];
  if (!queries) return NextResponse.json({ error: "Unknown industry" }, { status: 400 });

  const seen = new Set<string>();
  const leads: any[] = [];

  for (const city of cities.slice(0, 5)) {
    for (const query of queries.slice(0, 1)) {
      try {
        // Text search
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " in " + city)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        const places = searchData.results ?? [];

        for (const place of places.slice(0, 10)) {
          if (seen.has(place.place_id)) continue;
          seen.add(place.place_id);

          // Get details (phone, website)
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours&key=${apiKey}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          const detail = detailData.result ?? {};

          const lead = {
            id: place.place_id,
            name: detail.name ?? place.name,
            phone: detail.formatted_phone_number ?? null,
            website: detail.website ?? null,
            address: detail.formatted_address ?? place.formatted_address,
            rating: detail.rating ?? place.rating ?? null,
            reviewCount: detail.user_ratings_total ?? place.user_ratings_total ?? 0,
            industry,
            city,
            score: scoreLead({ ...place, ...detail }),
            scrapedAt: new Date().toISOString(),
            messaged: false,
          };

          leads.push(lead);
        }
      } catch {
        // skip failed city/query combo
      }
    }
  }

  // Merge with existing leads in Redis
  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const newLeads = leads.filter(l => !existingIds.has(l.id));
  const merged = [...newLeads, ...existing].slice(0, 500);
  await redis.set("outreach:leads", merged);

  return NextResponse.json({ ok: true, found: leads.length, new: newLeads.length, total: merged.length });
}
