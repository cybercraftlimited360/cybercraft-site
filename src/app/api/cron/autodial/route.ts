import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { DialQueueEntry } from "@/app/api/admin/autodial/route";

export const maxDuration = 60;

// ── DISABLED BY DEFAULT ───────────────────────────────────────────────────────
// This cron will not place any calls unless autodial:enabled is set to "true" in Redis.
// To enable: set the key via admin panel or Redis CLI.
// To disable: delete the key or set it to anything other than "true".

function authCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function analyzeLead(entry: DialQueueEntry): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY ?? "";
  if (!groqKey) return entry.challenge || "";

  const gaps: string[] = [];
  if (!entry.hasWebsite) gaps.push("no website found online");
  if ((entry.reviewCount ?? 0) < 10) gaps.push(`only ${entry.reviewCount ?? 0} Google reviews — very low visibility`);
  if ((entry.rating ?? 5) < 4.0) gaps.push(`low Google rating of ${entry.rating}/5 — reputation issue`);
  if (!entry.hasBooking) gaps.push("no online booking system — losing leads who don't want to call");
  if (!hasChatbot(entry)) gaps.push("no chatbot or live chat on website — visitors leave with no way to connect");
  if (!entry.hasReviews) gaps.push("no review widget on site — missing social proof");

  if (gaps.length === 0) return entry.challenge || "Interested in AI automation for their business";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Write a 2-sentence briefing for Amy, an AI sales agent about to cold-call ${entry.name || "a business owner"} at ${entry.company} (${entry.city || "US"}).

Their gaps: ${gaps.join("; ")}.

The briefing should tell Amy: (1) what specific problems this business has, (2) which CyberCraft360 service to lead with. Be specific and natural — this is internal context Amy will use to guide the conversation. Keep it under 60 words.`
        }],
        max_tokens: 120,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? gaps.join(". ");
  } catch {
    return gaps.join(". ");
  }
}

function hasChatbot(entry: DialQueueEntry): boolean {
  return entry.hasChatbot ?? false;
}

export async function GET(req: NextRequest) {
  if (!authCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if auto-dial is enabled
  const enabled = await redis.get<string>("autodial:enabled");
  if (enabled !== "true") {
    return NextResponse.json({ ok: true, skipped: true, reason: "Auto-dial is disabled. Set autodial:enabled=true in Redis to activate." });
  }

  const dailyLimit = Number(await redis.get<string>("autodial:daily_limit") ?? "10");

  // Check how many calls already placed today
  const todayKey = `autodial:called:${new Date().toISOString().slice(0, 10)}`;
  const calledToday = Number(await redis.get<string>(todayKey) ?? "0");
  const remaining = dailyLimit - calledToday;

  if (remaining <= 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: `Daily limit of ${dailyLimit} calls already reached.` });
  }

  let queue = await redis.get<DialQueueEntry[]>("autodial:queue") ?? [];
  let pending = queue.filter(e => e.status === "pending");

  // Auto-refill queue from outreach:leads — only pull exactly what's needed
  if (pending.length < remaining) {
    const needed = remaining - pending.length;
    const allLeads: any[] = await redis.get("outreach:leads") ?? [];
    const calledPhones = new Set(queue.map(e => e.phone).filter(Boolean));
    const candidates = allLeads
      .filter(l => l.phone && !calledPhones.has(l.phone))
      .slice(0, needed);

    const fresh: DialQueueEntry[] = [];
    for (const l of candidates) {
      // Live website scrape to detect gaps before queuing
      let hasBooking = l.hasBooking ?? false;
      let hasChatbot = l.hasChatbot ?? false;
      let hasReviews = l.hasReviews ?? false;
      let hasWebsite = !!l.website;

      if (l.website) {
        try {
          const ctrl = new AbortController();
          setTimeout(() => ctrl.abort(), 6000);
          const r = await fetch(l.website.startsWith("http") ? l.website : `https://${l.website}`, {
            signal: ctrl.signal,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          });
          if (r.ok) {
            const html = await r.text();
            hasBooking = /book\s*now|schedule|appointment|calendly|acuityscheduling|setmore/i.test(html);
            hasChatbot = /intercom|drift|tidio|livechat|zendesk|freshchat|crisp|tawk\.to|chatbot/i.test(html);
            hasReviews = /google\s*review|trustpilot|yelp|reviews\.io|birdeye|podium/i.test(html);
            hasWebsite = true;
          }
        } catch { /* skip on timeout */ }
      }

      // Build AI briefing from detected gaps — no extra API calls beyond what's needed
      const gaps: string[] = [];
      if (!hasWebsite) gaps.push("no website");
      if ((l.reviewCount ?? 0) < 10) gaps.push(`only ${l.reviewCount ?? 0} Google reviews`);
      if ((l.rating ?? 5) < 4.0) gaps.push(`low ${l.rating}/5 rating`);
      if (!hasBooking) gaps.push("no online booking");
      if (!hasChatbot) gaps.push("no chat widget");
      if (!hasReviews) gaps.push("no review widget on site");

      fresh.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        phone: l.phone,
        name: l.ownerName || l.name || "",
        company: l.name || l.company || "",
        website: l.website || "",
        city: l.city || "",
        rating: l.rating,
        reviewCount: l.reviewCount,
        hasWebsite,
        hasBooking,
        hasChatbot,
        hasReviews,
        challenge: gaps.length ? gaps.join("; ") : "Interested in AI automation",
        status: "pending",
        addedAt: new Date().toISOString(),
      });
    }

    if (fresh.length > 0) {
      queue = [...queue, ...fresh];
      await redis.set("autodial:queue", queue);
      pending = queue.filter(e => e.status === "pending");
    }
  }

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, reason: "No pending leads in queue and no new leads with phone numbers available." });
  }

  const batch = pending.slice(0, remaining);
  const results: any[] = [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";

  for (const entry of batch) {
    try {
      // Generate AI briefing for this lead
      const challenge = await analyzeLead(entry);

      // Place the call via Twilio
      const callRes = await fetch(`${siteUrl}/api/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": Buffer.from(`cc360:${process.env.ADMIN_SECRET}:v2`).toString("base64") },
        body: JSON.stringify({
          phone: entry.phone,
          name: entry.name,
          company: entry.company,
          challenge,
        }),
      });

      const callData = await callRes.json();
      const success = callData.ok;

      // Update queue entry
      const idx = queue.findIndex(e => e.id === entry.id);
      if (idx !== -1) {
        queue[idx] = {
          ...queue[idx],
          status: success ? "called" : "error",
          calledAt: new Date().toISOString(),
          callSid: callData.callSid,
          challenge,
        };
      }

      results.push({ id: entry.id, name: entry.name, company: entry.company, ok: success, callSid: callData.callSid });

      // Small gap between calls to avoid Twilio rate limits
      if (batch.indexOf(entry) < batch.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (e: any) {
      const idx = queue.findIndex(e2 => e2.id === entry.id);
      if (idx !== -1) queue[idx] = { ...queue[idx], status: "error", calledAt: new Date().toISOString() };
      results.push({ id: entry.id, name: entry.name, ok: false, error: String(e).slice(0, 100) });
    }
  }

  await redis.set("autodial:queue", queue);
  await redis.set(todayKey, calledToday + results.filter(r => r.ok).length, { ex: 86400 });

  return NextResponse.json({ ok: true, called: results.filter(r => r.ok).length, results });
}
