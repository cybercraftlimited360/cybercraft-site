import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No GROQ_API_KEY" }, { status: 500 });

  // ── Gather data from Redis ──────────────────────────────────────────────────
  const [leads, clients, pipeline, invoices, callLog, competitors] = await Promise.all([
    redis.get<any[]>("leads:all").catch(() => []),
    redis.get<any[]>("clients:all").catch(() => []),
    redis.get<any[]>("pipeline:all").catch(() => []),
    redis.get<any[]>("invoices:all").catch(() => []),
    redis.get<any[]>("lauren:call-log").catch(() => []),
    redis.get<any[]>("competitors:all").catch(() => []),
  ]);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoIso = weekAgo.toISOString();

  const leadsArr = leads ?? [];
  const clientsArr = clients ?? [];
  const pipelineArr = pipeline ?? [];
  const invoicesArr = invoices ?? [];
  const callLogArr = callLog ?? [];

  const newLeads = leadsArr.filter((l: any) => (l.capturedAt || "") > weekAgoIso);
  const newCalls = callLogArr.filter((c: any) => (c.startedAt || "") > weekAgoIso);
  const openDeals = pipelineArr.filter((d: any) => d.stage !== "won" && d.stage !== "lost");
  const pipelineValue = openDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);
  const pendingInvoices = invoicesArr.filter((i: any) => i.status === "sent");
  const pendingValue = pendingInvoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const hotLeads = newLeads.filter((l: any) => (l.score || 0) >= 70);

  const summary = {
    week_ending: now.toLocaleDateString("en-US", { dateStyle: "long" }),
    new_leads: newLeads.length,
    hot_leads: hotLeads.length,
    lauren_calls: newCalls.length,
    active_clients: clientsArr.filter((c: any) => c.status === "active").length,
    pipeline_value: pipelineValue,
    open_deals: openDeals.length,
    pending_invoices: pendingValue,
    top_lead: newLeads.sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0] || null,
    competitors_tracked: (competitors ?? []).length,
  };

  // ── Groq: write the narrative report ───────────────────────────────────────
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the chief of staff for CyberCraft360, a premium AI agency in Houston TX run by Saad Imran. You write a concise weekly business report every Monday morning. Write in plain, direct English — no fluff, no filler. Be specific. Highlight wins, flag risks, and give 2-3 sharp action items for the week ahead. Address Saad directly.`,
        },
        {
          role: "user",
          content: `Write this week's business report for Saad based on the following data:

Week ending: ${summary.week_ending}
New leads this week: ${summary.new_leads} (${summary.hot_leads} hot, score 70+)
Lauren AI calls made: ${summary.lauren_calls}
Active clients: ${summary.active_clients}
Open pipeline deals: ${summary.open_deals} worth $${summary.pipeline_value.toLocaleString()}
Pending invoice value: $${summary.pending_invoices.toLocaleString()}
Competitors tracked: ${summary.competitors_tracked}
${summary.top_lead ? `Top lead this week: ${summary.top_lead.name || "Unknown"} from ${summary.top_lead.company || "Unknown"} (score ${summary.top_lead.score || 0}/100) — "${summary.top_lead.challenge || ""}"` : "No new leads this week."}

Write 3 sections:
1. THIS WEEK AT A GLANCE — 2–3 punchy sentences summarizing the week
2. WHAT TO FOCUS ON — 2–3 specific action items for this week, based on the data
3. WATCH OUT FOR — 1–2 risks or things that need attention

Keep it under 300 words total. Write like you're texting a smart summary to your boss, not writing a corporate memo.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const groqData = await groqRes.json();
  const narrative = groqData.choices?.[0]?.message?.content || "Report generation failed.";

  // ── Save report to Redis ────────────────────────────────────────────────────
  const reportEntry = {
    id: Date.now().toString(),
    generatedAt: now.toISOString(),
    weekEnding: summary.week_ending,
    summary,
    narrative,
  };

  const existingReports = await redis.get<any[]>("reports:weekly").catch(() => []) ?? [];
  const updatedReports = [reportEntry, ...existingReports].slice(0, 12); // keep last 12 weeks
  await redis.set("reports:weekly", updatedReports);

  // ── Email to owner ──────────────────────────────────────────────────────────
  const emailHtml = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f9fafb;">
  <div style="background:#0077cc;height:4px;border-radius:2px;margin-bottom:28px;"></div>
  <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;margin:0 0 6px;">CyberCraft360 · Weekly Report</p>
  <h1 style="font-size:22px;font-weight:800;color:#0f1117;margin:0 0 4px;">Week of ${summary.week_ending}</h1>
  <p style="color:#6b7280;font-size:13px;margin:0 0 28px;">Auto-generated Monday morning by your AI chief of staff</p>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
    ${[
      ["New Leads", summary.new_leads, "#0077cc"],
      ["Hot Leads", summary.hot_leads, "#ef4444"],
      ["Lauren Calls", summary.lauren_calls, "#7c3aed"],
      ["Pipeline", `$${summary.pipeline_value.toLocaleString()}`, "#22c55e"],
    ].map(([label, val, color]) => `
      <div style="padding:14px;border-radius:10px;background:#fff;border:1px solid #e5e7eb;text-align:center;">
        <p style="font-size:20px;font-weight:800;color:${color};margin:0 0 3px;">${val}</p>
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin:0;">${label}</p>
      </div>
    `).join("")}
  </div>

  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px 22px;margin-bottom:20px;">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#0077cc;margin:0 0 12px;">AI Analysis</p>
    <pre style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.7;color:#374151;white-space:pre-wrap;margin:0;">${narrative}</pre>
  </div>

  ${summary.top_lead ? `
  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;">
    <p style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ea580c;margin:0 0 6px;">🔥 Top Lead This Week</p>
    <p style="font-size:13px;font-weight:700;color:#0f1117;margin:0 0 3px;">${summary.top_lead.name || "Unknown"} · ${summary.top_lead.company || ""}</p>
    <p style="font-size:12px;color:#6b7280;margin:0;">"${summary.top_lead.challenge || ""}"</p>
  </div>` : ""}

  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:24px;">CyberCraft360 · cybercraft360.com · Houston, TX</p>
</div>`;

  await sendEmail({
    to: "cybercraftlimited@gmail.com",
    subject: `📊 Weekly Report — ${summary.week_ending}`,
    html: emailHtml,
  });

  return NextResponse.json({ ok: true, report: reportEntry });
}
