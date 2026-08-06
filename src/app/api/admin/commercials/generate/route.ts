import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

const INDUSTRIES = ["General", "HVAC", "Healthcare", "Construction", "Real Estate", "Manufacturing", "Legal", "Restaurant", "Finance", "Logistics", "Hospitality"] as const;

// ── Creative Director prompt ──────────────────────────────────────────────────
function directorPrompt(industry: string, campaignTheme: string): string {
  const industryVisuals: Record<string, string> = {
    HVAC: "premium commercial HVAC facilities, modern mechanical rooms, executive office buildings with sophisticated climate systems, architectural mechanical spaces",
    Healthcare: "premium hospitals, modern medical centers, executive healthcare facilities, clean clinical environments, state-of-the-art operating suites",
    Construction: "premium commercial construction sites at golden hour, modern architectural builds, glass curtain wall installation, structural steel against sky",
    "Real Estate": "luxury commercial developments, premium office towers, penthouse boardrooms, glass façades reflecting city skylines",
    Manufacturing: "precision robotics facilities, clean manufacturing floors, industrial automation, aerospace-grade production environments",
    Legal: "executive law firm offices, premium conference rooms, mahogany boardrooms, courthouse architecture, leather and steel interiors",
    Restaurant: "luxury restaurant kitchens, fine dining interiors, premium hospitality spaces, marble and glass dining rooms",
    Finance: "executive trading floors, premium financial offices, glass boardrooms, Wall Street architecture, Bloomberg terminal environments",
    Logistics: "modern distribution centers, drone delivery operations, smart warehouses, fleet management centers at dusk",
    Hospitality: "luxury hotel lobbies, premium resort architecture, executive concierge environments, marble and light interiors",
    General: "luxury architecture, modern headquarters, glass buildings, concrete interiors, executive offices, boardrooms, premium workspaces",
  };
  const visuals = industryVisuals[industry] ?? industryVisuals.General;

  return `You are the Executive Creative Director for CyberCraft360, an AI automation agency.

Your task: Generate ONE complete 30-second premium brand commercial screenplay.

Industry: ${industry}
Campaign Theme: ${campaignTheme || "AI systems that transform business operations"}

VISUAL STYLE: ${visuals}

CRITICAL RULES:
- Never mention Houston or any specific city
- Audience: CEOs, founders, operations managers, healthcare admins, contractors, manufacturers
- All Veo prompts must end with "no people, cinematic" to avoid content filters
- Every visual must feel like Apple, Porsche, Stripe, OpenAI, DJI, or McLaren
- Text overlays: MAXIMUM 5 WORDS — uppercase, punchy, intentional
- Voiceover: calm, deep, executive documentary tone. Short sentences. Natural pauses. Never salesy.

SCENE STRUCTURE (7 scenes, 4–5 seconds each):
1. HOOK — Powerful visual that commands attention
2. PROBLEM — The friction businesses feel
3. PAIN — Specific business pain point for ${industry}
4. INSIGHT — The reframe / perspective shift
5. SOLUTION — CyberCraft360's AI systems at work
6. TRANSFORMATION — The business after
7. CTA — Confident close

Return ONLY valid JSON matching this exact schema:
{
  "title": "string — internal commercial title",
  "hook": "string — 3-5 word powerful opening phrase (shown as hero text)",
  "voiceoverScript": "string — complete 28-35 second voiceover with natural pauses (use ellipsis ...)",
  "totalDuration": 32,
  "scenes": [
    {
      "scene": 1,
      "purpose": "hook",
      "duration": 5,
      "veoPrompt": "string — precise cinematic scene for Google Veo, luxury visuals, no people, cinematic",
      "textOverlay": "string — MAX 5 WORDS UPPERCASE",
      "voiceoverLines": ["line 1", "line 2"]
    }
  ],
  "endCard": {
    "headline": "BUILD BETTER SYSTEMS.",
    "cta": "Book Your AI Strategy"
  },
  "musicMood": "luxury ambient, minimal piano, cinematic tension"
}

Generate all 7 scenes. Return only the JSON object, no markdown.`;
}

