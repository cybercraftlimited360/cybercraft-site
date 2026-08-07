import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

const SCHEDULE_KEY = "reels:scheduled_posts";

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await redis.get<any[]>(SCHEDULE_KEY) ?? [];
  return NextResponse.json({ ok: true, posts });
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { videoUrl, platforms, captions, days, time } = await req.json().catch(() => ({}));
  if (!videoUrl || !days?.length || !time) {
    return NextResponse.json({ error: "videoUrl, days, and time are required" }, { status: 400 });
  }
  const existing = await redis.get<any[]>(SCHEDULE_KEY) ?? [];
  const entry = {
    id: `sched_${Date.now()}`,
    videoUrl,
    platforms: platforms ?? ["instagram", "facebook", "linkedin"],
    captions: captions ?? {},
    days,
    time,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await redis.set(SCHEDULE_KEY, [...existing, entry]);
  return NextResponse.json({ ok: true, post: entry });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  const existing = await redis.get<any[]>(SCHEDULE_KEY) ?? [];
  await redis.set(SCHEDULE_KEY, existing.filter((p: any) => p.id !== id));
  return NextResponse.json({ ok: true });
}
