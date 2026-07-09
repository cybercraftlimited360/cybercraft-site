import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import React from "react";

const OWNER_EMAIL = "cybercraftlimited@gmail.com";

const SERVICE_PRICES: Record<string, string> = {
  "Custom AI Chatbot": "from $500/mo",
  "Voice AI Agent": "from $700/mo",
  "AI Phone Agent": "from $700/mo",
  "AI Sales Agent": "from $900/mo",
  "Workflow & CRM Automation": "from $800/mo",
  "AI Content Engine": "from $600/mo",
  "AI Analytics Dashboard": "from $800/mo",
  "AI Cybersecurity": "from $1,200/mo",
  "Document Intelligence": "from $600/mo",
  "Lead Intelligence": "from $900/mo",
  "AI Ads & Marketing": "from $1,000/mo",
  "Premium Website Design": "from $1,500/mo",
};

const WHY_AI_SECTION = `
Why Replace Human Overhead with AI

In today's business landscape, human labour for repetitive, rule-based tasks is the single largest drain on profit margins. Here is what the data shows:

• The average business loses 6–10 hours per employee per week on tasks AI can do in seconds — answering FAQs, routing calls, updating CRMs, sending follow-ups.

• Missed calls cost businesses an average of $1,200 per missed lead. An AI phone agent answers every call, 24/7, for a fraction of that cost.

• Human customer service agents handle 50–80 queries per day. An AI handles unlimited queries simultaneously with zero fatigue, zero sick days, and zero overtime.

• AI-powered follow-up sequences contact new leads in under 60 seconds. Human follow-up averages 42 hours. Studies show contacting a lead within 5 minutes increases conversion by 900%.

• Most businesses that deploy AI in their first year save between $80,000 and $300,000 in annual operational costs while simultaneously growing revenue.

AI does not replace your team — it removes the work that was preventing your team from doing what humans do best: building relationships, making strategic decisions, and growing the business.
`;

async function generateQuoteContent(
  company: string,
  industry: string,
  challenge: string,
  services: string[]
): Promise<{
  headline: string;
  executiveSummary: string;
  services: { name: string; why: string; price: string }[];
  roiEstimate: string;
  timeline: string;
  nextStep: string;
}> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const serviceList = services.length
    ? services.join(", ")
    : "AI automation solutions";

  const prompt = `You are a senior AI consultant at CyberCraft360, a premium bespoke AI agency. Generate a personalised quote for:

Company: ${company}
Industry: ${industry}
Challenge: ${challenge}
Services they selected: ${serviceList}

Return ONLY valid JSON:
{
  "headline": "8-12 word compelling headline specific to their challenge",
  "executiveSummary": "2-3 sentences explaining exactly how AI solves their specific problem. Mention ${company} by name.",
  "services": [
    {"name": "Service Name", "why": "One sentence why this fits their exact challenge", "price": "from $X/mo"},
    {"name": "Service Name", "why": "One sentence why this fits their exact challenge", "price": "from $X/mo"},
    {"name": "Service Name", "why": "One sentence why this fits their exact challenge", "price": "from $X/mo"}
  ],
  "roiEstimate": "Specific ROI estimate based on typical ${industry} deployments",
  "timeline": "e.g. Live within 4-6 weeks of your discovery call",
  "nextStep": "One warm direct sentence inviting them to book a free strategy call"
}

Use only these services: ${Object.keys(SERVICE_PRICES).join(", ")}.
Match services to their selected ones where possible, then fill with the best fits.`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.choices?.[0]?.message?.content) {
    throw new Error(data.error?.message || "AI generation failed");
  }
  const parsed = JSON.parse(data.choices[0].message.content);

  // Ensure prices are populated
  parsed.services = (parsed.services || []).map((s: { name: string; why: string; price: string }) => ({
    ...s,
    price: SERVICE_PRICES[s.name] ?? s.price ?? "from $500/mo",
  }));

  return parsed;
}

async function saveIntake(intake: object) {
  try {
    const all = await redis.get<object[]>("intakes:all") ?? [];
    all.push(intake);
    await redis.set("intakes:all", all);
  } catch (err) {
    console.error("Redis intake save error:", err);
  }
}

