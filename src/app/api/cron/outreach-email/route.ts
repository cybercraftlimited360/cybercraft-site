import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createTransport } from "nodemailer";
import { Enrollment, SentEmail, Sequence, DEFAULT_SEQUENCES, personalizeEmail } from "@/lib/email-sequences";

export const maxDuration = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
const MAX_PER_RUN = 45; // stay under daily limits, humanized

function auth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const qs = req.nextUrl?.searchParams?.get("secret");
  const secret = process.env.CRON_SECRET;
  return auth === `Bearer ${secret}` || qs === secret;
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

  const [enrollments, sequences, sentLog] = await Promise.all([
    redis.get<Enrollment[]>("outreach:enrollments").then(r => r ?? []),
    redis.get<Sequence[]>("outreach:sequences").then(r => r ?? DEFAULT_SEQUENCES),
    redis.get<SentEmail[]>("outreach:sent_emails").then(r => r ?? []),
  ]);

  const now = new Date();
  const due = enrollments.filter(e =>
    e.status === "active" &&
    e.currentStep < (sequences.find(s => s.id === e.sequenceId)?.steps.length ?? 0) &&
    new Date(e.nextSendAt) <= now
  ).slice(0, MAX_PER_RUN);

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
    const htmlBody = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#222;max-width:560px;">
${bodyText.split("\n").map(line => line.trim() === "" ? "<br>" : `<p style="margin:0 0 8px">${line}</p>`).join("")}
<img src="${trackUrl}" width="1" height="1" style="display:none" alt="" />
</div>`;

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

      // Humanized delay between sends: 30-90 seconds
      if (due.indexOf(enrollment) < due.length - 1) {
        await randomDelay(30000, 90000);
      }
    } catch (e) {
      console.error(`[outreach-cron] Failed to send to ${enrollment.leadEmail}:`, String(e).slice(0, 200));
      failed++;
    }
  }

  // Save all updates
  await Promise.all([
    redis.set("outreach:enrollments", updatedEnrollments),
    redis.set("outreach:sent_emails", [...newSentLogs, ...sentLog].slice(0, 2000)),
  ]);

  return NextResponse.json({ ok: true, sent, failed, due: due.length });
}
