import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createTransport } from "nodemailer";
import { Enrollment, SentEmail, Sequence, DEFAULT_SEQUENCES, personalizeEmail } from "@/lib/email-sequences";

export const maxDuration = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

// Warmup ramp: gradually increase daily volume to build sender reputation
// Week 1: 20/day (â‰ˆ3/run), Week 2: 50/day (â‰ˆ8/run), Week 3: 100/day (â‰ˆ16/run), Week 4+: 150/day (25/run)
function getMaxPerRun(): number {
  const startKey = "outreach:warmup_start";
  // warmup_start is set on first send; calculated synchronously using a module-level cache
  return 25; // overridden below after async lookup
}

async function getDailyLimit(redis: any): Promise<number> {
  const override = await redis.get<number>("outreach:daily_limit_override");
  if (override && override > 0) return override; // admin can set custom limit anytime

  const start = await redis.get<string>("outreach:warmup_start");
  if (!start) {
    await redis.set("outreach:warmup_start", new Date().toISOString());
    return 4; // first run: very conservative
  }
  const daysSinceStart = Math.floor((Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < 7)  return 10;   // Week 1: very gentle (new domain)
  if (daysSinceStart < 14) return 20;   // Week 2
  if (daysSinceStart < 21) return 30;   // Week 3
  if (daysSinceStart < 28) return 40;   // Week 4
  if (daysSinceStart < 35) return 60;   // Week 5
  if (daysSinceStart < 42) return 80;   // Week 6
  if (daysSinceStart < 56) return 100;  // Weeks 7-8
  return 150;                            // Week 9+: full speed
}

// Track how many emails sent today (resets at midnight UTC)
async function getTodaySentCount(redis: any): Promise<number> {
  const todayKey = `outreach:sent_today:${new Date().toISOString().slice(0, 10)}`;
  return await redis.get<number>(todayKey) ?? 0;
}

async function incrementTodaySent(redis: any, count: number): Promise<void> {
  const todayKey = `outreach:sent_today:${new Date().toISOString().slice(0, 10)}`;
  const current = await redis.get<number>(todayKey) ?? 0;
  await redis.set(todayKey, current + count, { ex: 86400 }); // expires after 24h
}

function auth(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.get("authorization");
  const qs = req.nextUrl?.searchParams?.get("secret");
  const adminToken = req.headers.get("x-admin-token");
  // Accept cron secret or admin token
  if (cronSecret && (authHeader === `Bearer ${cronSecret}` || qs === cronSecret)) return true;
  if (adminSecret && adminToken === Buffer.from(`cc360:${adminSecret}:v2`).toString("base64")) return true;
  return false;
}

function buildTransport() {
  const host = process.env.OUTREACH_SMTP_HOST ?? "smtp.gmail.com";
  const port = parseInt(process.env.OUTREACH_SMTP_PORT ?? "465");
  const user = process.env.OUTREACH_EMAIL;
  const pass = process.env.OUTREACH_EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Random delay within range to humanize sending
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise(r => setTimeout(r, ms));
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const transport = buildTransport();
  if (!transport) {
    return NextResponse.json({ ok: false, error: "OUTREACH_EMAIL and OUTREACH_EMAIL_PASSWORD not configured" });
  }

  const fromEmail = process.env.OUTREACH_EMAIL!;
  const fromName = process.env.OUTREACH_NAME ?? "Saad";

  const [enrollments, sequences, sentLog, dailyLimit, todaySent] = await Promise.all([
    redis.get<Enrollment[]>("outreach:enrollments").then(r => r ?? []),
    redis.get<Sequence[]>("outreach:sequences").then(r => r ?? DEFAULT_SEQUENCES),
    redis.get<SentEmail[]>("outreach:sent_emails").then(r => r ?? []),
    getDailyLimit(redis),
    getTodaySentCount(redis),
  ]);

  const remainingToday = Math.max(0, dailyLimit - todaySent);
  const perRunLimit = Math.min(25, remainingToday); // never more than 25 per run

  if (remainingToday <= 0) {
    return NextResponse.json({ ok: true, sent: 0, message: `Daily limit reached (${dailyLimit}/day warmup cap)` });
  }

  // Basic email format validation
  function isValidEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const parts = email.trim().split("@");
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || local.length > 64) return false;
    if (!domain || !domain.includes(".")) return false;
    const tld = domain.split(".").pop() ?? "";
    if (tld.length < 2 || tld.length > 8) return false;
    if (!/^[a-zA-Z0-9._%+\-]+$/.test(local)) return false;
    return true;
  }

  const now = new Date();
  const due = enrollments.filter(e =>
    e.status === "active" &&
    isValidEmail(e.leadEmail) &&
    e.currentStep < (sequences.find(s => s.id === e.sequenceId)?.steps.length ?? 0) &&
    new Date(e.nextSendAt) <= now
  ).slice(0, perRunLimit);

  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No emails due" });
  }

  const newSentLogs: SentEmail[] = [];
  const updatedEnrollments = [...enrollments];
  let sent = 0;
  let failed = 0;

  for (const enrollment of due) {
    const seq = sequences.find(s => s.id === enrollment.sequenceId);
    if (!seq) continue;
    const step = seq.steps[enrollment.currentStep];
    if (!step) continue;

    const subject = personalizeEmail(step.subject, enrollment);
    const bodyText = personalizeEmail(step.body, enrollment);

    // Plain text + HTML with open tracking pixel
    const trackUrl = `${SITE}/api/track/open?id=${enrollment.id}&step=${enrollment.currentStep}`;

    const lines = bodyText.split("\n");
    // Detect signature block (lines after "Best," or "Best regards,")
    const sigIdx = lines.findIndex(l => /^(best|regards|warm regards|sincerely),?\s*$/i.test(l.trim()));
    const bodyLines = sigIdx >= 0 ? lines.slice(0, sigIdx) : lines;
    const sigLines = sigIdx >= 0 ? lines.slice(sigIdx) : [];

    const renderBodyLines = bodyLines.map(line =>
      line.trim() === ""
        ? `<tr><td style="padding:6px 0"></td></tr>`
        : `<tr><td style="padding:1px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.75;color:#1a1a1a">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#1a1a1a;text-decoration:underline">${url}</a>`)}</td></tr>`
    ).join("");

    const renderSigLines = sigLines.map((line, i) =>
      line.trim() === ""
        ? `<tr><td style="padding:3px 0"></td></tr>`
        : i === 0
          ? `<tr><td style="padding-top:18px;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.6;color:#1a1a1a">${line}</td></tr>`
          : `<tr><td style="font-family:${i === 1 ? "Georgia,'Times New Roman',Times,serif;font-size:15px;font-weight:bold" : "'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#555;letter-spacing:0.02em"};line-height:1.6;color:${i === 1 ? "#1a1a1a" : "#555"}">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#555;text-decoration:none">${url}</a>`)}</td></tr>`
    ).join("");

    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;margin:0 auto;padding:40px 24px">
  <tbody>
    ${renderBodyLines}
    ${renderSigLines}
    <tr><td style="padding-top:24px;border-top:1px solid #e8e8e8;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#aaa;letter-spacing:0.04em">CYBERCRAFT360 &nbsp;Â·&nbsp; <a href="${SITE}" style="color:#aaa;text-decoration:none">${SITE.replace("https://","")}</a></td></tr>
  </tbody>
