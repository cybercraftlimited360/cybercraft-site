import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS, scoreLead, getFlags, enrichLead } from "@/lib/outreach";
import { DEFAULT_SEQUENCES, Enrollment, Sequence } from "@/lib/email-sequences";

const INDUSTRY_TO_SEQ: Record<string, string> = {
  "HVAC": "hvac-seq",
  "Dental": "dental-seq",
  "Real Estate": "realestate-seq",
  "Law Firm": "lawfirm-seq",
  "Med Spa": "medspa-seq",
};
function industrySeqId(industry: string): string {
  return INDUSTRY_TO_SEQ[industry] ?? "general-seq";
}

export const maxDuration = 300;

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
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_TARGETS.length;
  const target = WEEKLY_TARGETS[week];

  // Rotate through USA cities (5 per run)
  const cursor = await redis.get<number>("outreach:city_cursor") ?? 0;
  const BATCH = 10;
  const citiesToScrape = USA_CITIES.slice(cursor, cursor + BATCH).length > 0
    ? USA_CITIES.slice(cursor, cursor + BATCH)
    : USA_CITIES.slice(0, BATCH);
  await redis.set("outreach:city_cursor", (cursor + BATCH) % USA_CITIES.length);

  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));
  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};

  const queries = INDUSTRIES[target.industry] ?? [];
  const seen = new Set<string>();
  const leads: any[] = [];

  for (const city of citiesToScrape) {
    for (const query of queries.slice(0, 2)) {
      try {
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " in " + city)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        for (const place of (searchData.results ?? []).slice(0, 20)) {
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

  // Auto-enroll new leads that have email addresses into the right sequence
  const leadsWithEmail = newLeads.filter(l => l.email);
  if (leadsWithEmail.length > 0) {
    const sequences: Sequence[] = await redis.get("outreach:sequences") ?? DEFAULT_SEQUENCES;
    const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
    const activeLeadIds = new Set(enrollments.filter(e => e.status === "active").map(e => e.leadId));
    const fromEmail = process.env.OUTREACH_EMAIL ?? "";
    const fromName = process.env.OUTREACH_NAME ?? "Saad — CyberCraft360";
    const now = new Date();
    const newEnrollments: Enrollment[] = [];

    for (const lead of leadsWithEmail) {
      if (activeLeadIds.has(lead.id)) continue;
      const seqId = industrySeqId(lead.industry);
      const seq = sequences.find(s => s.id === seqId) ?? sequences[0];
      if (!seq) continue;
      newEnrollments.push({
        id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadIndustry: lead.industry,
        leadCity: lead.city ?? "",
        ownerName: lead.ownerName ?? lead.contactName,
        sequenceId: seq.id,
        currentStep: 0,
        nextSendAt: now.toISOString(),
        status: "active",
        enrolledAt: now.toISOString(),
        sentSteps: [],
        openedSteps: [],
        fromEmail,
        fromName,
      });
    }

    if (newEnrollments.length > 0) {
      await redis.set("outreach:enrollments", [...newEnrollments, ...enrollments]);
      console.log(`[lead-scrape-cron] Auto-enrolled ${newEnrollments.length} leads into email sequences`);
    }
  }

  // Daily email report
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
