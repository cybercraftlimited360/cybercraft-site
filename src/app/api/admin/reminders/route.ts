import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function verify(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const reminders = await redis.get<any[]>("admin:reminders") ?? [];
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, name, phone, email, company, note, dueDate, id } = await req.json();
  const reminders = await redis.get<any[]>("admin:reminders") ?? [];

  if (action === "add") {
    reminders.push({ id: Date.now().toString(), name, phone, email, company, note, dueDate, done: false, createdAt: new Date().toISOString() });
    await redis.set("admin:reminders", reminders.slice(-500));
    return NextResponse.json({ ok: true });
  }
  if (action === "done") {
    const r = reminders.find(r => r.id === id);
    if (r) r.done = true;
    await redis.set("admin:reminders", reminders);
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await redis.set("admin:reminders", reminders.filter(r => r.id !== id));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
