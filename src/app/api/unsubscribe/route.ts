import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment } from "@/lib/email-sequences";

export async function POST(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const idx = enrollments.findIndex(e => e.id === id);
  if (idx === -1) return NextResponse.json({ ok: true }); // already gone — still return ok

  enrollments[idx] = { ...enrollments[idx], status: "unsubscribed" };
  await redis.set("outreach:enrollments", enrollments);

  return NextResponse.json({ ok: true });
}

// Support one-click unsubscribe (RFC 8058) via GET too
export async function GET(req: NextRequest) {
  return POST(req);
}
