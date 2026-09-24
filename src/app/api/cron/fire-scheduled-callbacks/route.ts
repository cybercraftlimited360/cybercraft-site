import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import type { ScheduledCallback } from "@/app/api/real-estate/schedule-callback/route";

// Window start hours (local to user's timezone)
const WINDOW_START: Record<string, number> = {
  morning:   9,
  afternoon: 12,
  evening:   16,
};
const WINDOW_END: Record<string, number> = {
  morning:   12,
  afternoon: 16,
  evening:   19,
};

function isWindowActive(cb: ScheduledCallback, now: Date): boolean {
  // Convert now to the callback's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: cb.timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(p => [p.type, p.value])
  );
  const localDate = `${parts.year}-${parts.month}-${parts.day}`;
  const localHour = parseInt(parts.hour, 10);

  if (localDate !== cb.date) return false;
  return localHour >= WINDOW_START[cb.timeWindow] && localHour < WINDOW_END[cb.timeWindow];
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  const secret = process.env.CRON_SECRET;
  if (auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const callbacks = await redis.get<ScheduledCallback[]>("realestate:scheduled_callbacks") ?? [];
  const pending = callbacks.filter(cb => cb.status === "pending");

  const results: Array<{ id: string; name: string; result: string }> = [];

  for (const cb of pending) {
    if (!isWindowActive(cb, now)) continue;

    const context = `Scheduled demo callback for ${cb.name}. Role: ${cb.role || "real estate professional"}. They requested this call via the CyberCraft360 real estate page to see how Amy handles leads. ${cb.interest ? `Their main challenge: ${cb.interest}.` : ""}`;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
      const res = await fetch(`${baseUrl}/api/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": Buffer.from(`cc360:${process.env.ADMIN_SECRET}:v2`).toString("base64"),
        },
        body: JSON.stringify({
          phone: cb.phone,
          name: cb.name,
          company: cb.role || "Real Estate",
          challenge: context,
        }),
      });

      if (res.ok) {
        cb.status = "called";
        results.push({ id: cb.id, name: cb.name, result: "called" });
      } else {
        cb.status = "failed";
        results.push({ id: cb.id, name: cb.name, result: `failed (${res.status})` });
      }
    } catch (err) {
      cb.status = "failed";
      results.push({ id: cb.id, name: cb.name, result: `error: ${String(err)}` });
    }
  }

  // Persist updated statuses
  if (results.length > 0) {
    await redis.set("realestate:scheduled_callbacks", callbacks);
  }

  console.log(`[fire-scheduled-callbacks] checked ${pending.length} pending, fired ${results.filter(r => r.result === "called").length}`);
  return NextResponse.json({ ok: true, checked: pending.length, fired: results });
}
