import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`cc360:${secret}:v2`).toString("base64");
  return req.headers.get("x-admin-token") === expected;
}

// GET — list all pending social + blog posts
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [social, blog] = await Promise.all([
    redis.get<any[]>("social:pending_posts") ?? [],
    redis.get<any[]>("blog:pending_posts") ?? [],
  ]);
  return NextResponse.json({ social: social ?? [], blog: blog ?? [] });
}
