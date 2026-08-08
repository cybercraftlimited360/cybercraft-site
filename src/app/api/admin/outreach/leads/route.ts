import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// GET — list leads with optional filters
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry");
  const messaged = searchParams.get("messaged");

  let leads = await redis.get<any[]>("outreach:leads") ?? [];
  if (industry) leads = leads.filter((l: any) => l.industry === industry);
  if (messaged === "false") leads = leads.filter((l: any) => !l.messaged);
  leads.sort((a: any, b: any) => b.score - a.score);

  return NextResponse.json({ leads });
}

// PATCH — mark lead as messaged
export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, messaged } = await req.json();
  const leads = await redis.get<any[]>("outreach:leads") ?? [];
  const updated = leads.map((l: any) => l.id === id ? { ...l, messaged: messaged ?? true, messagedAt: new Date().toISOString() } : l);
  await redis.set("outreach:leads", updated);
  return NextResponse.json({ ok: true });
}

// DELETE — remove a lead
export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const leads = await redis.get<any[]>("outreach:leads") ?? [];
  await redis.set("outreach:leads", leads.filter((l: any) => l.id !== id));
  return NextResponse.json({ ok: true });
}
