import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// Adjust score weights based on which lead flags led to a conversion
// This is the self-learning loop: if leads with "No website" keep converting, boost that weight
async function adjustWeights(lead: any, converted: boolean) {
  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};
  const learningLog = await redis.get<any[]>("outreach:learning_log") ?? [];

  // Log this outcome
  learningLog.push({
    leadId: lead.id,
    leadName: lead.name,
    industry: lead.industry,
    flags: lead.flags ?? [],
    score: lead.score,
    converted,
    loggedAt: new Date().toISOString(),
  });
  await redis.set("outreach:learning_log", learningLog.slice(0, 1000));

  // Compute flag-to-conversion correlation over last 100 outcomes
  const recent = learningLog.slice(-100);
  const flagStats: Record<string, { total: number; converted: number }> = {};
  for (const entry of recent) {
    for (const flag of (entry.flags ?? [])) {
      if (!flagStats[flag]) flagStats[flag] = { total: 0, converted: 0 };
      flagStats[flag].total++;
      if (entry.converted) flagStats[flag].converted++;
    }
  }

  // Map flags to weight keys
  const flagToWeight: Record<string, string> = {
    "No website": "noWebsite",
    "Open 24/7": "open24h",
    "Missed call signals": "missedCallSignal",
    "Very few reviews": "lowReviews20",
  };

  // Adjust weights: boost flags with high conversion rate, reduce if low
  const DEFAULT_WEIGHTS: Record<string, number> = {
    noWebsite: 20, open24h: 20, missedCallSignal: 8, lowReviews20: 30,
  };

  for (const [flag, key] of Object.entries(flagToWeight)) {
    const stat = flagStats[flag];
    if (!stat || stat.total < 3) continue; // need at least 3 data points

    const convRate = stat.converted / stat.total;
    const defaultVal = DEFAULT_WEIGHTS[key] ?? 10;
    // Scale: 0% conv → half default weight; 100% conv → 2x default weight
    const adjusted = Math.round(defaultVal * (0.5 + convRate * 1.5));
    weights[key] = Math.max(5, Math.min(60, adjusted));
  }

  await redis.set("outreach:score_weights", weights);
  return { weights, flagStats };
}

// POST — mark a lead as converted or not (outcome tracking)
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId, converted } = await req.json() as { leadId: string; converted: boolean };

  const leads = await redis.get<any[]>("outreach:leads") ?? [];
  const lead = leads.find((l: any) => l.id === leadId);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Update lead's converted status
  const updated = leads.map((l: any) => l.id === leadId ? { ...l, converted, convertedAt: new Date().toISOString() } : l);
  await redis.set("outreach:leads", updated);

  // Run self-learning weight adjustment
  const { weights, flagStats } = await adjustWeights(lead, converted);

  return NextResponse.json({ ok: true, leadId, converted, updatedWeights: weights, flagStats });
}

// GET — return current learned weights + stats
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weights = await redis.get<Record<string, number>>("outreach:score_weights") ?? {};
  const log = await redis.get<any[]>("outreach:learning_log") ?? [];
  const conversions = log.filter((e: any) => e.converted).length;
  const convRate = log.length > 0 ? ((conversions / log.length) * 100).toFixed(1) : null;

  return NextResponse.json({ weights, totalOutcomes: log.length, conversions, conversionRate: convRate });
}
