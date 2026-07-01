import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getBookings } from "@/lib/redis";

const AVAIL_FILE = path.join(process.cwd(), "data", "availability.json");

async function readJson(file: string) {
  try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return null; }
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, "0");
  const mm = (m % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const DEFAULT_AVAIL = {
    timezone: "America/Chicago",
    slotDuration: 30,
    bufferMinutes: 15,
    weekdays: Object.fromEntries([0,1,2,3,4,5,6].map(d => [d, { enabled: true, start: "00:00", end: "23:30" }])),
    blockedDates: [],
  };

  const avail = (await readJson(AVAIL_FILE)) ?? DEFAULT_AVAIL;
  const bookings = await getBookings();

  if (avail.blockedDates?.includes(date)) return NextResponse.json({ slots: [] });

  const dow = new Date(`${date}T12:00:00`).getDay().toString();
  const day = avail.weekdays[dow];
  if (!day?.enabled) return NextResponse.json({ slots: [] });

  const slotDuration = avail.slotDuration ?? 30;
  const buffer = avail.bufferMinutes ?? 0;
  const stepMinutes = slotDuration + buffer;

  const startMin = timeToMinutes(day.start);
  const endMin   = timeToMinutes(day.end);

  const allSlots: string[] = [];
  for (let m = startMin; m + slotDuration <= endMin; m += stepMinutes) {
    allSlots.push(minutesToTime(m));
  }

  const bookedTimes = new Set(
    bookings
      .filter(b => b.date === date && b.status !== "cancelled")
      .map(b => b.time)
  );

  const nowCT = new Date().toLocaleString("en-US", { timeZone: avail.timezone || "America/Chicago" });
  const todayStr = new Date(nowCT).toISOString().slice(0, 10);
  const nowMinutes = date === todayStr
    ? new Date(nowCT).getHours() * 60 + new Date(nowCT).getMinutes() + 60
    : 0;

  const available = allSlots.filter(t => !bookedTimes.has(t) && timeToMinutes(t) >= nowMinutes);

  return NextResponse.json({ slots: available, timezone: avail.timezone });
}
