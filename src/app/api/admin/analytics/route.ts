import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function isAdmin(req: NextRequest) {
  return req.nextUrl.searchParams.get("secret") === process.env.ADMIN_SECRET ||
    req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Global stats hash
    const rawStats = await redis.hgetall("chat:stats");
    const stats = rawStats ? {
      totalConversations: Number(rawStats.totalConversations ?? 0),
      totalLeads: Number(rawStats.totalLeads ?? 0),
      totalMessages: Number(rawStats.totalMessages ?? 0),
      bookingClicks: Number(rawStats.bookingClicks ?? 0),
    } : null;

    // Scan for daily keys — chat:daily:YYYY-MM-DD
    const dailyKeys = await redis.keys("chat:daily:*");
    const daily: Record<string, { conversations: number; leads: number }> = {};
    if (dailyKeys.length > 0) {
      await Promise.all(dailyKeys.map(async (key) => {
        const date = key.replace("chat:daily:", "");
        const rec = await redis.hgetall(key);
        if (rec) {
          daily[date] = {
            conversations: Number(rec.conversations ?? 0),
            leads: Number(rec.leads ?? 0),
          };
        }
      }));
    }

    return NextResponse.json({ stats, daily });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dailyKeys = await redis.keys("chat:daily:*");
  await Promise.all([
    redis.del("chat:stats"),
    ...dailyKeys.map(k => redis.del(k)),
  ]);
  return NextResponse.json({ ok: true });
}
