import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { REEL_CAMPAIGNS } from "@/app/api/admin/reels/generate-script/route";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

function buildCaptions(script: any): Record<string, string> {
  const vo = script?.voiceoverScript ?? "";
  const hook = script?.hook ?? vo;
  return {
    instagram: `${hook}\n\nSchedule Your Discovery → CyberCraft360.com\n\n#AIEngineering #BusinessAutomation #AIAgency #HoustonBusiness #WorkflowAutomation #IntelligentSystems #CyberCraft360`,
    facebook: `${vo}\n\nSchedule Your Discovery → CyberCraft360.com`,
    linkedin: `${vo}\n\nSchedule Your Discovery → CyberCraft360.com\n\n#AIEngineering #BusinessAutomation #IntelligentSystems #OperationalExcellence #CyberCraft360 #HoustonBusiness`,
  };
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { customPrompt, platforms, voiceId, autoPost = true } = body;
  const token = makeToken(process.env.ADMIN_SECRET ?? "");

  // Pick campaign
  let campaignIdx = -1;
  if (!customPrompt) {
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    const unused = REEL_CAMPAIGNS.map((_, i) => i).filter(i => !used.includes(i));
    campaignIdx = unused.length > 0 ? unused[0] : 0;
  }

  // 1. Generate script
  const scriptRes = await fetch(`${SITE_URL}/api/admin/reels/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: JSON.stringify(customPrompt ? { customPrompt } : { campaignIndex: campaignIdx }),
  });
  if (!scriptRes.ok) return NextResponse.json({ error: "Script generation failed" }, { status: 500 });
  const { script, suggestedClips, campaignIndex: returnedIdx } = await scriptRes.json();
  if (returnedIdx !== undefined) campaignIdx = returnedIdx;

  // 2. Generate voiceover
  const voiceRes = await fetch(`${SITE_URL}/api/admin/reels/generate-voiceover`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: JSON.stringify({ script: script.voiceoverScript, voiceId }),
  });
  if (!voiceRes.ok) return NextResponse.json({ error: "Voiceover generation failed" }, { status: 500 });
  const voiceData = await voiceRes.json();
  if (!voiceData?.audioUrl) return NextResponse.json({ error: "Voiceover generation failed" }, { status: 500 });

  // Estimate voiceover duration from word count so the video timeline matches the audio.
  // ElevenLabs speaks at ~135 words/min on average with these voice settings.
  const wordCount = (script.voiceoverScript ?? "").trim().split(/\s+/).filter(Boolean).length;
  const estimatedAudioDuration = Math.max(10, Math.round((wordCount / 135) * 60));

  // 3. Submit Shotstack render
  const renderRes = await fetch(`${SITE_URL}/api/admin/reels/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token },
    body: JSON.stringify({
      script,
      voiceoverUrl: voiceData.audioUrl,
      estimatedAudioDuration,
      clips: suggestedClips ?? [],
      campaignIndex: campaignIdx,
      platforms: platforms ?? ["instagram", "facebook", "linkedin"],
      captions: buildCaptions(script),
      autoPost,
    }),
  });
  const renderData = renderRes.ok ? await renderRes.json() : null;
  if (!renderData?.renderId) {
    return NextResponse.json({ error: renderData?.error ?? "Render submission failed — add SHOTSTACK_API_KEY in Vercel" }, { status: 500 });
  }

  // Mark campaign used
  if (campaignIdx >= 0) {
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    if (!used.includes(campaignIdx)) {
      used.push(campaignIdx);
      await redis.set("reels:used_campaign_indexes", used);
    }
  }

  return NextResponse.json({
    ok: true,
    renderId: renderData.renderId,
    status: "rendering",
    script: { title: script.title, hook: script.hook, duration: script.duration },
    audioUrl: voiceData.audioUrl,
  });
}
