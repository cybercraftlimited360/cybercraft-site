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
  const key = req.nextUrl.searchParams.get("key") || "all";
  if (key === "all") {
    const notes = await redis.get<any[]>("admin:notes") ?? [];
    return NextResponse.json(notes);
  }
  const notes = await redis.get<any[]>("admin:notes") ?? [];
  return NextResponse.json(notes.filter(n => n.key === key));
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, key, text, id } = await req.json();
  const notes = await redis.get<any[]>("admin:notes") ?? [];

  if (action === "add") {
    notes.push({ id: Date.now().toString(), key, text, createdAt: new Date().toISOString() });
    await redis.set("admin:notes", notes.slice(-1000));
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    await redis.set("admin:notes", notes.filter(n => n.id !== id));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
