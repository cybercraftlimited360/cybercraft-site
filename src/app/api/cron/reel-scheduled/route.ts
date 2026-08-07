import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const SCHEDULE_KEY = "reels:scheduled_posts";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

// Returns current date and time in America/Chicago (CST/CDT)
function nowCentral() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`; // YYYY-MM-DD
  const time = `${get("hour").replace("24","00")}:${get("minute")}`;  // HH:MM
  return { date, time };
}

async function postReel(entry: any): Promise<Record<string, any>> {
  const { videoUrl, captions = {}, platforms = ["instagram","facebook","linkedin"] } = entry;
  const cronSecret = process.env.CRON_SECRET;

  const tasks: Promise<[string, any]>[] = [];

  if (platforms.includes("instagram")) {
    tasks.push(
      fetch(`${SITE_URL}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
        body: JSON.stringify({ message: captions.instagram ?? "", imageUrl: videoUrl, platforms: ["instagram"] }),
      }).then(r => r.json().catch(() => ({ error: "parse failed" }))).then(d => ["instagram", d])
    );
  }

  if (platforms.includes("facebook")) {
    tasks.push(
      fetch(`${SITE_URL}/api/social/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
        body: JSON.stringify({ message: captions.facebook ?? "", imageUrl: videoUrl, platforms: ["facebook"] }),
      }).then(r => r.json().catch(() => ({ error: "parse failed" }))).then(d => ["facebook", d])
    );
  }

  if (platforms.includes("linkedin")) {
    tasks.push(
      fetch(`${SITE_URL}/api/social/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
        body: JSON.stringify({ text: captions.linkedin ?? "", imageUrl: videoUrl }),
      }).then(r => r.json().catch(() => ({ error: "parse failed" }))).then(d => ["linkedin", d])
    );
  }

  const settled = await Promise.all(tasks);
  return Object.fromEntries(settled);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date: todayDate, time: nowTime } = nowCentral();
  const posts = await redis.get<any[]>(SCHEDULE_KEY) ?? [];

  const due: any[] = [];
  const remaining: any[] = [];

  for (const post of posts) {
    const days: string[] = post.days ?? [];
    const scheduledTime: string = post.time ?? "00:00"; // HH:MM
    // Due if: one of the scheduled dates is today AND scheduled time <= now
    const isDueToday = days.includes(todayDate) && scheduledTime <= nowTime;
    if (isDueToday && post.status === "pending") {
      due.push(post);
    } else {
      // Remove dates in the past even if not posted (clean up stale entries)
      const futureDays = days.filter(d => d > todayDate || (d === todayDate && scheduledTime > nowTime));
      if (futureDays.length > 0) {
        remaining.push({ ...post, days: futureDays });
      }
      // If all dates are past and still pending, drop the entry (stale)
    }
  }

  if (due.length === 0) {
    await redis.set(SCHEDULE_KEY, remaining);
    return NextResponse.json({ ok: true, posted: 0, checked: posts.length, todayDate, nowTime });
  }

  const results: any[] = [];
  for (const entry of due) {
    try {
      const postResults = await postReel(entry);
      results.push({ id: entry.id, videoUrl: entry.videoUrl, results: postResults });

      // Log to social:auto_posts
      const log = await redis.get<unknown[]>("social:auto_posts") ?? [];
      log.unshift({
        headline: "Reel",
        squareImageUrl: entry.videoUrl,
        landscapeImageUrl: entry.videoUrl,
        postedAt: new Date().toISOString(),
        results: postResults,
        source: "reel-scheduled",
        scheduledFor: `${entry.days?.join(",")} ${entry.time} CST`,
      });
      await redis.set("social:auto_posts", log.slice(0, 50));
    } catch (err) {
      console.error("[reel-scheduled] post error:", err);
      results.push({ id: entry.id, error: String(err) });
      // Keep failed entries so they can be retried or inspected
      remaining.push({ ...entry, status: "failed", failedAt: new Date().toISOString() });
    }
  }

  await redis.set(SCHEDULE_KEY, remaining);

  console.log(`[reel-scheduled] Posted ${due.length} reel(s) at ${todayDate} ${nowTime} CST`);
  return NextResponse.json({ ok: true, posted: due.length, todayDate, nowTime, results });
}
