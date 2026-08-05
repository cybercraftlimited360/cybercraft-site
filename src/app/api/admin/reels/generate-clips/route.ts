import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

// Apple/McLaren-level cinematic prompts for a premium AI automation brand
const PREMIUM_PROMPTS = [
  "Extreme macro of circuit board copper traces, golden specular caustics, ultra-shallow depth of field, dark studio background, slow rack focus, 8K cinematic",
  "Abstract neural network nodes pulsing with electric blue light, dark void background, slow drift, bioluminescent synaptic connections, photorealistic, Apple commercial aesthetic",
  "Sleek black server rack corridor, dramatic perspective vanishing point, cold blue LED edge lighting, wisps of dry ice fog, ultra-wide lens, slow dolly forward",
  "Data streams rendered as luminous white particles flowing in slow motion through deep black space, cinematic grade, minimal, 4K",
  "Macro shot of a finger touching a dark glass surface, ripple of light emanating outward, clean dark background, ultra slow motion, premium product commercial",
  "Abstract AI brain morphing from particles to solid form, electric blue and white, dark background, fluid slow motion, Apple-style render",
  "City skyline at 3am reflected in rain-slicked black road surface, long exposure streaks of white light, cinematic anamorphic lens flare, slow motion",
  "Close-up of a human eye with data code reflected in the iris, dramatic rim lighting, shallow depth of field, dark studio, sci-fi commercial grade",
  "Futuristic holographic interface dissolving into light particles, hands reaching through it, dark room, cold blue ambient, slow motion",
  "Polished obsidian surface with glowing geometric patterns emerging beneath, abstract, ultra-slow reveal, premium tech aesthetic",
  "Aerial night city shot pulling back from a single lit window, drone, long exposure, cold color grade, cinematic, isolation and scale",
  "Macro of liquid mercury droplets forming a sphere, dark background, dramatic side lighting, ultra slow motion, photorealistic",
  "Carbon fibre texture under dramatic raking light, extreme macro, dark studio, specular highlights, shallow depth of field, McLaren aesthetic",
  "Abstract rotating helix of light filaments in deep black space, electric blue, slow motion, Apple WWDC aesthetic",
  "Clean white light beam cutting through darkness, particles floating in the air, studio atmosphere, slow motion, minimalist",
  "Robotic arm precision movement in slow motion, dark background, single rim light, industrial premium, McLaren tech aesthetic",
  "Flowing black silk fabric in slow motion against pure dark background, rim lit, ultra high speed, fashion commercial grade",
  "Abstract topology of a human brain rendered as glowing wireframe, slowly rotating in dark void, electric blue, cinematic",
  "Time-lapse of clouds accelerating over a dark glass skyscraper, reflected sunset, cinematic anamorphic, upward tilt",
  "Microchip die shot under electron microscope aesthetic, extreme detail, dark background, gold and blue tones, slow zoom",
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
