import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
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

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RUNWAY_API_KEY not set in Vercel env vars" }, { status: 500 });

  const { count = 5, promptIndexes }: { count?: number; promptIndexes?: number[] } = await req.json().catch(() => ({}));

  const client = new RunwayML({ apiKey });

  // Pick which prompts to use
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
      // Submit generation task
      const task = await client.textToVideo.create({
        model: "gen4_turbo",
        promptText,
        duration: 5,
        ratio: "9:16",
      } as any);

      // Poll until complete (max 3 min per clip)
      let completed = false;
      for (let i = 0; i < 36; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const status = await client.tasks.retrieve(task.id);
        if (status.status === "SUCCEEDED" && status.output?.[0]) {
          const clip = {
            id: task.id,
            promptIndex: idx,
            prompt: promptText,
            url: status.output[0],
            generatedAt: new Date().toISOString(),
            model: "gen4_turbo",
            duration: 5,
          };
          results.push(clip);
          completed = true;
          break;
        }
        if (status.status === "FAILED") {
          errors.push({ idx, error: status.failure ?? "Generation failed" });
          break;
        }
      }
      if (!completed && !errors.find(e => e.idx === idx)) {
        errors.push({ idx, error: "Timed out after 3 minutes" });
      }
    } catch (e: any) {
      errors.push({ idx, error: e.message });
    }
  }

  // Merge into library
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
