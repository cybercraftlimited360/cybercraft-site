import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-token") === process.env.ADMIN_TOKEN;
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
