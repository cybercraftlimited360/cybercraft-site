import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

const NOTIFY_EMAIL = "cybercraftlimited@gmail.com";
const LAUREN_URL = "https://amused-empathy-production-6b44.up.railway.app";

async function triggerLaurenCall(lead: { name: string; company: string; challenge: string; phone: string }, retryCount = 0) {
  try {
    const context = `This lead came from our website chat. They mentioned: ${lead.challenge}. Address this specifically in your pitch.`;
    const res = await fetch(`${LAUREN_URL}/make-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: lead.phone,
        contactName: lead.name,
        company: lead.company,
        challenge: lead.challenge,
        context,
        retryCount,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`Lauren calling ${lead.name} (${lead.phone}) — callSid: ${data.callSid}`);
      // Track in Redis
      await redis.hincrby("lauren:stats", "totalCalls", 1);
    }
    return data;
  } catch (err) {
    console.error("Lauren call trigger error:", err);
    return null;
  }
}

async function sendLeadEmail(
  lead: { name: string; company: string; phone?: string; challenge: string; capturedAt: string },
  laurenCalling: boolean,
) {
  const time = new Date(lead.capturedAt).toLocaleString("en-US", {
    dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago",
  });

  const callSection = lead.phone ? `
    <tr><td style="padding:0 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px;background:${laurenCalling ? "rgba(34,197,94,0.05)" : "rgba(255,165,0,0.05)"};border:1px solid ${laurenCalling ? "rgba(34,197,94,0.2)" : "rgba(255,165,0,0.2)"};overflow:hidden;">
        <tr><td style="padding:20px 24px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="font-size:18px;">${laurenCalling ? "📞" : "⚠️"}</span>
            <span style="font-size:13px;font-weight:700;color:${laurenCalling ? "#22c55e" : "#f59e0b"};">
              ${laurenCalling ? "Lauren is calling them now" : "No phone — Lauren not triggered"}
            </span>
          </div>
          <span style="font-size:12px;color:rgba(255,255,255,0.4);">
            ${laurenCalling
              ? `Calling ${lead.phone} · If no answer, Lauren will retry in 30 min and 2 hours`
              : "Lead has no phone number on file"
            }
          </span>
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
              ...(lead.phone ? [{ label: "Phone", value: lead.phone, color: "#22c55e" }] : []),
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
        <tr><td style="padding:0 36px 28px;">
          <a href="https://cybercraft360.com/admin/schedule" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
            View Bookings Dashboard →
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
    subject: `🎯 New Lead: ${lead.name} — ${lead.company}${lead.phone ? (laurenCalling ? " 📞 Lauren calling" : " (no answer yet)") : ""}`,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();

    // Deduplicate using Redis
    const key = `lead:${lead.name?.toLowerCase()}:${lead.company?.toLowerCase()}`;
    const exists = await redis.get(key);
    if (exists) return NextResponse.json({ ok: true, duplicate: true });

    await redis.set(key, "1", { ex: 60 * 60 * 24 * 7 }); // 7 day TTL

    const enriched = { ...lead, capturedAt: new Date().toISOString() };

    // Save lead to Redis list
    const allLeads = await redis.get<any[]>("leads:all") ?? [];
    allLeads.push(enriched);
    await redis.set("leads:all", allLeads);

    // Auto-trigger Lauren if phone number provided
    let laurenCalling = false;
    if (lead.phone) {
      triggerLaurenCall({
        name: lead.name,
        company: lead.company,
        challenge: lead.challenge,
        phone: lead.phone,
      }).catch(err => console.error("Lauren trigger error:", err));
      laurenCalling = true;
    }

    // Send notification email (non-blocking)
    sendLeadEmail(enriched, laurenCalling).catch(err => console.error("Email error:", err));

    import("@/lib/activity").then(({ logActivity }) =>
      logActivity({ type: "lead", title: `New lead — ${lead.name}`, detail: `${lead.company} · ${lead.challenge}`, clientName: lead.name })
    ).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Leads route error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  const leads = await redis.get<any[]>("leads:all") ?? [];
  return NextResponse.json(leads.reverse());
}
