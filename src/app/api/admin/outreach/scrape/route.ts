import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS, scoreLead, getFlags, enrichLead } from "@/lib/outreach";

export { INDUSTRIES, WEEKLY_TARGETS };

const USA_CITIES = [
  "New York, NY","Los Angeles, CA","Chicago, IL","Houston, TX","Phoenix, AZ",
  "Philadelphia, PA","San Antonio, TX","San Diego, CA","Dallas, TX","San Jose, CA",
  "Austin, TX","Jacksonville, FL","Fort Worth, TX","Columbus, OH","Charlotte, NC",
  "Indianapolis, IN","San Francisco, CA","Seattle, WA","Denver, CO","Nashville, TN",
  "Oklahoma City, OK","El Paso, TX","Washington, DC","Las Vegas, NV","Boston, MA",
  "Memphis, TN","Louisville, KY","Portland, OR","Baltimore, MD","Milwaukee, WI",
  "Albuquerque, NM","Tucson, AZ","Fresno, CA","Sacramento, CA","Mesa, AZ",
  "Kansas City, MO","Atlanta, GA","Omaha, NE","Colorado Springs, CO","Raleigh, NC",
  "Long Beach, CA","Virginia Beach, VA","Minneapolis, MN","Tampa, FL","New Orleans, LA",
  "Arlington, TX","Wichita, KS","Cleveland, OH","Bakersfield, CA","Aurora, CO",
  "Anaheim, CA","Santa Ana, CA","Corpus Christi, TX","Riverside, CA","St. Louis, MO",
  "Lexington, KY","Pittsburgh, PA","Stockton, CA","Anchorage, AK","Cincinnati, OH",
  "St. Paul, MN","Greensboro, NC","Toledo, OH","Newark, NJ","Plano, TX",
  "Henderson, NV","Lincoln, NE","Buffalo, NY","Fort Wayne, IN","Jersey City, NJ",
  "St. Petersburg, FL","Chandler, AZ","Laredo, TX","Norfolk, VA","Madison, WI",
  "Durham, NC","Lubbock, TX","Winston-Salem, NC","Garland, TX","Glendale, AZ",
  "Hialeah, FL","Reno, NV","Baton Rouge, LA","Irvine, CA","Chesapeake, VA",
  "Scottsdale, AZ","North Las Vegas, NV","Fremont, CA","Gilbert, AZ","San Bernardino, CA",
  "Birmingham, AL","Boise, ID","Rochester, NY","Richmond, VA","Spokane, WA",
  "Des Moines, IA","Montgomery, AL","Modesto, CA","Fayetteville, NC","Tacoma, WA",
  "Shreveport, LA","Fontana, CA","Columbus, GA","Moreno Valley, CA","Glendale, CA",
  "Akron, OH","Huntington Beach, CA","Little Rock, AR","Augusta, GA","Grand Rapids, MI",
  "Salt Lake City, UT","Tallahassee, FL","Huntsville, AL","Worcester, MA","Knoxville, TN",
  "Jacksonville, NC","Fort Lauderdale, FL","Providence, RI","Tempe, AZ","Garden Grove, CA",
];

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const { industry, cities: manualCities, usaMode } = await req.json() as { industry: string; cities: string[]; usaMode?: boolean };
  const queries = INDUSTRIES[industry];
  if (!queries) return NextResponse.json({ error: "Unknown industry" }, { status: 400 });

  // In USA mode, rotate through all cities using a Redis cursor
  let cities = manualCities ?? [];
  if (usaMode) {
    const cursor = await redis.get<number>("outreach:city_cursor") ?? 0;
    const BATCH = 5;
    cities = USA_CITIES.slice(cursor, cursor + BATCH);
    if (cities.length === 0) cities = USA_CITIES.slice(0, BATCH); // wrap around
    const nextCursor = (cursor + BATCH) % USA_CITIES.length;
    await redis.set("outreach:city_cursor", nextCursor);
  }

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

  return NextResponse.json({ ok: true, found: leads.length, new: newLeads.length, total: merged.length, cities });
}