async function sendClientQuoteEmail(form: Record<string, unknown>, pdfBuffer: Buffer) {
  const name = String(form.name ?? "").split(" ")[0] || "there";
  const company = String(form.businessName ?? "your business");

  const { sendEmail } = await import("@/lib/mailer");
  await sendEmail({
    to: String(form.email),
    subject: `Your AI Quote is Ready — ${company}`,
    html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px;">Hi ${name}, your AI quote is attached.</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0 0 20px;">
        We've reviewed your submission for <strong style="color:rgba(255,255,255,0.85);">${company}</strong> and put together a bespoke AI quote with our recommended solutions, estimated ROI, and a clear deployment timeline.
      </p>
      <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0 0 28px;">
        The PDF is attached — feel free to share it with your team. It explains exactly which AI solutions we recommend for your challenges and why replacing manual work with AI will pay for itself within months.
      </p>
      <a href="https://cybercraft360.com/book" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
        Book Your Free Strategy Call →
      </a>
      <p style="font-size:12px;color:rgba(255,255,255,0.25);margin:24px 0 0;line-height:1.6;">
        45 minutes · No obligation · Walk away with a clear AI roadmap for ${company}
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.15);margin:20px 0 0;">CyberCraft360 · Houston, TX · cybercraft360.com</p>
    </div>
  </div>
</div>`,
    attachments: [
      {
        filename: `CyberCraft360-Quote-${company.replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer,
        encoding: "base64",
        contentType: "application/pdf",
      },
    ],
  });
}

async function sendOwnerNotificationEmail(form: Record<string, unknown>) {
  const time = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" });

  const row = (label: string, value: string, color = "#00d4ff") => `
    <tr style="border-top:1px solid rgba(255,255,255,0.05);">
      <td style="padding:10px 20px;width:130px;vertical-align:top;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">${label}</span>
      </td>
      <td style="padding:10px 20px;vertical-align:top;">
        <span style="font-size:13px;font-weight:600;color:${color};">${value || "—"}</span>
      </td>
    </tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
  <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></td></tr>
  <tr><td style="padding:32px 36px 20px;">
    <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</span><br/>
    <span style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;display:block;">📋 New Quote Request + PDF Sent to Client</span>
  </td></tr>
  <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
  <tr><td style="padding:16px 36px 8px;"><span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Contact</span></td></tr>
  <tr><td style="padding:0 36px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
      ${row("Name", String(form.name))}
      ${row("Email", String(form.email))}
      ${row("Phone", String(form.phone || "Not provided"))}
      ${row("Prefers", String(form.preferredContact))}
    </table>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
      ${row("Company", String(form.businessName), "#ffffff")}
      ${row("Industry", String(form.industry), "#a78bfa")}
      ${row("Team", String(form.teamSize), "#ffffff")}
      ${row("Budget", String(form.budget), "#f59e0b")}
      ${row("Timeline", String(form.timeline), "#22c55e")}
    </table>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;">
      <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Services Requested</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${((form.servicesInterested as string[]) || []).map(s => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.25);font-size:11px;font-weight:600;color:#00d4ff;">${s}</span>`).join("")}
      </div>
    </div>
  </td></tr>
  ${form.biggestChallenge ? `<tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Biggest Challenge</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;font-style:italic;">"${form.biggestChallenge}"</p>
    </div>
  </td></tr>` : ""}
  <tr><td style="padding:0 36px 28px;">
    <a href="https://cybercraft360.com/admin" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
      View in Dashboard →
    </a>
  </td></tr>
  <tr><td style="padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05);">
    <span style="font-size:11px;color:rgba(255,255,255,0.15);">CyberCraft360 · Intake Form · ${time} · PDF quote sent to client ✓</span>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  const { sendEmail } = await import("@/lib/mailer");
  await sendEmail({
    to: OWNER_EMAIL,
    subject: `📋 New Quote Request: ${form.name} — ${form.businessName} (${form.industry})`,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();

    if (!form.name || !form.email || !form.businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = { ...form, submittedAt: new Date().toISOString() };
    saveIntake(record).catch(() => {});

    // Send owner notification immediately (non-blocking)
    sendOwnerNotificationEmail(form).catch(err => console.error("Owner email error:", err));

    // Fire lead to dashboard
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        company: form.businessName,
        challenge: (form.painPoints as string[])?.join(", ") || form.biggestChallenge || "Intake form",
        source: "Intake Form",
        ...(form.phone ? { phone: form.phone } : {}),
      }),
    }).catch(() => {});

    // Generate AI quote content + PDF + send to client (async, non-blocking so response is fast)
    (async () => {
      try {
        const content = await generateQuoteContent(
          String(form.businessName),
          String(form.industry),
          String(form.biggestChallenge || (form.painPoints as string[])?.join(", ") || "business automation"),
          (form.servicesInterested as string[]) || []
        );

        const proposalData = {
          company: String(form.businessName),
          industry: String(form.industry),
          challenge: String(form.biggestChallenge || (form.painPoints as string[])?.join(", ") || ""),
          email: String(form.email),
          ...content,
          // Append the why-AI section into the executive summary
          executiveSummary: content.executiveSummary + "\n\n" + WHY_AI_SECTION,
        };

        const pdfBuffer = Buffer.from(
          await renderToBuffer(React.createElement(ProposalDocument, { data: proposalData }) as any)
        );

        await sendClientQuoteEmail(form, pdfBuffer);
        console.log(`Quote PDF sent to ${form.email}`);
      } catch (err) {
        console.error("Quote PDF generation/send error:", err);
      }
    })();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Intake route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