// ── Keyword match: find best library clip for each scene ──────────────────────
function matchClipToScene(scenePurpose: string, veoPrompt: string, clips: any[]): any | null {
  if (!clips.length) return null;
  const terms = (scenePurpose + " " + veoPrompt).toLowerCase().split(/\W+/);
  const scored = clips.map((clip: any) => {
    const hay = (clip.prompt ?? "").toLowerCase();
    const score = terms.filter(t => t.length > 3 && hay.includes(t)).length;
    return { clip, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.clip ?? clips[0];
}

// ── Shotstack: build commercial-grade timeline ────────────────────────────────
function buildCommercialEdit(opts: {
  scenes: any[];
  clips: any[];          // one clip per scene (may repeat if library is small)
  voiceoverUrl: string;
  hook: string;
  endCard: { headline: string; cta: string };
  totalDuration: number;
}) {
  const { scenes, clips, voiceoverUrl, hook, endCard, totalDuration } = opts;
  const W = 1080, H = 1920;
  const LOGO_URL = `${SITE_URL}/logo.png`;

  // Per-scene timing
  const rawDurs = scenes.map((s: any) => Number(s.duration) || 4);
  const rawTotal = rawDurs.reduce((a, b) => a + b, 0);
  const scale = totalDuration / rawTotal;

  let t = 0;
  const timed = scenes.map((sc: any, i: number) => {
    const dur = Math.round(rawDurs[i] * scale * 10) / 10;
    const start = t;
    t += dur;
    return { ...sc, start, dur };
  });
  const contentDur = Math.round(t * 10) / 10;
  const endCardDur = 4;

  // ── 1. Background video track (one clip per scene) ──────────────────────────
  const bgClips = timed.map((sc: any, i: number) => {
    const clip = clips[i];
    if (!clip?.veoUri && !clip?.url) return null;
    return {
      asset: {
        type: "video",
        src: clip.veoUri
          ? `${SITE_URL}/api/admin/reels/clip-proxy?id=${clip.id}&token=${makeToken(process.env.ADMIN_SECRET ?? "")}`
          : clip.url,
        trim: 0,
        volume: 0,
      },
      start: sc.start,
      length: sc.dur + 0.4,
      effect: i % 2 === 0 ? "zoomIn" : "zoomOut",
      transition: { in: i === 0 ? "fade" : "fade", out: "fade" },
    };
  }).filter(Boolean);

  // ── 2. Cinematic grade overlay ──────────────────────────────────────────────
  const gradeHtml = `<html><body style="width:${W}px;height:${H}px;background:transparent;margin:0;padding:0;overflow:hidden;position:relative;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(0,0,0,0.5) 75%,rgba(0,0,0,0.8) 100%);"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:${Math.round(H*0.06)}px;background:linear-gradient(to bottom,rgba(0,0,0,0.7),transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(H*0.25)}px;background:linear-gradient(to top,rgba(0,0,0,0.88),transparent);"></div>
    <div style="position:absolute;inset:0;background:rgba(8,18,40,0.16);"></div>
  </body></html>`;

  // ── 3. Per-scene text overlays (Apple-style, max 5 words each) ───────────────
  const textClips = timed.map((sc: any, i: number) => {
    const overlay = sc.textOverlay?.trim();
    if (!overlay) return null;
    const fs = Math.round(W * (i === 0 ? 0.10 : 0.052));
    const isHero = i === 0;
    const html = isHero
      ? `<html><head><style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
          *{margin:0;padding:0;box-sizing:border-box;}
          @keyframes r{0%{opacity:0;transform:translateY(28px);}100%{opacity:1;transform:translateY(0);}}
          body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
            font-family:'Montserrat',Helvetica,Arial,sans-serif;
            display:flex;align-items:center;justify-content:center;padding:${Math.round(W*0.08)}px;text-align:center;}
          .t{font-size:${fs}px;font-weight:900;color:#fff;line-height:1.0;letter-spacing:-3px;
             text-shadow:0 4px 80px rgba(0,0,0,0.9);animation:r 0.9s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
        </style></head><body><div class="t">${overlay}</div></body></html>`
      : `<html><head><style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box;}
          @keyframes u{0%{opacity:0;transform:translateY(16px);}100%{opacity:1;transform:translateY(0);}}
          @keyframes l{0%{width:0;opacity:0;}100%{width:40px;opacity:1;}}
          body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;
            font-family:'Montserrat',Helvetica,Arial,sans-serif;
            display:flex;flex-direction:column;justify-content:flex-end;
            padding:${Math.round(W*0.08)}px ${Math.round(W*0.08)}px ${Math.round(W*0.12)}px;}
          .r{height:1.5px;background:#00D5FF;margin-bottom:${Math.round(W*0.02)}px;border-radius:1px;
             animation:l 0.4s 0.15s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;width:0;}
          .t{font-size:${fs}px;font-weight:700;color:#fff;line-height:1.2;letter-spacing:-0.5px;
             text-shadow:0 2px 40px rgba(0,0,0,0.95);animation:u 0.7s 0.25s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
        </style></head><body><div class="r"></div><div class="t">${overlay}</div></body></html>`;

    return {
      asset: { type: "html", html, width: W, height: H, background: "transparent" },
      start: sc.start + (isHero ? 0.3 : 0.5),
      length: sc.dur - (isHero ? 0.5 : 0.7),
    };
  }).filter(Boolean);

  // ── 4. Logo watermark (top-right, persistent) ────────────────────────────────
  const logoH = Math.round(H * 0.022);
  const logoHtml = `<html><head><style>
    @keyframes f{0%{opacity:0;}100%{opacity:1;}}
    *{margin:0;padding:0;} body{width:${W}px;height:${H}px;background:transparent;overflow:hidden;}
    .w{position:absolute;top:${Math.round(H*0.032)}px;right:${Math.round(W*0.06)}px;
       animation:f 1.5s ease forwards;opacity:0;}
    img{height:${logoH}px;width:auto;display:block;filter:brightness(0) invert(1);opacity:0.75;}
  </style></head><body><div class="w"><img src="${LOGO_URL}" crossorigin="anonymous"/></div></body></html>`;

  // ── 5. End card ──────────────────────────────────────────────────────────────
  const hfs = Math.round(W * 0.065);
  const cfs = Math.round(W * 0.028);
  const ecLogoH = Math.round(H * 0.048);
  const endCardHtml = `<html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    @keyframes f{0%{opacity:0;}100%{opacity:1;}}
    @keyframes u{0%{opacity:0;transform:translateY(24px);}100%{opacity:1;transform:translateY(0);}}
    @keyframes glow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.4);}100%{opacity:0.1;transform:translate(-50%,-50%) scale(1);}}
    body{width:${W}px;height:${H}px;background:#080A10;overflow:hidden;
      font-family:'Montserrat',Helvetica,Arial,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:${Math.round(W*0.04)}px;position:relative;}
    .glow{position:absolute;width:${Math.round(W*1.4)}px;height:${Math.round(W*1.4)}px;border-radius:50%;
      background:radial-gradient(circle,rgba(0,213,255,1) 0%,transparent 65%);
      left:50%;top:50%;pointer-events:none;
      animation:glow 2s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
    img{height:${ecLogoH}px;width:auto;filter:brightness(0) invert(1);
      animation:u 1s 0.1s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
    .rule{width:${Math.round(W*0.1)}px;height:1px;background:rgba(0,213,255,0.4);
      animation:f 0.5s 0.35s ease forwards;opacity:0;}
    .h{font-size:${hfs}px;font-weight:900;color:#fff;text-align:center;
      letter-spacing:-1.5px;line-height:1.05;max-width:85%;
      animation:u 0.9s 0.25s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
    .cta{font-size:${cfs}px;font-weight:300;color:rgba(255,255,255,0.45);text-align:center;
      letter-spacing:0.18em;text-transform:uppercase;
      animation:f 0.7s 0.5s ease forwards;opacity:0;}
    .url{font-size:${Math.round(cfs*0.88)}px;font-weight:400;color:#00D5FF;text-align:center;
      letter-spacing:0.06em;animation:f 0.7s 0.7s ease forwards;opacity:0;}
  </style></head><body>
    <div class="glow"></div>
    <img src="${LOGO_URL}" crossorigin="anonymous"/>
    <div class="rule"></div>
    <div class="h">${endCard.headline.replace(/</g,"&lt;")}</div>
    <div class="cta">${endCard.cta.replace(/</g,"&lt;")}</div>
    <div class="url">CyberCraft360.com</div>
  </body></html>`;

  return {
    timeline: {
      soundtrack: { src: voiceoverUrl, effect: "fadeOut", volume: 1 },
      background: "#080A10",
      tracks: [
        { clips: bgClips },
        { clips: [{ asset: { type: "html", html: gradeHtml, width: W, height: H, background: "transparent" }, start: 0, length: contentDur }] },
        { clips: textClips },
        { clips: [{ asset: { type: "html", html: logoHtml, width: W, height: H, background: "transparent" }, start: 0, length: contentDur }] },
        { clips: [{ asset: { type: "html", html: endCardHtml, width: W, height: H, background: "#080A10" }, start: contentDur, length: endCardDur, transition: { in: "fade" } }] },
      ],
    },
    output: { format: "mp4", resolution: "1080", aspectRatio: "9:16", fps: 30, quality: "high" },
    callback: `${SITE_URL}/api/reels/shotstack-webhook`,
  };
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = makeToken(process.env.ADMIN_SECRET ?? "");
  const groqKey = process.env.GROQ_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  const shotstackKey = process.env.SHOTSTACK_API_KEY;

  if (!groqKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
  if (!elevenlabsKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
  if (!shotstackKey) return NextResponse.json({ error: "SHOTSTACK_API_KEY not set" }, { status: 500 });

  const { industry = "General", campaignTheme = "", voiceId = "EXAVITQu4vr4xnSDxMaL" } = await req.json().catch(() => ({}));

  // ── Step 1: Creative Director generates screenplay ──────────────────────────
  const llmRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      messages: [
        { role: "system", content: "You are a premium brand commercial Creative Director. Return only valid JSON." },
        { role: "user", content: directorPrompt(industry, campaignTheme) },
      ],
    }),
  });
  if (!llmRes.ok) return NextResponse.json({ error: "Screenplay generation failed" }, { status: 500 });
  const llmData = await llmRes.json();
  let screenplay: any;
  try {
    const raw = llmData.choices?.[0]?.message?.content ?? "";
    const json = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    screenplay = JSON.parse(json);
  } catch {
    return NextResponse.json({ error: "Failed to parse screenplay JSON from LLM" }, { status: 500 });
  }

  // ── Step 2: Match scenes to library clips ────────────────────────────────────
  const libraryClips: any[] = (await redis.get<any[]>("reels:clip_library") ?? [])
    .filter((c: any) => c.veoUri && (!c.expiresAt || new Date(c.expiresAt).getTime() > Date.now()));

  const selectedClips = (screenplay.scenes ?? []).map((sc: any) =>
    matchClipToScene(sc.purpose ?? "", sc.veoPrompt ?? "", libraryClips)
  );

  // ── Step 3: Generate voiceover via ElevenLabs ─────────────────────────────
  const voiceoverRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "xi-api-key": elevenlabsKey },
    body: JSON.stringify({
      text: screenplay.voiceoverScript,
      model_id: "eleven_turbo_v2",
      voice_settings: { stability: 0.72, similarity_boost: 0.78, style: 0.15, use_speaker_boost: true },
    }),
  });
  if (!voiceoverRes.ok) {
    const err = await voiceoverRes.text();
    return NextResponse.json({ error: `Voiceover failed: ${err.slice(0, 200)}` }, { status: 500 });
  }

  // Upload voiceover audio to Shotstack ingest
  const audioBuffer = Buffer.from(await voiceoverRes.arrayBuffer());
  const ssBase = process.env.SHOTSTACK_ENV === "production"
    ? "https://api.shotstack.io/v1"
    : "https://api.shotstack.io/stage/v1";

  // Use a data URI for the audio (Shotstack accepts base64 audio)
  const audioDataUri = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;

  // Store audio in Upstash temporarily (fetch via a route)
  const audioKey = `commercial:audio:${Date.now()}`;
  await redis.set(audioKey, audioBuffer.toString("base64"), { ex: 3600 });
  const voiceoverUrl = `${SITE_URL}/api/admin/commercials/audio?key=${encodeURIComponent(audioKey)}&token=${token}`;

  // ── Step 4: Shotstack render ──────────────────────────────────────────────
  const wordCount = (screenplay.voiceoverScript ?? "").trim().split(/\s+/).length;
  const estimatedDuration = Math.min(35, Math.max(28, Math.round((wordCount / 135) * 60)));

  const edit = buildCommercialEdit({
    scenes: screenplay.scenes ?? [],
    clips: selectedClips,
    voiceoverUrl,
    hook: screenplay.hook ?? "SYSTEMS WIN.",
    endCard: screenplay.endCard ?? { headline: "BUILD BETTER SYSTEMS.", cta: "Book Your AI Strategy" },
    totalDuration: estimatedDuration,
  });

  const ssRes = await fetch(`${ssBase}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": shotstackKey },
    body: JSON.stringify(edit),
  });
  const ssData = await ssRes.json();
  if (!ssRes.ok) return NextResponse.json({ error: ssData?.response?.message ?? "Shotstack failed", detail: ssData }, { status: 500 });

  const renderId: string = ssData.response?.id;
  if (!renderId) return NextResponse.json({ error: "No render ID" }, { status: 500 });

  await redis.set(`commercial:${renderId}`, {
    renderId, industry, campaignTheme,
    screenplay, selectedClips: selectedClips.map((c: any) => c?.id),
    status: "rendering", submittedAt: new Date().toISOString(),
  }, { ex: 7 * 24 * 3600 });

  return NextResponse.json({ ok: true, renderId, screenplay, status: "rendering" });
}

// List past commercials
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // We store by renderId — poll status via Shotstack
  return NextResponse.json({ ok: true, message: "Use /api/admin/commercials/status/:id to check render" });
}
