import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// GET /api/admin/settings?key=some:key
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key param required" }, { status: 400 });
  const value = await redis.get(key);
  return NextResponse.json({ key, value: value === null ? null : String(value) });
}

// POST /api/admin/settings  { key, value }
// value = null → deletes the key
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  if (value === null || value === undefined || value === "") {
    await redis.del(key);
    return NextResponse.json({ ok: true, action: "deleted", key });
  }
  // Store numbers as numbers, everything else as string
  const stored = /^\d+$/.test(String(value)) ? parseInt(String(value)) : String(value);
  await redis.set(key, stored);
  return NextResponse.json({ ok: true, action: "set", key, value: stored });
}
