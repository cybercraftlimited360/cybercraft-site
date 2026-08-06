import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

// CyberCraft360-specific cinematic prompts — AI automation agency, Houston TX
// Visual world: business transformation, AI answering calls, leads converting, time saved, 24/7 operation
const PREMIUM_PROMPTS = [
  "Aerial hyperlapse of Houston Texas downtown skyline at golden hour, drone pulling back slowly revealing the city scale, warm cinematic grade, anamorphic lens flare, premium commercial",
  "Extreme close-up of a smartphone screen showing an incoming business call being answered instantly, dark premium desk surface, single dramatic key light, shallow depth of field, slow motion, tech commercial",
  "Business owner at a sleek dark executive desk, dramatic side lighting, multiple screens glowing with analytics showing leads converting in real time, slow cinematic push in, premium grade",
  "Abstract AI voice waveform visualization on pure black background, electric cyan frequencies pulsing rhythmically, slow motion, minimal, premium tech commercial aesthetic",
  "Close-up of hands typing on a dark keyboard, single rim light from the side, blurred monitor glow in background, shallow depth of field, slow motion, premium business commercial",
  "Houston downtown skyline at night through floor-to-ceiling office windows, city lights bokeh, a professional silhouetted at the window, dramatic ambient, cinematic wide",
  "Macro close-up of a phone screen showing chat messages with instant AI responses appearing in real time, dark background, cold blue screen glow, shallow depth of field, slow rack focus",
  "Abstract automated workflow — glowing nodes connecting in precise sequence across dark background, electric blue and white connections pulsing systematically, slow motion, premium tech",
  "Time-lapse of a busy office transforming to empty as automated systems take over, screens glowing with AI activity, dramatic overhead shot, cold cinematic grade",
  "Business dashboard on a large monitor showing lead pipeline filling up, green conversion metrics rising, dramatic side lighting, shallow depth of field, slow zoom in, commercial grade",
  "Aerial drone shot of Houston Texas highway at rush hour, thousands of cars moving in orchestrated flow, golden hour, slow motion, scale and precision, premium cinematic",
  "Close-up of a professional shaking hands across a conference table, warm window light, shallow depth of field, slow motion, trust and partnership, premium business commercial",
  "Clock face in extreme macro, second hand in crisp slow motion against dark background, dramatic rim lighting, 24/7 concept, minimal premium aesthetic",
  "AI chat interface on a sleek dark monitor, automated responses generating instantly with no human present, office at night, city lights through window, cinematic ambient",
  "Extreme close-up of a business card being placed on a dark surface, single overhead spot light, shallow depth of field, slow motion, premium brand identity aesthetic",
  "Confident business professional walking through a modern dark-toned office corridor, dramatic side lighting, slow motion, purposeful stride, premium corporate commercial",
  "Abstract data visualization — thousands of small light points organizing into a precise structure over dark background, slow motion, electric blue, systematic intelligence aesthetic",
  "Phone ringing on a dark executive desk, immediately answered by an invisible force, screen lights up showing AI agent active, dramatic lighting, slow motion, cinematic",
  "Houston skyline reflection in a rain-covered glass surface, long exposure streaks of light, cold blue color grade, slow motion, premium cinematic atmosphere",
  "Split screen: left side chaos of missed calls and sticky notes, right side clean AI dashboard handling everything automatically — dramatic reveal, premium commercial grade",
];

export const CLIP_LIBRARY_KEY = "reels:clip_library";

const VEO_MODEL = "veo-3.1-generate-preview";

async function generateVeoClip(prompt: string, apiKey: string): Promise<string> {
  const base = "https://generativelanguage.googleapis.com/v1beta";

  // Submit generation
  const submitRes = await fetch(`${base}/models/${VEO_MODEL}:predictLongRunning?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "9:16",
        durationSeconds: "8",
        resolution: "1080p",
      },
    }),
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Veo submit failed: ${submitRes.status} — ${err.slice(0, 300)}`);
  }

  const operation = await submitRes.json();
  const opName = operation.name;
  if (!opName) throw new Error("No operation name returned from Veo");

  // Poll until done (max 6 min)
  for (let i = 0; i < 36; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const pollRes = await fetch(`${base}/${opName}?key=${apiKey}`);
    if (!pollRes.ok) continue;
    const op = await pollRes.json();
    if (op.done) {
      const videoData = op.response?.generatedVideos?.[0]?.video;
      if (!videoData) throw new Error("No video in Veo response");
      // Veo returns either a uri or base64 bytes
      if (videoData.uri) return videoData.uri;
      if (videoData.videoBytes) {
        // Store base64 video in Redis and serve via audio route pattern
        // For now return a data URI — caller stores it
        return `data:video/mp4;base64,${videoData.videoBytes}`;
      }
      throw new Error("Veo response has no uri or videoBytes");
    }
    if (op.error) throw new Error(`Veo generation failed: ${op.error.message}`);
  }

  throw new Error("Veo timed out after 6 minutes");
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
      const url = await generateVeoClip(promptText, apiKey);
      results.push({
        id: `veo_${idx}_${Date.now()}`,
        promptIndex: idx,
        prompt: promptText,
        url,
        generatedAt: new Date().toISOString(),
        model: VEO_MODEL,
        duration: 8,
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
