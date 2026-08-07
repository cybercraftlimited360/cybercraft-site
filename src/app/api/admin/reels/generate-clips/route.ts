import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export const CLIP_LIBRARY_KEY = "reels:clip_library";

const HIGGSFIELD_BASE = "https://platform.higgsfield.ai";

async function generateClip(prompt: string, apiKey: string): Promise<string> {
  const safePrompt = prompt.trim().replace(/,?\s*no people.*$/i, "").trim()
    + ", no people, cinematic";

  const submitRes = await fetch(`${HIGGSFIELD_BASE}/higgsfield-ai/soul/standard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Key ${apiKey}`,
    },
    body: JSON.stringify({ prompt: safePrompt, resolution: "720p", aspect_ratio: "9:16" }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Higgsfield submit failed ${submitRes.status}: ${err.slice(0, 300)}`);
  }

  const submitted = await submitRes.json();
  const requestId: string = submitted.request_id ?? submitted.id;
  if (!requestId) throw new Error(`No request_id from Higgsfield: ${JSON.stringify(submitted).slice(0, 200)}`);

  // Poll until done (max 8 min, every 10s)
  for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const statusRes = await fetch(`${HIGGSFIELD_BASE}/requests/${requestId}/status`, {
      headers: { "Authorization": `Key ${apiKey}` },
    });
    if (!statusRes.ok) continue;
    const status = await statusRes.json();
    if (status.status === "Failed" || status.status === "NSFW" || status.status === "Cancelled") {
      throw new Error(`Higgsfield generation ${status.status}: ${status.error ?? ""}`);
    }
    if (status.status === "Completed") {
      const url: string = status.result?.images?.[0]?.url ?? status.result?.url;
      if (!url) throw new Error(`Higgsfield returned no URL: ${JSON.stringify(status.result ?? {}).slice(0, 200)}`);
      return url;
    }
  }

  throw new Error("Higgsfield timed out after 8 minutes");
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.HIGGSFIELD_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HIGGSFIELD_API_KEY not set" }, { status: 500 });

  const { customPrompt }: { customPrompt?: string } = await req.json().catch(() => ({}));

  if (!customPrompt?.trim()) {
    return NextResponse.json({ error: "customPrompt is required" }, { status: 400 });
  }

  const existing = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];

  try {
    const url = await generateClip(customPrompt, apiKey);
    const clip = {
      id: `higgsfield_${Date.now()}`,
      prompt: customPrompt.trim(),
      custom: true,
      url,
      generatedAt: new Date().toISOString(),
      model: "higgsfield-ai/soul/standard",
      duration: 8,
    };
    const updated = [...existing, clip];
    await redis.set(CLIP_LIBRARY_KEY, updated);
    return NextResponse.json({ ok: true, generated: 1, errors: [], total: updated.length, clips: [clip] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clips = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  return NextResponse.json({ ok: true, clips, total: clips.length });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clipId } = await req.json().catch(() => ({}));
  const clips = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  const updated = clips.filter((c: any) => c.id !== clipId);
  await redis.set(CLIP_LIBRARY_KEY, updated);
  return NextResponse.json({ ok: true, total: updated.length });
}
