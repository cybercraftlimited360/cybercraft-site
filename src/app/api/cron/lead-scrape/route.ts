import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS } from "@/app/api/admin/outreach/scrape/route";

// Auto-scrape cron: runs every Monday, rotates through industry+city combos
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });

  // Pick target based on week number so it rotates automatically
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_TARGETS.length;
  const target = WEEKLY_TARGETS[week];

  const existing = await redis.get<any[]>("outreach:leads") ?? [];
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));

  const queries = INDUSTRIES[target.industry] ?? [];
  const seen = new Set<string>();
  const leads: any[] = [];

  for (const city of target.cities) {
    for (const query of queries.slice(0, 1)) {
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

          // Inline scoring (mirrors scrape route)
          let score = 0;
          const rc = detail.user_ratings_total ?? 0;
          const rat = detail.rating ?? 0;
          if (rc < 20) score += 30; else if (rc < 50) score += 25; else if (rc < 100) score += 15;
          if (rat >= 3.5 && rat <= 4.2) score += 15; else if (rat > 4.2 && rat < 4.6) score += 8;
          if (!detail.website) score += 20; else score += 5;
          if (detail.opening_hours?.periods?.some((p: any) => p.open?.time === "0000" && !p.close)) score += 20;
          if (detail.formatted_phone_number) score += 10;
          const rText = reviewTexts.join(" ").toLowerCase();
          ["busy","no answer","voicemail","didn't call back","hard to reach","waited"].forEach(s => { if (rText.includes(s)) score += 8; });

          const flags: string[] = [];
          if (!detail.website) flags.push("No website");
          if (detail.opening_hours?.periods?.some((p: any) => p.open?.time === "0000" && !p.close)) flags.push("Open 24/7");
          if (["busy","no answer","voicemail"].some(s => rText.includes(s))) flags.push("Missed call signals");
          if (rc < 20) flags.push("Very few reviews");

          leads.push({
            id: place.place_id,
            name: detail.name ?? place.name,
            phone: detail.formatted_phone_number ?? null,
            website: detail.website ?? null,
            address: detail.formatted_address ?? place.formatted_address,
            rating: detail.rating ?? place.rating ?? null,
            reviewCount: rc,
            industry: target.industry,
            city,
            score,
            flags,
            scrapedAt: new Date().toISOString(),
            messaged: false,
            enriched: false,
          });
        }
      } catch { /* skip */ }
    }
  }

  const newLeads = leads.filter(l => !existingIds.has(l.id));
  const merged = [...newLeads, ...existing].slice(0, 500);
  await redis.set("outreach:leads", merged);

  // Send weekly lead report email
  const topLeads = [...newLeads].sort((a, b) => b.score - a.score).slice(0, 5);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
  if (newLeads.length > 0) {
    const emailBody = [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `WEEKLY LEAD REPORT — CyberCraft360`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Industry:  ${target.industry}`,
      `Cities:    ${target.cities.join(", ")}`,
      `New leads: ${newLeads.length}`,
      `DB total:  ${merged.length}`,
      ``,
      `TOP 5 HIGHEST-SCORED LEADS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...topLeads.map((l, i) => [
        ``,
        `${i + 1}. ${l.name}`,
        `   Score:   ${l.score}`,
        `   City:    ${l.city}`,
        `   Phone:   ${l.phone ?? "—"}`,
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
      body: JSON.stringify({
        subject: `Weekly Leads: ${newLeads.length} new ${target.industry} prospects`,
        body: emailBody,
      }),
    }).catch(() => {});
  }

  console.log(`[lead-scrape-cron] ${target.industry} | ${newLeads.length} new leads | week ${week}`);
  return NextResponse.json({ ok: true, industry: target.industry, cities: target.cities, new: newLeads.length, total: merged.length });
}
