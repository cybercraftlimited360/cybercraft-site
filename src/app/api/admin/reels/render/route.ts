import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
const LOGO_URL = `${SITE_URL}/logo.png`;

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

function parseDuration(d: string | number): number {
  if (typeof d === "number") return d;
  const m = String(d).match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : 5;
}

// ── CINEMATIC VIGNETTE + COLOR GRADE ─────────────────────────────────────────
// Lifted blacks, dark edges, cold desaturated grade — Apple/McLaren feel
function gradeHtml(w: number, h: number): string {
  return `<html><head><style>*{margin:0;padding:0;}</style></head>
<body style="width:${w}px;height:${h}px;overflow:hidden;position:relative;background:transparent;">
  <!-- Edge vignette -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(0,0,0,0.55) 75%,rgba(0,0,0,0.85) 100%);"></div>
  <!-- Top & bottom bars — cinematic letterbox feel -->
  <div style="position:absolute;top:0;left:0;right:0;height:${Math.round(h*0.06)}px;background:linear-gradient(to bottom,rgba(0,0,0,0.72),transparent);"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:${Math.round(h*0.22)}px;background:linear-gradient(to top,rgba(0,0,0,0.9),rgba(0,0,0,0.2) 60%,transparent);"></div>
  <!-- Cold blue cast overlay for tech feel -->
  <div style="position:absolute;inset:0;background:rgba(8,18,40,0.18);mix-blend-mode:multiply;"></div>
</body></html>`;
}

// ── LOGO — small, top-center, elegant ────────────────────────────────────────
function logoHtml(w: number, h: number): string {
  const logoH = Math.round(h * 0.022);
  return `<html><head><style>
*{margin:0;padding:0;}
@keyframes f{0%{opacity:0;}100%{opacity:1;}}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;}
.w{position:absolute;top:${Math.round(h*0.032)}px;left:50%;transform:translateX(-50%);animation:f 1.8s ease forwards;opacity:0;}
img{height:${logoH}px;width:auto;display:block;filter:brightness(0) invert(1);opacity:0.82;}
</style></head><body>
<div class="w"><img src="${LOGO_URL}" crossorigin="anonymous"/></div>
</body></html>`;
}

// ── HERO TEXT — one large phrase, Apple-style centered reveal ─────────────────
function heroHtml(text: string, w: number, h: number): string {
  const fs = Math.round(w * 0.092);
  const words = text.trim().split(/\s+/);
  // Split into max 3 lines of 2-3 words each for dramatic effect
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += 3) lines.push(words.slice(i, i + 3).join(" "));

  const lineHtml = lines.map((l, i) =>
    `<div class="l" style="animation-delay:${(i * 0.18 + 0.1).toFixed(2)}s">${l.replace(/</g, "&lt;")}</div>`
  ).join("");

  return `<html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&display=swap');
@keyframes reveal{0%{opacity:0;transform:translateY(32px);}100%{opacity:1;transform:translateY(0);}}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;
  font-family:'Montserrat',Helvetica,Arial,sans-serif;
  display:flex;align-items:center;justify-content:center;
  padding:${Math.round(w*0.07)}px;text-align:center;}
.wrap{display:flex;flex-direction:column;gap:${Math.round(w*0.008)}px;}
.l{font-size:${fs}px;font-weight:900;color:#fff;line-height:1.0;
   letter-spacing:-2.5px;text-shadow:0 4px 80px rgba(0,0,0,0.9);
   opacity:0;animation:reveal 0.9s cubic-bezier(0.16,1,0.3,1) forwards;}
</style></head><body>
<div class="wrap">${lineHtml}</div>
</body></html>`;
}

// ── SCENE TEXT — minimal lower-third, one phrase at a time ───────────────────
function sceneTextHtml(text: string, w: number, h: number, delay: number = 0): string {
  const fs = Math.round(w * 0.042);
  const pad = Math.round(w * 0.08);
  const d = (delay * 1000).toFixed(0);
  return `<html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;700&display=swap');
@keyframes up{0%{opacity:0;transform:translateY(20px);}100%{opacity:1;transform:translateY(0);}}
@keyframes rule{0%{width:0;opacity:0;}100%{width:36px;opacity:1;}}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;
  font-family:'Montserrat',Helvetica,Arial,sans-serif;
  display:flex;flex-direction:column;justify-content:flex-end;
  padding:${pad}px ${pad}px ${Math.round(pad*1.4)}px;}
.r{height:1.5px;background:#00D5FF;margin-bottom:${Math.round(w*0.022)}px;border-radius:1px;
   animation:rule 0.5s ${d}ms cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;width:0;}
.t{font-size:${fs}px;font-weight:700;color:#fff;line-height:1.25;
   letter-spacing:-0.5px;text-shadow:0 2px 40px rgba(0,0,0,0.95);
   animation:up 0.7s ${Number(d)+120}ms cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;max-width:88%;}
</style></head><body>
<div class="r"></div>
<p class="t">${text.replace(/</g, "&lt;")}</p>
</body></html>`;
}

