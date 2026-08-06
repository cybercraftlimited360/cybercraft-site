import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { put } from "@vercel/blob";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

// CyberCraft360-specific cinematic prompts — AI automation agency, Houston TX
const PREMIUM_PROMPTS = [
  "Aerial hyperlapse of downtown Houston Texas skyline at golden hour, drone camera pulling back slowly revealing the city scale, warm cinematic grade, anamorphic lens flare, no people, premium commercial",
  "Extreme close-up of a smartphone screen on a dark premium desk, incoming call notification glowing on screen, single dramatic key light, shallow depth of field, slow motion, no people, tech commercial",
  "Sleek dark executive desk with multiple monitors displaying glowing analytics dashboards, lead conversion metrics rising in real time, slow cinematic push in, no people, premium grade",
  "Abstract AI voice waveform visualization on pure black background, electric cyan frequencies pulsing rhythmically, slow motion, minimal, no people, premium tech commercial aesthetic",
  "Close-up of hands typing on a dark mechanical keyboard, single rim light from the side, blurred monitor glow in background, shallow depth of field, slow motion, premium business commercial",
  "Downtown Houston skyline at night seen through floor-to-ceiling office windows, city lights bokeh, dark silhouetted figure at the window facing away, dramatic ambient, cinematic wide",
  "Macro close-up of a phone screen showing AI chat responses appearing instantly in real time, dark background, cold blue screen glow, shallow depth of field, slow rack focus, no people",
  "Abstract automated workflow — glowing nodes connecting in precise sequence across dark background, electric blue and white connections pulsing systematically, slow motion, no people, premium tech",
  "Time-lapse of an empty modern office at night, screens glowing with automated AI activity, dramatic overhead shot, cold cinematic grade, no people",
  "Business dashboard on a large dark monitor showing lead pipeline filling with green conversion metrics rising, dramatic side lighting, shallow depth of field, slow zoom in, no people, commercial grade",
  "Aerial drone shot of a major Texas highway at rush hour, thousands of car headlights moving in orchestrated flow, golden hour light, slow motion, scale and precision, no people visible, premium cinematic",
  "Two sets of hands in a handshake over a dark conference table, warm window light, shallow depth of field, slow motion, trust and partnership, only hands visible, premium business commercial",
  "Clock face in extreme macro, second hand in crisp slow motion against dark background, dramatic rim lighting, 24/7 concept, minimal premium aesthetic, no people",
  "AI chat interface on a sleek dark monitor, automated text responses generating instantly, empty office at night, city lights through window, cinematic ambient, no people",
  "Extreme close-up of a black business card being placed on a dark surface, single overhead spot light, shallow depth of field, slow motion, premium brand identity aesthetic, no people",
  "Empty modern office corridor with dramatic side lighting, slow camera dolly movement forward through the space, purposeful cinematic atmosphere, no people, premium corporate commercial",
  "Abstract data visualization — thousands of glowing light points self-organizing into a precise geometric structure over dark background, slow motion, electric blue, no people, systematic intelligence aesthetic",
  "Smartphone on a dark executive desk vibrating with an incoming call notification, screen lights up automatically showing AI agent interface activating, dramatic lighting, slow motion, no people, cinematic",
  "Houston skyline reflection shimmering in a rain-covered glass surface, long exposure light streaks, cold blue color grade, slow motion, no people, premium cinematic atmosphere",
  "Split screen: left side shows missed call notifications and cluttered sticky notes piling up, right side shows a clean glowing AI dashboard auto-organizing everything — dramatic reveal, no people, premium commercial",
];

export const CLIP_LIBRARY_KEY = "reels:clip_library";
const VEO_MODEL = "veo-3.1-generate-preview";
const GEN_BASE = "https://generativelanguage.googleapis.com/v1beta";

