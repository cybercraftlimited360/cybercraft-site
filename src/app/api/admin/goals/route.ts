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
  const goals = await redis.get<any>("admin:goals") ?? { monthlyRevenue: 0, monthlyLeads: 0, monthlyBookings: 0 };
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const existing = await redis.get<any>("admin:goals") ?? {};
  const updated = { ...existing, ...body };
  await redis.set("admin:goals", updated);
  return NextResponse.json({ ok: true, goals: updated });
}