// ── END CARD — pure black, centered, surgical ─────────────────────────────────
function endCardHtml(headline: string, cta: string, w: number, h: number): string {
  const logoH = Math.round(h * 0.045);
  const hfs = Math.round(w * 0.06);
  const cfs = Math.round(w * 0.028);
  return `<html><head><style>
*{margin:0;padding:0;box-sizing:border-box;}
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');
@keyframes f{0%{opacity:0;}100%{opacity:1;}}
@keyframes up{0%{opacity:0;transform:translateY(24px);}100%{opacity:1;transform:translateY(0);}}
@keyframes glow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.5);}100%{opacity:0.12;transform:translate(-50%,-50%) scale(1);}}
body{width:${w}px;height:${h}px;background:#080A10;overflow:hidden;
  font-family:'Montserrat',Helvetica,Arial,sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:${Math.round(w*0.05)}px;position:relative;}
.glow{position:absolute;width:${Math.round(w*1.2)}px;height:${Math.round(w*1.2)}px;border-radius:50%;
  background:radial-gradient(circle,rgba(0,213,255,1) 0%,transparent 60%);
  left:50%;top:50%;pointer-events:none;
  animation:glow 2s 0.3s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
img{height:${logoH}px;width:auto;filter:brightness(0) invert(1);
  animation:up 1s 0.15s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
.rule{width:${Math.round(w*0.08)}px;height:1px;background:rgba(0,213,255,0.5);
  animation:f 0.6s 0.4s ease forwards;opacity:0;}
.h{font-size:${hfs}px;font-weight:900;color:#fff;text-align:center;
  letter-spacing:-1.5px;line-height:1.05;max-width:88%;
  animation:up 0.9s 0.3s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
.cta{font-size:${cfs}px;font-weight:300;color:rgba(255,255,255,0.5);text-align:center;
  letter-spacing:0.18em;text-transform:uppercase;
  animation:f 0.8s 0.6s ease forwards;opacity:0;}
.url{font-size:${Math.round(cfs*0.85)}px;font-weight:400;color:#00D5FF;text-align:center;
  letter-spacing:0.06em;
  animation:f 0.8s 0.85s ease forwards;opacity:0;}
</style></head><body>
<div class="glow"></div>
<img src="${LOGO_URL}" crossorigin="anonymous"/>
<div class="rule"></div>
<div class="h">${headline.replace(/</g, "&lt;")}</div>
<div class="cta">${cta.replace(/</g, "&lt;")}</div>
<div class="url">CyberCraft360.com</div>
</body></html>`;
}

