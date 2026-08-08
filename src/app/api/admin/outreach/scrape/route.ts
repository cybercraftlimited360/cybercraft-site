import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export const INDUSTRIES: Record<string, string[]> = {
  "HVAC": ["HVAC contractor", "heating and cooling company", "air conditioning repair"],
  "Dental": ["dental office", "dentist", "dental clinic"],
  "Real Estate": ["real estate agent", "real estate broker", "realtor"],
  "Plumbing": ["plumber", "plumbing company", "plumbing service"],
  "Roofing": ["roofing company", "roofer", "roof repair"],
  "Auto Repair": ["auto repair shop", "mechanic", "car repair"],
  "Cleaning": ["cleaning company", "cleaning service", "janitorial service"],
};

// Weekly rotation: industry + city sets so auto-cron covers different markets each week
export const WEEKLY_TARGETS = [
  { industry: "HVAC",        cities: ["Chicago, IL", "Phoenix, AZ", "Dallas, TX", "Atlanta, GA", "Denver, CO"] },
  { industry: "Dental",      cities: ["Los Angeles, CA", "Houston, TX", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA"] },
  { industry: "Real Estate", cities: ["New York, NY", "Miami, FL", "Las Vegas, NV", "Austin, TX", "Seattle, WA"] },
  { industry: "Plumbing",    cities: ["Chicago, IL", "Columbus, OH", "Charlotte, NC", "Indianapolis, IN", "Nashville, TN"] },
  { industry: "Roofing",     cities: ["Dallas, TX", "Houston, TX", "Atlanta, GA", "Tampa, FL", "Orlando, FL"] },
  { industry: "Auto Repair", cities: ["Los Angeles, CA", "Detroit, MI", "San Jose, CA", "Memphis, TN", "Louisville, KY"] },
  { industry: "Cleaning",    cities: ["New York, NY", "Boston, MA", "Washington, DC", "Portland, OR", "Denver, CO"] },
];

// Smart lead scoring
function scoreLead(detail: any, reviews: string[]): number {
  let score = 0;
  const reviewCount = detail.user_ratings_total ?? 0;
  const rating = detail.rating ?? 0;
  const hours = detail.opening_hours;

  // Low review count = small business, likely no receptionist
  if (reviewCount < 20) score += 30;
  else if (reviewCount < 50) score += 25;
  else if (reviewCount < 100) score += 15;
  else if (reviewCount < 200) score += 5;

  // Sweet spot rating: established but not perfect
  if (rating >= 3.5 && rating <= 4.2) score += 15;
  else if (rating > 4.2 && rating < 4.6) score += 8;

  // No website = behind on tech, more likely to buy
  if (!detail.website) score += 20;
  else score += 5; // has website but not enterprise

  // Open 24/7 = trying to capture all hours, great AI fit
  if (hours?.periods?.some((p: any) => p.open?.time === "0000" && !p.close)) score += 20;

  // Has phone = contactable
  if (detail.formatted_phone_number) score += 10;

  // Review text signals: mentions of slow response, missed calls, busy
  const painSignals = ["busy", "no answer", "didn't call back", "hard to reach", "voicemail", "waited", "slow response", "took forever"];
  const reviewText = reviews.join(" ").toLowerCase();
  const signalMatches = painSignals.filter(s => reviewText.includes(s)).length;
  score += signalMatches * 8;

  return score;
}

// Pull flags for the lead card
function getFlags(detail: any, reviews: string[]): string[] {
  const flags: string[] = [];
  if (!detail.website) flags.push("No website");
  const hours = detail.opening_hours;
  if (hours?.periods?.some((p: any) => p.open?.time === "0000" && !p.close)) flags.push("Open 24/7");
  const reviewText = reviews.join(" ").toLowerCase();
  if (["busy","no answer","voicemail","didn't call back"].some(s => reviewText.includes(s))) flags.push("Missed call signals");
  if ((detail.user_ratings_total ?? 0) < 20) flags.push("Very few reviews");
  return flags;
}

// Enrich: scrape website for owner name + email, find social pages
async function enrichLead(lead: any): Promise<Partial<any>> {
  const enriched: any = {};
  if (!lead.website) return enriched;

  try {
    const url = lead.website.startsWith("http") ? lead.website : `https://${lead.website}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } });
    clearTimeout(timeout);
    const html = await res.text();

    // Extract email
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].includes("@example") && !emailMatch[0].includes("@sentry")) {
      enriched.email = emailMatch[0].toLowerCase();
    }

    // Extract owner/contact name from common patterns
    const ownerPatterns = [
      /(?:owner|founder|president|ceo|principal)[:\s,]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /(?:meet|about)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];
    for (const pattern of ownerPatterns) {
      const m = html.match(pattern);
      if (m) { enriched.ownerName = m[1]; break; }
    }

    // Find Facebook page
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9._\-/]+/);
    if (fbMatch) enriched.facebookUrl = fbMatch[0].split('"')[0].split("'")[0];

    // Find LinkedIn page
    const liMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9._\-/]+/);
    if (liMatch) enriched.linkedinUrl = liMatch[0].split('"')[0].split("'")[0];

  } catch {
    // enrichment failed silently
  }

  return enriched;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const { industry, cities } = await req.json() as { industry: string; cities: string[] };
  const queries = INDUSTRIES[industry];
  if (!queries) return NextResponse.json({ error: "Unknown industry" }, { status: 400 });

  // Load existing leads to check duplicates (including previously contacted)
  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));

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
          if (seen.has(place.place_id)) continue;
          seen.add(place.place_id);

          // Skip previously contacted leads
          if (contactedIds.has(place.place_id)) continue;

          // Get details + reviews
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours,reviews&key=${apiKey}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          const detail = detailData.result ?? {};
          const reviewTexts = (detail.reviews ?? []).map((r: any) => r.text ?? "");

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
            score: scoreLead(detail, reviewTexts),
            flags: getFlags(detail, reviewTexts),
            scrapedAt: new Date().toISOString(),
            messaged: false,
            enriched: false,
          };

          leads.push(lead);
        }
      } catch {
        // skip failed city/query
      }
    }
  }

  // Enrich new leads (website scrape for email/owner/social)
  const toEnrich = leads.filter(l => l.website).slice(0, 20);
  await Promise.all(toEnrich.map(async (lead) => {
    const enriched = await enrichLead(lead);
    Object.assign(lead, enriched, { enriched: true });
  }));

  const newLeads = leads.filter(l => !existingIds.has(l.id));
  const merged = [...newLeads, ...existing].slice(0, 500);
  await redis.set("outreach:leads", merged);

  return NextResponse.json({ ok: true, found: leads.length, new: newLeads.length, total: merged.length });
}
