import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Get all members and remove the one matching the id
  const raw = await redis.zrange("scheduled_posts", 0, -1);
  for (const member of raw) {
    try {
      const post = typeof member === "string" ? JSON.parse(member as string) : member;
      if (post.id === id) {
        await redis.zrem("scheduled_posts", member);
        return NextResponse.json({ ok: true });
      }
    } catch {
      // skip
    }
  }

  return NextResponse.json({ error: "Post not found" }, { status: 404 });
}