function buildEdit(opts: {
  scenes: any[];
  voiceoverUrl: string;
  clips: any[];
  hook: string;
  endCard: { headline: string; cta: string };
  estimatedAudioDuration?: number;
}) {
  const { scenes, voiceoverUrl, clips, hook, endCard, estimatedAudioDuration } = opts;
  const W = 1080, H = 1920;

  // Compute raw scene durations from script
  const rawDurs = scenes.map((sc: any) => parseDuration(sc.duration ?? 5));
  const rawTotal = rawDurs.reduce((a, b) => a + b, 0);

  // Scale scene durations so they sum to estimatedAudioDuration, keeping proportions.
  // This ensures the video and voiceover stay in sync regardless of AI script estimates.
  const targetDuration = estimatedAudioDuration && estimatedAudioDuration > 5
    ? estimatedAudioDuration
    : rawTotal;
  const scale = targetDuration / rawTotal;

  let t = 0;
  const timed = scenes.map((sc: any, i: number) => {
    const dur = Math.round(rawDurs[i] * scale * 10) / 10;
    const start = t;
    t += dur;
    return { ...sc, start, dur };
  });
  const contentDuration = Math.round(t * 10) / 10;
  const endCardDur = 8;
  const totalDuration = contentDuration + endCardDur;

  // Background clips — cycle AI clips, slow ken-burns motion
  const goodClips = clips.filter((c: any) => c.url && c.duration >= 3);
  const bgClips: any[] = [];
  let cursor = 0, ci = 0;
  const effects = ["zoomIn", "zoomOut", "slideLeft", "slideRight"];
  while (cursor < contentDuration) {
    if (goodClips.length === 0) break;
    const c = goodClips[ci % goodClips.length];
    const len = Math.min(c.duration, contentDuration - cursor, 8);
    if (len < 0.5) break;
    bgClips.push({
      asset: { type: "video", src: c.url, trim: 0, volume: 0 },
      start: cursor,
      length: len + 0.5,
      effect: effects[ci % effects.length],
      transition: { in: "fade", out: "fade" },
    });
    cursor += len;
    ci++;
  }
  if (cursor < contentDuration || bgClips.length === 0) {
    bgClips.push({
      asset: { type: "html", html: `<html><body style="width:${W}px;height:${H}px;background:#080A10;"></body></html>`, width: W, height: H, background: "transparent" },
      start: cursor, length: Math.max(contentDuration - cursor, contentDuration),
    });
  }

  // Cinematic grade (vignette + color overlay)
  const gradeClip = {
    asset: { type: "html", html: gradeHtml(W, H), width: W, height: H, background: "transparent" },
    start: 0, length: contentDuration,
  };

  // Scene text — hook scene = full-frame hero, rest = lower-third
  const textClips = timed.map((sc: any, i: number) => ({
    asset: {
      type: "html",
      html: i === 0 ? heroHtml(hook, W, H) : sceneTextHtml(sc.narration, W, H, 0.15),
      width: W, height: H, background: "transparent",
    },
    start: sc.start + 0.25,
    length: sc.dur - 0.25,
  }));

  // Logo — subtle, persistent
  const logoClip = {
    asset: { type: "html", html: logoHtml(W, H), width: W, height: H, background: "transparent" },
    start: 0, length: contentDuration,
  };

  // End card — pure black background, centered everything
  const endClip = {
    asset: {
      type: "html",
      html: endCardHtml(endCard.headline, endCard.cta, W, H),
      width: W, height: H, background: "#080A10",
    },
    start: contentDuration,
    length: endCardDur,
    transition: { in: "fade" },
  };

  return {
    timeline: {
      soundtrack: { src: voiceoverUrl, effect: "fadeOut", volume: 1 },
      background: "#080A10",
      tracks: [
        { clips: bgClips },        // 0: AI video clips (bottom)
        { clips: [gradeClip] },    // 1: cinematic grade + vignette
        { clips: textClips },      // 2: scene text overlays
        { clips: [logoClip] },     // 3: logo watermark
        { clips: [endClip] },      // 4: end card (top)
      ],
    },
    output: {
      format: "mp4",
      resolution: "1080",
      aspectRatio: "9:16",
      fps: 30,
      quality: "high",
    },
    callback: `${SITE_URL}/api/reels/shotstack-webhook`,
  };
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SHOTSTACK_API_KEY not set" }, { status: 500 });

  const { script, voiceoverUrl, clips, campaignIndex, platforms, captions, autoPost = true, estimatedAudioDuration } = await req.json().catch(() => ({}));
  if (!script?.scenes || !voiceoverUrl) return NextResponse.json({ error: "script and voiceoverUrl required" }, { status: 400 });

  const edit = buildEdit({
    scenes: script.scenes,
    voiceoverUrl,
    clips: clips ?? [],
    hook: script.hook ?? script.scenes[0]?.narration ?? "",
    endCard: script.endCard ?? { headline: "Intelligence That Works For You", cta: "Schedule Your Discovery" },
    estimatedAudioDuration,
  });

  const ssBase = process.env.SHOTSTACK_ENV === "production"
    ? "https://api.shotstack.io/v1"
    : "https://api.shotstack.io/stage/v1";

  const res = await fetch(`${ssBase}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(edit),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[shotstack/render]", JSON.stringify(data));
    return NextResponse.json({ error: data?.response?.message ?? "Shotstack render failed", detail: data }, { status: 500 });
  }

  const renderId: string = data.response?.id;
  if (!renderId) return NextResponse.json({ error: "No render ID returned" }, { status: 500 });

  await redis.set(`reels:shotstack:${renderId}`, {
    renderId,
    campaignIndex: campaignIndex ?? -1,
    platforms: platforms ?? ["instagram", "facebook"],
    captions: captions ?? {},
    script,
    autoPost,
    status: "rendering",
    submittedAt: new Date().toISOString(),
  }, { ex: 48 * 3600 });

  return NextResponse.json({ ok: true, renderId, status: "rendering" });
}
