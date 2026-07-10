import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function verify(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

const DEFAULT_STEPS = [
  "Kickoff call scheduled",
  "Business info & data collected",
  "AI trained on client data",
  "Internal testing complete",
  "Client review & approval",
  "AI goes live",
  "First 30-day check-in",
];

export async function GET(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clientKey = req.nextUrl.searchParams.get("client") || "";
  if (!clientKey) {
    const all = await redis.get<any>("admin:onboarding:all") ?? {};
    return NextResponse.json(all);
  }
  const key = `admin:onboarding:${clientKey}`;
  const data = await redis.get<any>(key) ?? { steps: DEFAULT_STEPS.map(s => ({ label: s, done: false })) };
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientKey, steps } = await req.json();
  if (!clientKey) return NextResponse.json({ error: "clientKey required" }, { status: 400 });
  const key = `admin:onboarding:${clientKey}`;
  await redis.set(key, { steps, updatedAt: new Date().toISOString() });

  // Update all-clients index
  const all = await redis.get<any>("admin:onboarding:all") ?? {};
  const done = steps.filter((s: any) => s.done).length;
  all[clientKey] = { total: steps.length, done, pct: Math.round((done / steps.length) * 100) };
  await redis.set("admin:onboarding:all", all);

  return NextResponse.json({ ok: true });
}
