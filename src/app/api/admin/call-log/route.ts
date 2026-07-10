import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function verify(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const log = await redis.get<any[]>("lauren:call-log") ?? [];
  return NextResponse.json(log.slice(-200).reverse());
}

export async function POST(req: NextRequest) {
  // Internal use — no auth (called from Lauren respond route)
  const entry = await req.json();
  const log = await redis.get<any[]>("lauren:call-log") ?? [];
  log.push({ ...entry, loggedAt: new Date().toISOString() });
  await redis.set("lauren:call-log", log.slice(-500));
  return NextResponse.json({ ok: true });
}
