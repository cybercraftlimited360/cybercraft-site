import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export interface ScheduledPost {
  id: string;
  content: string;
  imageUrl?: string;
  platforms: string[];
  scheduledAt: number; // unix ms
  createdAt: number;
  status: "pending" | "published" | "failed";
  error?: string;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content, imageUrl, platforms, scheduledAt } = await req.json();

  if (!content || !platforms?.length || !scheduledAt) {
    return NextResponse.json({ error: "content, platforms, and scheduledAt are required" }, { status: 400 });
  }

  if (platforms.includes("instagram") && !imageUrl) {
    return NextResponse.json({ error: "imageUrl is required for Instagram" }, { status: 400 });
  }

  const post: ScheduledPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    content,
    imageUrl,
    platforms,
    scheduledAt,
    createdAt: Date.now(),
    status: "pending",
  };

  // Store in a sorted set keyed by scheduled time
  await redis.zadd("scheduled_posts", { score: scheduledAt, member: JSON.stringify(post) });

  return NextResponse.json({ ok: true, post });
}