</table>
<img src="${trackUrl}" width="1" height="1" style="display:none" alt="" />
</body></html>`;

    try {
      await transport.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: enrollment.leadEmail,
        subject,
        text: bodyText,
        html: htmlBody,
        headers: {
          "List-Unsubscribe": `<${SITE}/unsubscribe?id=${enrollment.id}>`,
          "X-Mailer": "CyberCraft360",
        },
      });

      // Log sent email
      const logEntry: SentEmail = {
        id: `sent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        enrollmentId: enrollment.id,
        leadId: enrollment.leadId,
        leadName: enrollment.leadName,
        leadEmail: enrollment.leadEmail,
        step: enrollment.currentStep,
        subject,
        sentAt: now.toISOString(),
        opened: false,
      };
      newSentLogs.push(logEntry);

      // Advance enrollment
      const nextStep = enrollment.currentStep + 1;
      const hasMore = nextStep < seq.steps.length;
      const nextDelay = hasMore ? seq.steps[nextStep].day - step.day : 0;
      const nextSendAt = hasMore ? addDays(now, nextDelay).toISOString() : now.toISOString();

      const idx = updatedEnrollments.findIndex(e => e.id === enrollment.id);
      if (idx !== -1) {
        updatedEnrollments[idx] = {
          ...enrollment,
          currentStep: nextStep,
          nextSendAt,
          status: hasMore ? "active" : "completed",
          sentSteps: [...enrollment.sentSteps, enrollment.currentStep],
        };
      }

      sent++;
      console.log(`[outreach-cron] Sent step ${enrollment.currentStep} to ${enrollment.leadEmail}`);

      // Humanized delay between sends: 3-8 seconds (25 emails Ã— 8s â‰ˆ 200s, within 300s limit)
      if (due.indexOf(enrollment) < due.length - 1) {
        await randomDelay(3000, 8000);
      }
    } catch (e: any) {
      const errStr = String(e).toLowerCase();
      // Hard bounce codes â€” permanently unsubscribe so we never retry
      const isHardBounce = errStr.includes("550") || errStr.includes("551") || errStr.includes("552") ||
        errStr.includes("553") || errStr.includes("554") || errStr.includes("user unknown") ||
        errStr.includes("no such user") || errStr.includes("does not exist") ||
        errStr.includes("invalid address") || errStr.includes("address rejected");
      if (isHardBounce) {
        const idx = updatedEnrollments.findIndex(e => e.id === enrollment.id);
        if (idx !== -1) updatedEnrollments[idx] = { ...updatedEnrollments[idx], status: "unsubscribed" };
        console.log(`[outreach-cron] Hard bounce â€” removed ${enrollment.leadEmail}`);
      } else {
        console.error(`[outreach-cron] Failed to send to ${enrollment.leadEmail}:`, String(e).slice(0, 200));
      }
      failed++;
    }
  }

  // Save all updates
  await Promise.all([
    redis.set("outreach:enrollments", updatedEnrollments),
    redis.set("outreach:sent_emails", [...newSentLogs, ...sentLog].slice(0, 2000)),
    incrementTodaySent(redis, sent),
  ]);

  // Send daily summary report to owner if any emails went out
  if (sent > 0) {
    try {
      const OWNER_EMAIL = "info@cybercraft360.com";
      const rows = newSentLogs.map(l =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${l.leadName}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#555">${l.leadEmail}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#555">Step ${l.step + 1}</td><td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:#888;font-size:12px">${l.subject}</td></tr>`
      ).join("");

      const reportHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f9f9">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
  <tr><td style="background:#0f172a;padding:24px 32px">
    <span style="color:#fff;font-size:18px;font-weight:600">CyberCraft360</span>
    <span style="color:#64748b;font-size:13px;margin-left:12px">Daily Outreach Report</span>
  </td></tr>
  <tr><td style="padding:28px 32px">
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#0f172a">${sent} email${sent === 1 ? "" : "s"} sent</p>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px">${new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })} &nbsp;Â·&nbsp; ${failed > 0 ? `${failed} failed` : "0 failures"} &nbsp;Â·&nbsp; Daily cap: ${dailyLimit}</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb">Business</th>
        <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb">Email</th>
        <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb">Step</th>
        <th style="padding:8px 12px;text-align:left;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb">Subject</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8">Sent from info@cybercraft360.com &nbsp;Â·&nbsp; <a href="https://cybercraft360.com/admin" style="color:#94a3b8">View Admin</a></p>
  </td></tr>
</table>
</body></html>`;

      await transport.sendMail({
        from: `CyberCraft360 Bot <${fromEmail}>`,
        to: OWNER_EMAIL,
        subject: `[Outreach] ${sent} email${sent === 1 ? "" : "s"} sent today â€” ${new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" })}`,
        text: `${sent} outreach email(s) sent today.\n\n${newSentLogs.map(l => `â€¢ ${l.leadName} <${l.leadEmail}> â€” Step ${l.step + 1}: ${l.subject}`).join("\n")}\n\nFailed: ${failed}. Daily cap: ${dailyLimit}.`,
        html: reportHtml,
      });
    } catch (e) {
      console.error("[outreach-cron] Failed to send owner report:", String(e).slice(0, 200));
    }
  }

  return NextResponse.json({ ok: true, sent, failed, due: due.length, dailyLimit, todaySent: todaySent + sent });
}

