import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const renderId = req.nextUrl.searchParams.get("id");
  if (!renderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SHOTSTACK_API_KEY not set" }, { status: 500 });

  const ssBase = process.env.SHOTSTACK_ENV === "production"
    ? "https://api.shotstack.io/v1"
    : "https://api.shotstack.io/stage/v1";

  const res = await fetch(`${ssBase}/render/${renderId}`, {
    headers: { "x-api-key": apiKey },
  });
  const data = await res.json();
  const status = data?.response?.status;
  const url = data?.response?.url ?? null;

  // Update Redis with final state
  if (status === "done" || status === "failed") {
    const stored: any = await redis.get(`commercial:${renderId}`) ?? {};
    await redis.set(`commercial:${renderId}`, { ...stored, status, url }, { ex: 7 * 24 * 3600 });
  }

  return NextResponse.json({ ok: true, status, url, renderId });
}
