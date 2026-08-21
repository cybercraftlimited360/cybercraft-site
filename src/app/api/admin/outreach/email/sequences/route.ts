import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { DEFAULT_SEQUENCES, Sequence } from "@/lib/email-sequences";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// GET — list all sequences
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reset = new URL(req.url).searchParams.get("reset");
  if (reset) await redis.del("outreach:sequences");
  const stored = await redis.get<Sequence[]>("outreach:sequences");
  return NextResponse.json({ sequences: stored ?? DEFAULT_SEQUENCES });
}

// PUT — save updated sequences
export async function PUT(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sequences } = await req.json() as { sequences: Sequence[] };
  await redis.set("outreach:sequences", sequences);
  return NextResponse.json({ ok: true });
}
