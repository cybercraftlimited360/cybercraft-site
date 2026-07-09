import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export type PipelineStage = "new" | "contacted" | "demo" | "proposal" | "won" | "lost";

export interface PipelineLead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  service?: string;
  value?: number;
  stage: PipelineStage;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await redis.get<PipelineLead[]>("pipeline:leads") ?? [];
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "update_stage") {
    // Move a lead to a new stage
    const leads = await redis.get<PipelineLead[]>("pipeline:leads") ?? [];
    const idx = leads.findIndex(l => l.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    leads[idx].stage = body.stage;
    leads[idx].updatedAt = new Date().toISOString();
    await redis.set("pipeline:leads", leads);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add") {
    const leads = await redis.get<PipelineLead[]>("pipeline:leads") ?? [];
    const lead: PipelineLead = {
      id: `pl_${Date.now()}`,
      name: body.name,
      company: body.company || "",
      email: body.email,
      phone: body.phone,
      service: body.service,
      value: body.value,
      stage: body.stage || "new",
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    leads.unshift(lead);
    await redis.set("pipeline:leads", leads);
    return NextResponse.json({ ok: true, lead });
  }

  if (body.action === "delete") {
    const leads = await redis.get<PipelineLead[]>("pipeline:leads") ?? [];
    await redis.set("pipeline:leads", leads.filter(l => l.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_notes") {
    const leads = await redis.get<PipelineLead[]>("pipeline:leads") ?? [];
    const idx = leads.findIndex(l => l.id === body.id);
    if (idx !== -1) {
      leads[idx].notes = body.notes;
      leads[idx].updatedAt = new Date().toISOString();
      await redis.set("pipeline:leads", leads);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}


