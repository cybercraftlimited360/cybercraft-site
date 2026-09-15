import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment } from "@/lib/email-sequences";

// One-time reset: fixes warmup start date and pauses non-real-estate enrollments.
// Safe to call multiple times — idempotent.

function auth(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  const token = req.headers.get("x-admin-token");
  return adminSecret && token === Buffer.from(`cc360:${adminSecret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: Record<string, any> = {};

  // 1. Reset warmup start to today so ramp begins at 25/day from Sep 15, 2026
  const today = new Date().toISOString();
  await redis.set("outreach:warmup_start", today);
  results.warmupStartReset = today;

  // 2. Pause all non-real-estate active enrollments
  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  let paused = 0;
  const updated = enrollments.map(e => {
    if (e.status === "active" && e.leadIndustry !== "Real Estate") {
      paused++;
      return { ...e, status: "paused_non_realestate" as any };
    }
    return e;
  });
  await redis.set("outreach:enrollments", updated);
  results.nonRealEstatePaused = paused;
  results.realEstateActiveRemaining = updated.filter(e => e.status === "active" && e.leadIndustry === "Real Estate").length;

  // 3. Reset Google API spend tracker so new $200 free tier is tracked fresh
  await redis.set("outreach:google_api_spend", 0);
  results.googleApiSpendReset = true;

  return NextResponse.json({
    ok: true,
    message: "Reset complete. Warmup starts today at 25/day. Non-real-estate enrollments paused. Google budget tracker reset.",
    ...results,
  });
}
