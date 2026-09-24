import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

const OWNER_EMAIL = "info@cybercraft360.com";

export interface RealEstateLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  interest: string;
  message: string;
  callbackConsent: boolean;
  source: "talk-to-amy" | "callback" | "demo";
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  createdAt: string;
}

async function sendOwnerNotification(lead: RealEstateLead) {
  const time = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });

  const row = (label: string, value: string, color = "#00d4ff") =>
    value
      ? `<tr style="border-top:1px solid rgba(255,255,255,0.05);">
      <td style="padding:9px 18px;width:120px;vertical-align:top;">
        <span style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.25);">${label}</span>
      </td>
      <td style="padding:9px 18px;vertical-align:top;">
        <span style="font-size:13px;font-weight:600;color:${color};">${value}</span>
      </td>
    </tr>`
      : "";

  const utmParts = Object.entries(lead.utm)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 20px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
  <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></td></tr>
  <tr><td style="padding:28px 32px 16px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.3);">CyberCraft360 · Real Estate</span><br/>
    <span style="font-size:20px;font-weight:700;color:#fff;margin-top:6px;display:block;">🏠 New Real Estate Lead — ${lead.source === "callback" ? "Callback Request" : "Talk to Amy"}</span>
  </td></tr>
  <tr><td style="padding:0 32px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);overflow:hidden;">
      ${row("Name", lead.name, "#ffffff")}
      ${row("Email", lead.email)}
      ${row("Phone", lead.phone)}
      ${row("Role", lead.role, "#a78bfa")}
      ${row("Interest", lead.interest, "#22c55e")}
      ${lead.callbackConsent ? row("Callback", "Consented ✓", "#22c55e") : ""}
      ${lead.message ? row("Message", `"${lead.message}"`, "rgba(255,255,255,.6)") : ""}
      ${utmParts ? row("UTM", utmParts, "rgba(255,255,255,.4)") : ""}
    </table>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <a href="https://cybercraft360.com/admin" style="display:inline-block;padding:12px 24px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:12px;font-weight:700;letter-spacing:.08em;text-decoration:none;text-transform:uppercase;">View in Dashboard →</a>
  </td></tr>
  <tr><td style="padding:14px 32px;border-top:1px solid rgba(255,255,255,.05);">
    <span style="font-size:11px;color:rgba(255,255,255,.15);">CyberCraft360 · Real Estate Landing Page · ${time}</span>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  await sendEmail({
    to: OWNER_EMAIL,
    subject: `🏠 New Real Estate Lead: ${lead.name} — ${lead.role || "Unknown Role"} (${lead.source})`,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, email, phone, role, interest, message, callbackConsent, source, utm } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const lead: RealEstateLead = {
      id: `re_lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      role: String(role || "").trim(),
      interest: String(interest || "").trim(),
      message: String(message || "").trim(),
      callbackConsent: callbackConsent === true,
      source: source || "talk-to-amy",
      utm: utm || {},
      createdAt: new Date().toISOString(),
    };

    // Store in Redis
    const existing = await redis.get<RealEstateLead[]>("realestate:leads") ?? [];
    await redis.set("realestate:leads", [lead, ...existing]);

    // Notify owner (non-blocking)
    sendOwnerNotification(lead).catch(err =>
      console.error("[realestate/lead] Owner notification error:", err)
    );

    // If callback consent given and phone provided, trigger Amy call
    if (lead.callbackConsent && lead.phone) {
      const baseUrl = req.nextUrl.origin;
      const context = `Real estate lead from /real-estate landing page. Name: ${lead.name}. Role: ${lead.role || "real estate professional"}. Interest: ${lead.interest || "general inquiry"}. ${lead.message ? `Message: ${lead.message}` : ""}`;
      fetch(`${baseUrl}/api/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": Buffer.from(`cc360:${process.env.ADMIN_SECRET}:v2`).toString("base64"),
        },
        body: JSON.stringify({
          phone: lead.phone,
          name: lead.name,
          company: lead.role || "Real Estate",
          challenge: context,
        }),
      }).catch(err => console.error("[realestate/lead] Amy call error:", err));
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err) {
    console.error("[realestate/lead] Error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
