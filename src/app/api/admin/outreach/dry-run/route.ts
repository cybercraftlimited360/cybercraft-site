import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { DEFAULT_SEQUENCES, Enrollment, personalizeEmail } from "@/lib/email-sequences";

// Dry-run: shows exactly what would be sent today without sending anything.
// Returns selected leads, validation results, proposed email content, budget status.
// NEVER sends email. NEVER writes to Redis.

function auth(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const token = req.headers.get("x-admin-token");
  return adminSecret && token === Buffer.from(`cc360:${adminSecret}:v2`).toString("base64");
}

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|bmp|tiff?)$/i;
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (IMAGE_EXT.test(email.toLowerCase())) return false; // reject image filenames scraped as emails
  const parts = email.trim().split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64) return false;
  if (!domain || !domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  return tld.length >= 2 && tld.length <= 8 && /^[a-zA-Z0-9._%+\-]+$/.test(local);
}

const CONSUMER_DOMAINS = new Set(["gmail.com","yahoo.com","hotmail.com","outlook.com","aol.com","icloud.com","live.com","msn.com","me.com","mac.com","protonmail.com"]);
function isBusinessEmail(email: string): boolean {
  if (!isValidEmail(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && !CONSUMER_DOMAINS.has(domain);
}

async function getDailyLimit(): Promise<number> {
  const override = await redis.get<number>("outreach:daily_limit_override");
  if (override && override > 0) return Math.min(override, 100);
  const start = await redis.get<string>("outreach:warmup_start");
  if (!start) return 25;
  const days = Math.floor((Date.now() - new Date(start).getTime()) / 86400000);
  if (days < 7) return 25;
  if (days < 14) return 50;
  return 100;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [enrollments, sequences, sentLog, allLeads, dailyLimit, todaySent, googleSpend] = await Promise.all([
    redis.get<Enrollment[]>("outreach:enrollments").then(r => r ?? []),
    redis.get<any[]>("outreach:sequences").then(r => r ?? DEFAULT_SEQUENCES),
    redis.get<any[]>("outreach:sent_emails").then(r => r ?? []),
    redis.get<any[]>("outreach:leads").then(r => r ?? []),
    getDailyLimit(),
    (async () => {
      const key = `outreach:sent_today:${new Date().toISOString().slice(0, 10)}`;
      return await redis.get<number>(key) ?? 0;
    })(),
    redis.get<number>("outreach:google_api_spend").then(r => r ?? 0),
  ]);

  const remaining = Math.max(0, dailyLimit - todaySent);
  const now = new Date();

  // ── EXISTING LEADS INVENTORY ─────────────────────────────────────────────
  const realEstateLeads = allLeads.filter((l: any) => l.industry === "Real Estate" || !l.industry);
  const otherLeads = allLeads.filter((l: any) => l.industry && l.industry !== "Real Estate");
  const enrolledIds = new Set(enrollments.filter(e => e.status === "active").map(e => e.leadId));
  const uncontactedRE = realEstateLeads.filter((l: any) => !l.messaged && l.email && !enrolledIds.has(l.id));
  const enrolledRE = enrollments.filter(e =>
    realEstateLeads.some((l: any) => l.id === e.leadId) || e.leadIndustry === "Real Estate"
  );

  // ── EMAILS DUE TODAY ─────────────────────────────────────────────────────
  const allDue = enrollments.filter(e =>
    e.status === "active" &&
    isValidEmail(e.leadEmail) &&
    e.currentStep < (sequences.find((s: any) => s.id === e.sequenceId)?.steps.length ?? 0) &&
    new Date(e.nextSendAt) <= now
  );
  const newLeadsDue = allDue.filter(e => e.currentStep === 0).slice(0, remaining);
  const followUpsDue = allDue.filter(e => e.currentStep > 0).slice(0, 100);
  const totalDue = [...newLeadsDue, ...followUpsDue];

  // ── PROPOSED EMAIL PREVIEWS (first 5) ────────────────────────────────────
  const previews = totalDue.slice(0, 5).map(enrollment => {
    const seq = sequences.find((s: any) => s.id === enrollment.sequenceId);
    const step = seq?.steps[enrollment.currentStep];
    if (!step) return null;
    return {
      leadName: enrollment.leadName,
      leadEmail: enrollment.leadEmail,
      leadIndustry: enrollment.leadIndustry,
      leadCity: enrollment.leadCity,
      step: enrollment.currentStep + 1,
      subject: personalizeEmail(step.subject, enrollment),
      bodyPreview: personalizeEmail(step.body, enrollment).slice(0, 300) + "...",
      validEmail: isValidEmail(enrollment.leadEmail),
      businessEmail: isBusinessEmail(enrollment.leadEmail),
      duplicateCheck: enrollments.filter(e => e.leadEmail === enrollment.leadEmail && e.status === "active").length === 1 ? "PASS" : "DUPLICATE",
      suppressionCheck: enrollment.status === "active" ? "PASS" : "SUPPRESSED",
    };
  }).filter(Boolean);

  // ── VALIDATION SUMMARY ───────────────────────────────────────────────────
  const validationResults = totalDue.map(e => ({
    email: e.leadEmail,
    validFormat: isValidEmail(e.leadEmail),
    businessEmail: isBusinessEmail(e.leadEmail),
    status: e.status,
    step: e.currentStep,
  }));
  const passCount = validationResults.filter(r => r.validFormat && r.businessEmail && r.status === "active").length;
  const rejectCount = validationResults.length - passCount;

  // ── SUPPRESSION STATS ────────────────────────────────────────────────────
  const unsubscribed = enrollments.filter(e => e.status === "unsubscribed");
  const replied = enrollments.filter(e => e.status === "replied");
  const completed = enrollments.filter(e => e.status === "completed");

  // ── BUDGET STATUS ────────────────────────────────────────────────────────
  const budgetRemaining = Math.max(0, 50 - googleSpend);
  const start = await redis.get<string>("outreach:warmup_start");
  const daysSinceStart = start ? Math.floor((Date.now() - new Date(start).getTime()) / 86400000) : 0;
  const rampWeek = daysSinceStart < 7 ? "Week 1 (25/day max)" : daysSinceStart < 14 ? "Week 2 (50/day max)" : daysSinceStart < 21 ? "Week 3 (100/day max)" : "Week 4+ (200/day PERMANENT CEILING)";
  const nextRampDate = daysSinceStart < 7 ? "Sep 22, 2026" : daysSinceStart < 14 ? "Sep 29, 2026" : daysSinceStart < 21 ? "Oct 6, 2026" : "N/A — at permanent ceiling";

  return NextResponse.json({
    dryRun: true,
    timestamp: now.toISOString(),
    notice: "NO EMAILS SENT. NO DATA WRITTEN. Read-only dry run.",

    // ── Email schedule ──
    schedule: {
      currentDailyLimit: dailyLimit,
      emailsSentToday: todaySent,
      remainingCapacity: remaining,
      wouldSendToday: totalDue.length,
      newFirstContact: newLeadsDue.length,
      followUps: followUpsDue.length,
      rampWeek,
      nextRampDate,
      permanentCeiling: "100 emails/day from Sep 29, 2026 onward — within Google free tier",
    },

    // ── Lead inventory ──
    leadInventory: {
      totalLeadsInDB: allLeads.length,
      realEstateLeads: realEstateLeads.length,
      otherIndustryLeads: otherLeads.length,
      uncontactedRealEstateWithEmail: uncontactedRE.length,
      activeEnrollmentsRealEstate: enrolledRE.length,
      activeEnrollmentsTotal: enrollments.filter(e => e.status === "active").length,
      completed: completed.length,
      unsubscribed: unsubscribed.length,
      replied: replied.length,
    },

    // ── Validation ──
    validation: {
      totalDueForSend: totalDue.length,
      wouldPassValidation: passCount,
      wouldBeRejected: rejectCount,
      suppressedOnRecord: unsubscribed.length,
    },

    // ── Email previews ──
    emailPreviews: previews,

    // ── Budget ──
    budget: {
      googleApiSpend: `$${googleSpend.toFixed(2)}`,
      budgetCap: "$50.00",
      budgetRemaining: `$${budgetRemaining.toFixed(2)}`,
      budgetStatus: budgetRemaining <= 0 ? "EXHAUSTED" : budgetRemaining < 10 ? "LOW" : "OK",
      estimatedLeadsFromRemainingBudget: Math.floor(budgetRemaining / 0.057),
    },

    // ── Suppression ──
    suppression: {
      unsubscribedCount: unsubscribed.length,
      mechanism: "List-Unsubscribe header on every email + /api/unsubscribe endpoint + hard bounce auto-removal",
      globalSuppression: "Yes — unsubscribed status prevents all future sends across all sequences",
    },

    // ── Lead source priority ──
    leadSourcePriority: [
      "1. Previously enrolled real estate leads (follow-up sequences)",
      "2. Existing uncontacted real estate leads in DB (auto-enroll on next scrape run)",
      "3. Fresh real estate leads via Google Maps (only when queue is below 2x daily limit)",
      "4. Paid API calls only when existing stock is insufficient (hard cap: $50 total)",
    ],

    // ── Production readiness ──
    productionReadiness: {
      emailTransportConfigured: !!(process.env.OUTREACH_EMAIL && process.env.OUTREACH_EMAIL_PASSWORD),
      warmupStartSet: !!start,
      warmupStartDate: start ?? "NOT SET — will be set on first send",
      dryRunRecommendation: totalDue.length > 0
        ? `READY — ${totalDue.length} emails queued. Review previews above, then trigger /api/cron/outreach-email to begin.`
        : `NO EMAILS DUE — Enroll leads first via /api/admin/outreach/email/enroll or wait for lead-scrape cron.`,
    },
  });
}
