import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment, DEFAULT_SEQUENCES, Sequence } from "@/lib/email-sequences";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// POST — enroll one or multiple leads in a sequence
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leads, sequenceId } = await req.json() as {
    leads: Array<{ id: string; name: string; email: string; industry: string; city: string; ownerName?: string; flags?: string[]; website?: string; phone?: string; rating?: number; reviewCount?: number }>;
    sequenceId: string;
  };

  if (!leads?.length || !sequenceId) {
    return NextResponse.json({ error: "leads and sequenceId required" }, { status: 400 });
  }

  const sequences: Sequence[] = await redis.get("outreach:sequences") ?? DEFAULT_SEQUENCES;
  const seq = sequences.find(s => s.id === sequenceId);
  if (!seq) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  const fromEmail = process.env.OUTREACH_EMAIL ?? "";
  const fromName = process.env.OUTREACH_NAME ?? "Saad — CyberCraft360";

  const existing: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const existingLeadIds = new Set(existing.filter(e => e.status === "active").map(e => e.leadId));

  const now = new Date();
  const newEnrollments: Enrollment[] = [];
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.email) { skipped++; continue; }
    if (existingLeadIds.has(lead.id)) { skipped++; continue; }

    newEnrollments.push({
      id: `enr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email,
      leadIndustry: lead.industry,
      leadCity: lead.city,
      ownerName: lead.ownerName,
      leadFlags: lead.flags ?? [],
      leadWebsite: lead.website ?? undefined,
      leadPhone: lead.phone ?? undefined,
      leadRating: lead.rating ?? undefined,
      leadReviewCount: lead.reviewCount ?? undefined,
      sequenceId,
      currentStep: 0,
      nextSendAt: now.toISOString(),
      status: "active",
      enrolledAt: now.toISOString(),
      sentSteps: [],
      openedSteps: [],
      fromEmail,
      fromName,
    });
  }

  const updated = [...newEnrollments, ...existing];
  await redis.set("outreach:enrollments", updated);

  return NextResponse.json({ ok: true, enrolled: newEnrollments.length, skipped });
}

// GET — list all enrollments
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const filtered = status ? enrollments.filter(e => e.status === status) : enrollments;
  return NextResponse.json({ enrollments: filtered.slice(0, 200) });
}

// PATCH — update enrollment status (pause, resume, mark replied, unsubscribe)
export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json() as { id: string; status: Enrollment["status"] };
  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const updated = enrollments.map(e => e.id === id ? { ...e, status } : e);
  await redis.set("outreach:enrollments", updated);
  return NextResponse.json({ ok: true });
}
