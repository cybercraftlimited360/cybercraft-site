import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { script, voiceId } = await req.json().catch(() => ({}));
  if (!script) return NextResponse.json({ error: "No script provided" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const selectedVoice = voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !selectedVoice) return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 500 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: script,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.42, similarity_boost: 0.82, style: 0.08, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[voiceover]", res.status, err);
    return NextResponse.json({ error: `ElevenLabs TTS failed: ${res.status} — ${err.slice(0, 300)}` }, { status: 502 });
  }

  const audio = await res.arrayBuffer();
  const b64 = Buffer.from(audio).toString("base64");
  const key = `reels:voiceover:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Store 48h
  await redis.set(key, { b64, contentType: "audio/mpeg" }, { ex: 172800 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
  return NextResponse.json({ ok: true, audioUrl: `${siteUrl}/api/reels/audio/${encodeURIComponent(key)}`, key });
}
