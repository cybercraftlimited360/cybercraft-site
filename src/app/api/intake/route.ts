import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const NOTIFY_EMAIL = "cybercraftlimited@gmail.com";

async function saveIntake(intake: object) {
  try {
    const all = await redis.get<object[]>("intakes:all") ?? [];
    all.push(intake);
    await redis.set("intakes:all", all);
  } catch (err) {
    console.error("Redis intake save error:", err);
  }
}

function scoreServices(form: Record<string, unknown>): string[] {
  const goals = (form.goals as string[]) || [];
  const pain = (form.painPoints as string[]) || [];
  const services = (form.servicesInterested as string[]) || [];
  const recs: Set<string> = new Set(services);

  if (pain.includes("Missing calls & losing leads") || goals.includes("Book more appointments automatically"))
    recs.add("AI Phone Agent");
  if (pain.includes("High customer service volume") || goals.includes("Automate customer support 24/7"))
    recs.add("Custom AI Chatbot");
  if (goals.includes("Generate and qualify leads on autopilot") || pain.includes("Inconsistent sales outreach"))
    recs.add("AI Sales Agent");
  if (pain.includes("Too much time on repetitive admin") || goals.includes("Reduce team workload & overhead"))
    recs.add("Workflow & CRM Automation");
  if (pain.includes("Slow content creation") || goals.includes("Speed up content & marketing output"))
    recs.add("AI Content Engine");
  if (goals.includes("Get real-time business analytics") || pain.includes("No visibility into business performance"))
    recs.add("AI Analytics Dashboard");
  if (goals.includes("Protect my business from cyber threats") || pain.includes("Security & compliance concerns"))
    recs.add("AI Cybersecurity");

  return [...recs].slice(0, 5);
}

async function sendIntakeEmail(form: Record<string, unknown>) {

  const recommendations = scoreServices(form);
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
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</span><br/>
        <span style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;display:block;">📋 New Client Intake Received</span>
      </td>
      <td align="right" valign="top">
        <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.25);font-size:11px;font-weight:700;color:#00d4ff;letter-spacing:0.1em;">NEW INTAKE</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>

  <!-- Contact -->
  <tr><td style="padding:20px 36px 8px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Contact</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
      ${row("Name", String(form.name))}
      ${row("Email", String(form.email))}
      ${row("Phone", String(form.phone || "Not provided"))}
      ${row("Prefers", String(form.preferredContact))}
    </table>
  </td></tr>

  <!-- Business -->
  <tr><td style="padding:8px 36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Business</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
      ${row("Company", String(form.businessName), "#ffffff")}
      ${row("Industry", String(form.industry), "#a78bfa")}
      ${row("Website", String(form.website || "—"), "#00d4ff")}
      ${row("Team Size", String(form.teamSize), "#ffffff")}
      ${row("Years Active", String(form.yearsInBusiness || "—"), "#ffffff")}
    </table>
  </td></tr>

  <!-- Pain points -->
  <tr><td style="padding:8px 36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Pain Points</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${form.biggestChallenge ? "12px" : "0"};">
        ${((form.painPoints as string[]) || []).map(p => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);font-size:11px;font-weight:600;color:#f87171;">${p}</span>`).join("")}
      </div>
      ${form.biggestChallenge ? `<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;font-style:italic;">"${form.biggestChallenge}"</p>` : ""}
    </div>
  </td></tr>

  <!-- Goals -->
  <tr><td style="padding:8px 36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Goals</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${form.whatSuccess ? "12px" : "0"};">
        ${((form.goals as string[]) || []).map(g => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);font-size:11px;font-weight:600;color:#22c55e;">${g}</span>`).join("")}
      </div>
      ${form.whatSuccess ? `<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;font-style:italic;">"${form.whatSuccess}"</p>` : ""}
    </div>
  </td></tr>

  <!-- Services requested -->
  <tr><td style="padding:8px 36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">Services Requested</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;display:flex;flex-wrap:wrap;gap:6px;">
      ${((form.servicesInterested as string[]) || []).map(s => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.25);font-size:11px;font-weight:600;color:#00d4ff;">${s}</span>`).join("")}
    </div>
  </td></tr>

  <!-- AI Recommendations -->
  <tr><td style="padding:8px 36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);">🤖 AI-Recommended Services</span>
  </td></tr>
  <tr><td style="padding:0 36px 16px;">
    <div style="background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:14px 20px;display:flex;flex-wrap:wrap;gap:6px;">
      ${recommendations.map(r => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.35);font-size:11px;font-weight:600;color:#a78bfa;">${r}</span>`).join("")}
    </div>
  </td></tr>

  <!-- Budget + Timeline -->
  <tr><td style="padding:0 36px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
      ${row("Monthly Budget", String(form.budget), "#f59e0b")}
      ${row("Timeline", String(form.timeline), "#22c55e")}
      ${row("Existing Tools", ((form.existingTools as string[]) || []).join(", ") || "—", "rgba(255,255,255,0.6)")}
    </table>
  </td></tr>

  ${form.additionalNotes ? `
  <tr><td style="padding:0 36px 20px;">
    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:14px 20px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.25);">Additional Notes</p>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;font-style:italic;">"${form.additionalNotes}"</p>
    </div>
  </td></tr>` : ""}

  <tr><td style="padding:0 36px 28px;">
    <a href="https://cybercraft360.com/book" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
      Book Strategy Call with ${form.name?.toString().split(" ")[0]} →
    </a>
  </td></tr>

  <tr><td style="padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05);">
    <span style="font-size:11px;color:rgba(255,255,255,0.15);">CyberCraft360 · Client Intake · ${time}</span>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  const { sendEmail } = await import("@/lib/mailer");
  await sendEmail({
    to: NOTIFY_EMAIL,
    subject: `📋 New Intake: ${form.name} — ${form.businessName} (${form.industry})`,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();

    if (!form.name || !form.email || !form.businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = { ...form, submittedAt: new Date().toISOString(), recommendations: scoreServices(form) };

    await saveIntake(record);
    sendIntakeEmail(form).catch(err => console.error("Intake email error:", err));

    // Also fire lead notification so it shows up in your leads dashboard
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        company: form.businessName,
        challenge: (form.painPoints as string[])?.join(", ") || form.biggestChallenge || "Intake form submission",
        source: "Intake Form",
        ...(form.phone ? { phone: form.phone } : {}),
      }),
    }).catch(() => {});

    return NextResponse.json({ ok: true, recommendations: scoreServices(form) });
  } catch (err) {
    console.error("Intake route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
