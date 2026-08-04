import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await redis.get<string[]>("reels:pending_list") ?? [];
  const reels = (await Promise.all(list.map(k => redis.get(k)))).filter(Boolean);
  return NextResponse.json({ ok: true, reels });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });
  await redis.del(id);
  const list = await redis.get<string[]>("reels:pending_list") ?? [];
  await redis.set("reels:pending_list", list.filter(k => k !== id));
  return NextResponse.json({ ok: true });
}