async function generateAndStoreClip(prompt: string, apiKey: string, idx: number): Promise<string> {
  // 1. Submit to Veo
  const submitRes = await fetch(`${GEN_BASE}/models/${VEO_MODEL}:predictLongRunning?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { aspectRatio: "9:16", durationSeconds: 8, resolution: "720p" },
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Veo submit failed ${submitRes.status}: ${err.slice(0, 300)}`);
  }

  const operation = await submitRes.json();
  const opName = operation.name;
  if (!opName) throw new Error("No operation name returned from Veo");

  // 2. Poll until done (max 6 min, every 10s)
  let videoUrl: string | null = null;
  let videoBytes: string | null = null;

  for (let i = 0; i < 36; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`${GEN_BASE}/${opName}?key=${apiKey}`);
    if (!pollRes.ok) continue;
    const op = await pollRes.json();
    if (op.error) throw new Error(`Veo failed: ${op.error.message}`);
    if (op.done) {
      console.log("[veo] response:", JSON.stringify(op.response ?? {}).slice(0, 800));
      const videoObj = op.response?.generateVideoResponse?.generatedSamples?.[0]?.video;
      if (!videoObj) throw new Error(`Unexpected Veo response: ${JSON.stringify(op.response ?? {}).slice(0, 300)}`);
      videoUrl = videoObj.uri ?? null;
      videoBytes = videoObj.videoBytes ?? null;
      break;
    }
  }

  if (!videoUrl && !videoBytes) throw new Error("Veo timed out after 6 minutes");

  // 3. Download video and store permanently in Vercel Blob
  // (Veo URIs expire after 2 days — Blob gives permanent storage)
  let videoBuffer: Buffer;

  if (videoBytes) {
    videoBuffer = Buffer.from(videoBytes, "base64");
  } else {
    // Download from Veo URI (may need API key appended)
    const dlUrl = videoUrl!.includes("?") ? `${videoUrl}&key=${apiKey}` : `${videoUrl}?key=${apiKey}`;
    const dlRes = await fetch(dlUrl);
    if (!dlRes.ok) throw new Error(`Failed to download Veo video: ${dlRes.status}`);
    videoBuffer = Buffer.from(await dlRes.arrayBuffer());
  }

  // Upload to Vercel Blob
  const blob = await put(`reels/clips/veo_${idx}_${Date.now()}.mp4`, videoBuffer, {
    access: "private",
    contentType: "video/mp4",
  });

  return blob.url;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set in Vercel env vars" }, { status: 500 });

  const { count = 5, promptIndexes }: { count?: number; promptIndexes?: number[] } = await req.json().catch(() => ({}));

  const existing = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  const usedPrompts = new Set(existing.map((c: any) => c.promptIndex));
  const available = PREMIUM_PROMPTS.map((_, i) => i).filter(i => !usedPrompts.has(i));
  const toGenerate = promptIndexes ?? available.slice(0, count);

  if (toGenerate.length === 0) {
    return NextResponse.json({ ok: true, message: "All prompts already generated", clips: existing });
  }

  const results: any[] = [];
  const errors: any[] = [];

  for (const idx of toGenerate) {
    const promptText = PREMIUM_PROMPTS[idx];
    if (!promptText) continue;

    try {
      const url = await generateAndStoreClip(promptText, apiKey, idx);
      results.push({
        id: `veo_${idx}_${Date.now()}`,
        promptIndex: idx,
        prompt: promptText,
        url,
        generatedAt: new Date().toISOString(),
        model: VEO_MODEL,
        duration: 8,
        source: "veo",
      });
    } catch (e: any) {
      errors.push({ idx, error: e.message });
    }
  }

  const updated = [...existing, ...results];
  await redis.set(CLIP_LIBRARY_KEY, updated);

  return NextResponse.json({ ok: true, generated: results.length, errors, total: updated.length });
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clips = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  return NextResponse.json({ ok: true, clips, total: clips.length, available: PREMIUM_PROMPTS.length });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clipId } = await req.json().catch(() => ({}));
  const clips = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  const updated = clips.filter((c: any) => c.id !== clipId);
  await redis.set(CLIP_LIBRARY_KEY, updated);
  return NextResponse.json({ ok: true, total: updated.length });
}
