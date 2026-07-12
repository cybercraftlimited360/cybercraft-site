import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [irisRaw, laurenRaw] = await Promise.all([
    redis.get<any[]>("iris:conversations"),
    redis.get<any[]>("lauren:call-log"),
  ]);

  const iris = (irisRaw ?? []).map(c => ({
    ...c,
    source: "iris",
    duration: null,
  })).reverse();

  const lauren = (laurenRaw ?? []).map(c => ({
    id: c.callSid || c.id,
    date: c.startTime || c.date,
    source: "lauren",
    outcome: c.outcome,
    duration: c.duration,
    phone: c.phone,
    lead: c.lead || null,
    messages: (c.messages || []).filter((m: any) => m.role !== "system"),
  })).reverse();

  // Merge and sort by date newest first
  const all = [...iris, ...lauren].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({ iris, lauren, all });
}


