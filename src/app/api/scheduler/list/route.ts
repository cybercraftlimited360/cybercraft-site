import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all pending posts sorted by scheduled time
  const pending = await redis.zrange("scheduled_posts", 0, -1);
  // Get up to 10 recently published posts
  const published = await redis.lrange("published_posts", 0, 9);

  const parse = (items: unknown[]) =>
    items.flatMap((m) => {
      try {
        return [typeof m === "string" ? JSON.parse(m) : m];
      } catch {
        return [];
      }
    });

  return NextResponse.json({ posts: [...parse(pending), ...parse(published)] });
}
