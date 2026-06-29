import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");
const NOTIFY_EMAIL = "saadimran1994@gmail.com";

function readLeads(): object[] {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLeads(leads: object[]) {
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

async function sendLeadEmail(lead: { name: string; company: string; challenge: string; capturedAt: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if key not set

  const time = new Date(lead.capturedAt).toLocaleString("en-GB", {
    dateStyle: "full", timeStyle: "short", timeZone: "Europe/London",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Top accent bar -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></td></tr>

        <!-- Header -->
        <tr><td style="padding:32px 36px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</span><br/>
                <span style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;display:block;">🎯 New Lead Captured</span>
              </td>
              <td align="right" valign="top">
                <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);font-size:11px;font-weight:700;color:#22c55e;letter-spacing:0.1em;">QUALIFIED</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

        <!-- Lead details -->
        <tr><td style="padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
            ${[
              { label: "Name", value: lead.name, color: "#00d4ff" },
              { label: "Company", value: lead.company, color: "#7c3aed" },
              { label: "Challenge", value: lead.challenge, color: "#e64dff" },
            ].map((row, i) => `
            <tr style="${i > 0 ? "border-top:1px solid rgba(255,255,255,0.05);" : ""}">
              <td style="padding:14px 20px;width:100px;">
                <span style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">${row.label}</span>
              </td>
              <td style="padding:14px 20px;">
                <span style="font-size:14px;font-weight:600;color:${row.color};">${row.value}</span>
              </td>
            </tr>`).join("")}
          </table>
        </td></tr>

        <!-- Timestamp -->
        <tr><td style="padding:0 36px 28px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.2);">Captured via website chat · ${time}</span>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 36px 36px;">
          <a href="https://calendly.com/cybercraftlimited/30min" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
            View Booking Calendar →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px;color:rgba(255,255,255,0.15);">CyberCraft360 · Lead Notification · This is an automated message</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "CyberCraft360 Leads <onboarding@resend.dev>",
      to: [NOTIFY_EMAIL],
      subject: `🎯 New Lead: ${lead.name} — ${lead.company}`,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const leads = readLeads();

    const exists = leads.some(
      (l: any) =>
        l.name?.toLowerCase() === lead.name?.toLowerCase() &&
        l.company?.toLowerCase() === lead.company?.toLowerCase()
    );

    if (!exists) {
      const enriched = { ...lead, capturedAt: new Date().toISOString() };
      leads.push(enriched);
      writeLeads(leads);

      // Fire email notification — non-blocking
      sendLeadEmail(enriched).catch(err => console.error("Email error:", err));

      // Fire AI sales call if phone number provided — non-blocking
      if (lead.phone) {
        const baseUrl = req.nextUrl.origin;
        fetch(`${baseUrl}/api/call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: lead.phone,
            name: lead.name,
            company: lead.company,
            challenge: lead.challenge,
          }),
        }).catch(err => console.error("Call trigger error:", err));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Leads route error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(readLeads());
}
