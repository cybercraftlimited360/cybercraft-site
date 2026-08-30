import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { INDUSTRIES, WEEKLY_TARGETS, scoreLead, getFlags, enrichLead, MISSED_CALL_SIGNALS, INDUSTRY_PAIN } from "@/lib/outreach";
import { createTransport } from "nodemailer";
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
  const BATCH = 5;
  const citiesToScrape = USA_CITIES.slice(cursor, cursor + BATCH).length > 0
    ? USA_CITIES.slice(cursor, cursor + BATCH)
    : USA_CITIES.slice(0, BATCH);
  await redis.set("outreach:city_cursor", (cursor + BATCH) % USA_CITIES.length);

  let existing = await redis.get<any[]>("outreach:leads") ?? [];
  // Fix any %20-prefixed emails left by the old scraper (leading whitespace → URL-encoded)
  let cleanedCount = 0;
  existing = existing.map((l: any) => {
    if (l.email && l.email.includes("%20")) {
      const fixed = decodeURIComponent(l.email).trim().toLowerCase();
      cleanedCount++;
      return { ...l, email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fixed) ? fixed : null };
    }
    return l;
  });
  if (cleanedCount > 0) {
    await redis.set("outreach:leads", existing);
    console.log(`[lead-scrape-cron] Cleaned ${cleanedCount} %20-prefixed emails from existing leads`);
  }
  const existingIds = new Set(existing.map((l: any) => l.id));
  const contactedIds = new Set(existing.filter((l: any) => l.messaged).map((l: any) => l.id));
  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};

  // Don't scrape new leads if there are already 100+ unemailed leads queued — use existing stock first
  const unemailed = existing.filter((l: any) => !l.messaged && l.email).length;
  if (unemailed >= 100) {
    return NextResponse.json({
      ok: true, skipped: true,
      message: `Scrape paused — ${unemailed} unemailed leads already queued. Will resume when queue drops below 100.`,
    });
  }

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
          // Skip chains and franchises — they have corporate gatekeepers, not local owners
          if (/\b(inc\.|llc\.|corp\.|franchise|national|corporate|headquarters|group of)\b/i.test(place.name)) continue;

          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours,reviews&key=${apiKey}`;
          const detail = ((await (await fetch(detailUrl)).json()).result) ?? {};
          const reviewTexts = (detail.reviews ?? []).map((r: any) => r.text ?? "");

          const phone = detail.formatted_phone_number ?? null;
          const website = detail.website ?? null;
          const reviewCount = detail.user_ratings_total ?? place.user_ratings_total ?? 0;
          // Skip ghost listings — no phone, no website, zero reviews = likely closed or bot
          if (!phone && !website && reviewCount === 0) continue;

          leads.push({
            id: place.place_id,
            name: detail.name ?? place.name,
            phone,
            website,
            address: detail.formatted_address ?? place.formatted_address,
            rating: detail.rating ?? place.rating ?? null,
            reviewCount,
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

  // Domains that are never valid business emails
  const BLOCKED_DOMAINS = new Set([
    "example.com", "domain.com", "test.com", "email.com", "placeholder.com",
    "yourdomain.com", "yourcompany.com", "company.com", "business.com",
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
    "live.com", "msn.com", "me.com", "mac.com", "protonmail.com", "zoho.com",
  ]);

  // Local-part prefixes that are role addresses, not individual inboxes
  const ROLE_ADDRESS = /^(noreply|no-reply|donotreply|do-not-reply|admin|webmaster|support|help|contact|info|hello|sales|marketing|team|staff|office|service|services|privacy|legal|abuse|dmca|billing|invoice|careers|jobs|hr|recruiting|newsletter|unsubscribe|feedback|press|media|pr|customerservice|customer-service|enquiries|enquiry|general)$/i;

  function isValidBusinessEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const lower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower)) return false;
    const [local, domain] = lower.split("@");
    if (BLOCKED_DOMAINS.has(domain)) return false;
    if (ROLE_ADDRESS.test(local)) return false; // role inboxes don't reach a decision-maker
    if (local.length > 64 || domain.length > 255) return false;
    return true;
  }

  // Auto-enroll new leads that have valid business email addresses into the right sequence
  const leadsWithEmail = newLeads.filter(l => isValidBusinessEmail(l.email));
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
        leadFlags: lead.flags ?? [],
        leadWebsite: lead.website ?? undefined,
        leadPhone: lead.phone ?? undefined,
        leadRating: lead.rating ?? undefined,
        leadReviewCount: lead.reviewCount ?? undefined,
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

  // ── Review monitoring pass ─────────────────────────────────────────────────
  // Re-fetch Place Details for a small batch of existing leads and check whether
  // any new low-star reviews mention missed calls / slow response. If found,
  // send a pain-specific email immediately and mark the lead so it never fires twice.
  const outreachUser = process.env.OUTREACH_EMAIL;
  const outreachPass = process.env.OUTREACH_EMAIL_PASSWORD;
  const outreachName = process.env.OUTREACH_NAME ?? "Saad — CyberCraft360";

  if (apiKey && outreachUser && outreachPass) {
    const REVIEW_BATCH = 10; // re-fetch max 10 leads per run (~$0.17/day at $0.017/call)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Candidates: have email, not yet messaged, not yet review-triggered, scraped 7+ days ago
    const candidates = (await redis.get<any[]>("outreach:leads") ?? [])
      .filter((l: any) =>
        l.email &&
        !l.messaged &&
        !l.reviewTriggered &&
        l.id &&
        new Date(l.scrapedAt).getTime() < sevenDaysAgo
      )
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, REVIEW_BATCH);

    let reviewTriggered = 0;
    const updatedLeads = await redis.get<any[]>("outreach:leads") ?? [];

    const outreachTransport = createTransport({
      host: process.env.OUTREACH_SMTP_HOST ?? "smtp.gmail.com",
      port: parseInt(process.env.OUTREACH_SMTP_PORT ?? "465"),
      secure: true,
      auth: { user: outreachUser, pass: outreachPass },
    });

    for (const lead of candidates) {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.id}&fields=reviews,user_ratings_total&key=${apiKey}`;
        const detail = ((await (await fetch(detailUrl)).json()).result) ?? {};
        const reviews: any[] = detail.reviews ?? [];

        // Look for pain reviews posted after we last scraped this lead
        const scrapedAt = new Date(lead.scrapedAt).getTime();
        const painReviews = reviews.filter((r: any) => {
          if ((r.rating ?? 5) > 3) return false; // only 1–3 star reviews
          const reviewTime = (r.time ?? 0) * 1000;
          if (reviewTime < scrapedAt) return false; // not a new review
          const text = (r.text ?? "").toLowerCase();
          return MISSED_CALL_SIGNALS.some(s => text.includes(s));
        });

        if (painReviews.length === 0) continue;

        const signal = MISSED_CALL_SIGNALS.find(s =>
          painReviews.some((r: any) => (r.text ?? "").toLowerCase().includes(s))
        ) ?? "missed calls";

        const industryPain = INDUSTRY_PAIN[lead.industry] ?? "missing inbound calls";
        const subject = `Noticed something on your Google listing — quick thought`;
        const bodyText = `Hi${lead.ownerName ? ` ${lead.ownerName.split(" ")[0]}` : ""},

I came across a recent review on your Google listing that mentioned ${signal}. It's one of the most common things we hear from ${lead.industry.toLowerCase()} businesses — and honestly, it's exactly the problem we built CyberCraft360 to solve.

We build AI systems that handle inbound calls 24/7 — so when your team is busy on a job, every call still gets answered, every lead gets qualified, and appointments get booked automatically. No more ${industryPain}.

Worth a 10-minute look? I can show you exactly what it'd look like for your business.

Best,
${outreachName}
cybercraft360.com  ·  Schedule a call: +1 (346) 600-9210`;

        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fff;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.75;color:#1a1a1a">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;margin:0 auto;padding:40px 24px"><tbody>
