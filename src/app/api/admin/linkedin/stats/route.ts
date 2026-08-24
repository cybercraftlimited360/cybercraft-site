import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [runs, stats] = await Promise.all([
    redis.get<any[]>("linkedin:runs") ?? [],
    redis.get<any>("linkedin:stats") ?? { totalSent: 0, totalRuns: 0 },
  ]);

  return NextResponse.json({ ok: true, runs: runs ?? [], stats: stats ?? { totalSent: 0, totalRuns: 0 } });
}
