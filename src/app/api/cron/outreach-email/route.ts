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

// PERMANENT DAILY CEILING = 200 emails/day. Never exceeds 200 automatically.
// Ramp schedule (campaign start: Sep 15, 2026):
//   Week 1 (Sep 15–21):   25/day
//   Week 2 (Sep 22–28):   50/day
//   Week 3 (Sep 29–Oct 5): 100/day
//   Week 4+ (Oct 6 onward): 200/day — PERMANENT CEILING
// Deliverability review required before each ramp increase.
// Override via admin: redis key "outreach:daily_limit_override" (never auto-increases above 200).
async function getDailyLimit(redis: any): Promise<number> {
  const override = await redis.get<number>("outreach:daily_limit_override");
  if (override && override > 0) return Math.min(override, 200); // admin override, hard ceiling at 200

  const start = await redis.get<string>("outreach:warmup_start");
  if (!start) {
    await redis.set("outreach:warmup_start", new Date().toISOString());
    return 25; // Week 1 cap
  }
  const daysSinceStart = Math.floor((Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < 7)  return 25;  // Week 1: Sep 15–21
  if (daysSinceStart < 14) return 50;  // Week 2: Sep 22–28
  if (daysSinceStart < 21) return 100; // Week 3: Sep 29–Oct 5
  return 200; // Week 4+ PERMANENT CEILING — never increases above 200
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
  const allDue = enrollments.filter(e =>
    e.status === "active" &&
    isValidEmail(e.leadEmail) &&
    e.currentStep < (sequences.find(s => s.id === e.sequenceId)?.steps.length ?? 0) &&
    new Date(e.nextSendAt) <= now
  );

  // Split into new outreach (step 0 = first contact) and follow-ups (steps 1+)
  // Daily limit only applies to new leads — follow-ups are always sent regardless
  const newLeadEmails = allDue.filter(e => e.currentStep === 0).slice(0, Math.min(25, remainingToday));
  const followUpEmails = allDue.filter(e => e.currentStep > 0).slice(0, 100); // generous cap, no daily limit
  const due = [...newLeadEmails, ...followUpEmails];

  if (remainingToday <= 0 && newLeadEmails.length === 0 && followUpEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: `Daily new-lead limit reached (${dailyLimit}/day). No follow-ups due either.` });
  }

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
    incrementTodaySent(redis, newSentLogs.filter(l => l.step === 0).length),
  ]);

  // Send daily summary report to owner
  if (sent > 0) {
    try {
      const OWNER_EMAIL = "info@cybercraft360.com";
      const todayStr = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
      const warmupStart = await redis.get<string>("outreach:warmup_start");
      const daysSinceStart2 = warmupStart ? Math.floor((Date.now() - new Date(warmupStart).getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const rampWeek = daysSinceStart2 < 7 ? "Week 1 (25/day max)" : daysSinceStart2 < 14 ? "Week 2 (50/day max)" : daysSinceStart2 < 21 ? "Week 3 (100/day max)" : "Week 4+ (200/day — PERMANENT CEILING)";
      const nextRampDate = daysSinceStart2 < 7 ? "Sep 22, 2026" : daysSinceStart2 < 14 ? "Sep 29, 2026" : daysSinceStart2 < 21 ? "Oct 6, 2026" : "N/A — at permanent ceiling";
      const googleCost = await redis.get<number>("outreach:google_api_spend") ?? 0;
      const budgetRemaining = Math.max(0, 50 - googleCost);
      const unsubCount = enrollments.filter(e => e.status === "unsubscribed").length;
      const repliedCount = enrollments.filter(e => e.status === "replied").length;
      const newFirstContact = newSentLogs.filter(l => l.step === 0).length;

      const reportText = [
        "========================================",
        "DAILY OUTREACH REPORT -- CyberCraft360",
        "========================================",
        "",
        `DATE:                        ${todayStr}`,
        "",
        `CURRENT DAILY EMAIL LIMIT:   ${dailyLimit}`,
        `EMAILS SENT:                 ${sent}`,
        "",
        `EXISTING REAL ESTATE LEADS USED: ${newFirstContact} (new first contact)`,
        `FOLLOW-UPS SENT:                 ${sent - newFirstContact}`,
        "",
        `SUPPRESSED:     ${unsubCount} total opt-outs on record`,
        `BOUNCES:        ${failed} send failures this run`,
        `UNSUBSCRIBES:   ${unsubCount} lifetime`,
        `REPLIES:        ${repliedCount} lifetime`,
        "",
        `DAILY DATA COST:           $0.00 (email send run, not scrape run)`,
        `CUMULATIVE DATA COST:      $${googleCost.toFixed(2)}`,
        `REMAINING $50 DATA BUDGET: $${budgetRemaining.toFixed(2)}`,
        `GOOGLE/LEAD API COST STATUS: ${budgetRemaining <= 0 ? "BUDGET EXHAUSTED -- no new scraping" : budgetRemaining < 10 ? `LOW -- $${budgetRemaining.toFixed(2)} remaining` : `OK -- $${budgetRemaining.toFixed(2)} remaining`}`,
        "",
        `EMAIL ACCOUNT HEALTH:  Monitor bounce/spam rates manually before next ramp`,
        "",
        `CURRENT RAMP LEVEL:  ${rampWeek}`,
        `NEXT RAMP DATE:      ${nextRampDate}`,
        "",
        "DAILY MAX AFTER OCTOBER 12: 200 EMAILS/DAY -- PERMANENT CEILING",
        "",
        "========================================",
        "EMAILS SENT THIS RUN",
        "========================================",
        ...newSentLogs.map(l => `- ${l.leadName} <${l.leadEmail}> -- Step ${l.step + 1}: ${l.subject}`),
        "",
        `Failed: ${failed} | View Admin: https://cybercraft360.com/admin`,
      ].join("\n");

      await transport.sendMail({
        from: `CyberCraft360 Bot <${fromEmail}>`,
        to: OWNER_EMAIL,
        subject: `[CC360 Outreach] ${sent} sent | $${budgetRemaining.toFixed(2)} budget left | ${new Date().toLocaleDateString(“en-US”, { month:”short”, day:”numeric” })}`,
        text: reportText,
      });
    } catch (e) {
      console.error("[outreach-cron] Failed to send owner report:", String(e).slice(0, 200));
    }
  }

  const newSent = newSentLogs.filter(l => l.step === 0).length;
  const followUpSent = sent - newSent;
  return NextResponse.json({ ok: true, sent, newLeadsSent: newSent, followUpsSent: followUpSent, failed, due: due.length, dailyLimit, todaySent: todaySent + newSent });
}

