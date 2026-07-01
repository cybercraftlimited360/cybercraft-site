import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");
const PENDING_FILE = path.join(process.cwd(), "data", "pending-calls.json");
const NOTIFY_EMAIL = "cybercraftlimited@gmail.com";

function readPending(): any[] {
  try { return JSON.parse(fs.readFileSync(PENDING_FILE, "utf-8")); }
  catch { return []; }
}

function savePendingCall(lead: any, token: string) {
  const pending = readPending();
  pending.push({ token, ...lead, createdAt: new Date().toISOString() });
  fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true });
  fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
}

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

async function sendLeadEmail(
  lead: { name: string; company: string; phone?: string; challenge: string; capturedAt: string },
  approveUrl?: string,
  skipUrl?: string,
) {

  const time = new Date(lead.capturedAt).toLocaleString("en-US", {
    dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago",
  });

  const callSection = lead.phone && approveUrl && skipUrl ? `
        <!-- Call decision -->
        <tr><td style="padding:0 36px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);overflow:hidden;">
            <tr><td style="padding:20px 24px 8px;">
              <span style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);">Phone: ${lead.phone}</span><br/>
              <span style="font-size:13px;color:rgba(255,255,255,0.55);margin-top:4px;display:block;">Should Aria (Bland AI) call this lead now?</span>
            </td></tr>
            <tr><td style="padding:16px 24px 20px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="${approveUrl}" style="display:inline-block;padding:11px 22px;border-radius:8px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
                      ✓ Yes — Have Aria Call Them
                    </a>
                  </td>
                  <td>
                    <a href="${skipUrl}" style="display:inline-block;padding:11px 22px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
                      ✕ I'll Call Them Myself
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:10px;color:rgba(255,255,255,0.2);">Aria charges ~$0.14/min · approx $1.40 for a 10-min call · one-time use link</p>
            </td></tr>
          </table>
        </td></tr>` : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></td></tr>

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

        <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

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

        ${callSection}

        <tr><td style="padding:0 36px 28px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.2);">Captured via website · ${time} CT</span>
        </td></tr>

        <tr><td style="padding:0 36px 36px;">
          <a href="https://calendly.com/cybercraftlimited/30min" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
            View Booking Calendar →
          </a>
        </td></tr>

        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px;color:rgba(255,255,255,0.15);">CyberCraft360 · Lead Notification · Automated message</span>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { sendEmail } = await import("@/lib/mailer");
  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `🎯 New Lead: ${lead.name} — ${lead.company}${lead.phone ? " (has phone)" : ""}`,
    html,
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

      // Build approval URLs if phone provided
      let approveUrl: string | undefined;
      let skipUrl: string | undefined;
      if (lead.phone) {
        const token = crypto.randomBytes(20).toString("hex");
        savePendingCall({ phone: lead.phone, name: lead.name, company: lead.company, challenge: lead.challenge }, token);
        const base = req.nextUrl.origin;
        approveUrl = `${base}/api/call/approve?token=${token}&action=approve`;
        skipUrl = `${base}/api/call/approve?token=${token}&action=skip`;
      }

      // Fire email notification — non-blocking
      sendLeadEmail(enriched, approveUrl, skipUrl).catch(err => console.error("Email error:", err));
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
