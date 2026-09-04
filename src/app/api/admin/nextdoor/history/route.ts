import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const KEY = "nextdoor:post-history";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const history = await redis.get<any[]>(KEY) ?? [];
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entry = await req.json();
  const history = await redis.get<any[]>(KEY) ?? [];
  history.unshift({ ...entry, savedAt: new Date().toISOString() });
  await redis.set(KEY, history.slice(0, 100));
  return NextResponse.json({ ok: true });
}
