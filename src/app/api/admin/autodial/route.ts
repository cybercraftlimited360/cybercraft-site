import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export interface DialQueueEntry {
  id: string;
  phone: string;
  name: string;
  company: string;
  website?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  hasWebsite?: boolean;
  hasBooking?: boolean;
  hasChatbot?: boolean;
  hasReviews?: boolean;
  challenge?: string;
  status: "pending" | "called" | "busy" | "no-answer" | "error";
  addedAt: string;
  calledAt?: string;
  callSid?: string;
}

const QUEUE_KEY = "autodial:queue";

// GET — fetch the current queue
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const queue = await redis.get<DialQueueEntry[]>(QUEUE_KEY) ?? [];
  return NextResponse.json({ queue, total: queue.length, pending: queue.filter(e => e.status === "pending").length });
}

// POST — add leads to queue or clear it
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "clear") {
    await redis.set(QUEUE_KEY, []);
    return NextResponse.json({ ok: true, message: "Queue cleared" });
  }

  if (body.action === "add" && Array.isArray(body.leads)) {
    const queue = await redis.get<DialQueueEntry[]>(QUEUE_KEY) ?? [];
    const newEntries: DialQueueEntry[] = body.leads.map((l: any) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      phone: l.phone,
      name: l.name || "",
      company: l.company || "",
      website: l.website || "",
      city: l.city || "",
      rating: l.rating,
      reviewCount: l.reviewCount,
      hasWebsite: l.hasWebsite,
      hasBooking: l.hasBooking,
      hasChatbot: l.hasChatbot,
      hasReviews: l.hasReviews,
      challenge: l.challenge || "",
      status: "pending",
      addedAt: new Date().toISOString(),
    }));
    const merged = [...queue, ...newEntries];
    await redis.set(QUEUE_KEY, merged);
    return NextResponse.json({ ok: true, added: newEntries.length, total: merged.length });
  }

  if (body.action === "remove" && body.id) {
    const queue = await redis.get<DialQueueEntry[]>(QUEUE_KEY) ?? [];
    await redis.set(QUEUE_KEY, queue.filter(e => e.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