${bodyText.split("\n").map(line =>
  line.trim() === ""
    ? `<tr><td style="padding:6px 0"></td></tr>`
    : `<tr><td style="padding:1px 0">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#1a1a1a">${url}</a>`)}</td></tr>`
).join("")}
<tr><td style="padding-top:24px;border-top:1px solid #e8e8e8;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#aaa;letter-spacing:0.04em">CYBERCRAFT360 &nbsp;·&nbsp; <a href="https://cybercraft360.com" style="color:#aaa;text-decoration:none">cybercraft360.com</a></td></tr>
</tbody></table></body></html>`;

        await outreachTransport.sendMail({
          from: `${outreachName} <${outreachUser}>`,
          to: lead.email,
          subject,
          text: bodyText,
          html,
        });

        // Mark lead in Redis
        const idx = updatedLeads.findIndex((l: any) => l.id === lead.id);
        if (idx !== -1) {
          updatedLeads[idx] = {
            ...updatedLeads[idx],
            reviewTriggered: true,
            reviewTriggeredAt: new Date().toISOString(),
            reviewSignal: signal,
          };
        }
        reviewTriggered++;
        console.log(`[review-monitor] Triggered email to ${lead.name} (${lead.email}) — signal: "${signal}"`);
      } catch (err) {
        console.error(`[review-monitor] Error checking ${lead.name}:`, err);
      }
    }

    if (reviewTriggered > 0) {
      await redis.set("outreach:leads", updatedLeads);
      console.log(`[review-monitor] Sent ${reviewTriggered} pain-triggered email(s) this run`);
    }
  }
  // ── End review monitoring ───────────────────────────────────────────────────

  console.log(`[lead-scrape-cron] ${target.industry} | ${newLeads.length} new | week ${week}`);
  return NextResponse.json({ ok: true, industry: target.industry, new: newLeads.length, total: merged.length });
}
