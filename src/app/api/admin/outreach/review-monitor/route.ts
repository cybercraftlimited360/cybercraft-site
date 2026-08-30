import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { MISSED_CALL_SIGNALS, INDUSTRY_PAIN } from "@/lib/outreach";
import { createTransport } from "nodemailer";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// GET — return all review-triggered leads + summary stats
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leads = await redis.get<any[]>("outreach:leads") ?? [];
  const triggered = leads
    .filter((l: any) => l.reviewTriggered)
    .sort((a: any, b: any) => new Date(b.reviewTriggeredAt ?? 0).getTime() - new Date(a.reviewTriggeredAt ?? 0).getTime());

  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = triggered.filter((l: any) => new Date(l.reviewTriggeredAt ?? 0).getTime() > oneWeekAgo).length;
  const converted = triggered.filter((l: any) => l.converted).length;

  // Candidates not yet triggered — shows pipeline
  const candidates = leads.filter((l: any) =>
    !l.reviewTriggered &&
    !l.messaged &&
    l.email &&
    l.id
  ).length;

  return NextResponse.json({
    triggered,
    stats: {
      total: triggered.length,
      thisWeek,
      converted,
      conversionRate: triggered.length > 0 ? ((converted / triggered.length) * 100).toFixed(1) : "0.0",
      candidates,
    },
  });
}

// POST — manually run a review check on a single lead by place_id
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await req.json() as { leadId?: string };
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const outreachUser = process.env.OUTREACH_EMAIL;
  const outreachPass = process.env.OUTREACH_EMAIL_PASSWORD;
  const outreachName = process.env.OUTREACH_NAME ?? "Saad — CyberCraft360";

  if (!apiKey) return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY not configured" }, { status: 500 });
  if (!outreachUser || !outreachPass) return NextResponse.json({ error: "OUTREACH_EMAIL / OUTREACH_EMAIL_PASSWORD not configured" }, { status: 500 });

  const leads = await redis.get<any[]>("outreach:leads") ?? [];

  // If leadId provided, check just that lead; otherwise check top 10 candidates
  const candidates = leadId
    ? leads.filter((l: any) => l.id === leadId && !l.reviewTriggered)
    : leads
        .filter((l: any) => l.email && !l.messaged && !l.reviewTriggered && l.id)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10);

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, triggered: 0, message: "No eligible candidates found" });
  }

  const transport = createTransport({
    host: process.env.OUTREACH_SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.OUTREACH_SMTP_PORT ?? "465"),
    secure: true,
    auth: { user: outreachUser, pass: outreachPass },
  });

  const updatedLeads = [...leads];
  const results: { name: string; email: string; signal: string; sent: boolean; error?: string }[] = [];

  for (const lead of candidates) {
    try {
      const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${lead.id}&fields=reviews,user_ratings_total&key=${apiKey}`;
      const detail = ((await (await fetch(detailUrl)).json()).result) ?? {};
      const reviews: any[] = detail.reviews ?? [];
      const scrapedAt = new Date(lead.scrapedAt ?? 0).getTime();

      const painReviews = reviews.filter((r: any) => {
        if ((r.rating ?? 5) > 3) return false;
        const reviewTime = (r.time ?? 0) * 1000;
        if (reviewTime < scrapedAt) return false;
        const text = (r.text ?? "").toLowerCase();
        return MISSED_CALL_SIGNALS.some(s => text.includes(s));
      });

      if (painReviews.length === 0) {
        results.push({ name: lead.name, email: lead.email, signal: "", sent: false });
        continue;
      }

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

      await transport.sendMail({ from: `${outreachName} <${outreachUser}>`, to: lead.email, subject, text: bodyText, html });

      const idx = updatedLeads.findIndex((l: any) => l.id === lead.id);
      if (idx !== -1) {
        updatedLeads[idx] = { ...updatedLeads[idx], reviewTriggered: true, reviewTriggeredAt: new Date().toISOString(), reviewSignal: signal };
      }
      results.push({ name: lead.name, email: lead.email, signal, sent: true });
    } catch (err: any) {
      results.push({ name: lead.name, email: lead.email ?? "", signal: "", sent: false, error: String(err).slice(0, 200) });
    }
  }

  const sentCount = results.filter(r => r.sent).length;
  if (sentCount > 0) await redis.set("outreach:leads", updatedLeads);

  return NextResponse.json({ ok: true, triggered: sentCount, checked: candidates.length, results });
}

// PATCH — mark a review-triggered lead as converted or dismissed
export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, converted } = await req.json() as { id: string; converted: boolean };
  const leads = await redis.get<any[]>("outreach:leads") ?? [];
  const updated = leads.map((l: any) => l.id === id ? { ...l, converted, convertedAt: converted ? new Date().toISOString() : undefined } : l);
  await redis.set("outreach:leads", updated);
  return NextResponse.json({ ok: true });
}
