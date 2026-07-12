import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || !token) return false;
  return token === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await redis.get<any[]>("ebooks:all") ?? [];
  return NextResponse.json({ ebooks: [...all].reverse() });
}
