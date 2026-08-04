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
  return m ? parseFloat(m[1]) : 4;
}

function sceneHtml(narration: string, isHook: boolean, w: number, h: number): string {
  const fs = isHook ? Math.round(w * 0.095) : Math.round(w * 0.057);
  const align = isHook ? "center" : "left";
  const valign = isHook ? "center" : "flex-end";
  const pad = Math.round(w * 0.072);
  return `<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;font-family:'Montserrat',sans-serif;}
.w{width:100%;height:100%;display:flex;flex-direction:column;align-items:${isHook?"center":"flex-start"};justify-content:${valign};padding:${pad}px;}
p{font-size:${fs}px;font-weight:900;color:#fff;line-height:${isHook?1.0:1.2};letter-spacing:${isHook?"-2px":"-0.5px"};text-align:${align};text-shadow:0 2px 40px rgba(0,0,0,0.95),0 0 80px rgba(0,0,0,0.7);}
</style></head><body><div class="w"><p>${narration.replace(/"/g,"&quot;").replace(/</g,"&lt;")}</p></div></body></html>`;
}

function overlayHtml(w: number, h: number): string {
  return `<html><body style="margin:0;width:${w}px;height:${h}px;background:linear-gradient(to bottom,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.08) 30%,rgba(0,0,0,0.55) 70%,rgba(0,0,0,0.82) 100%);"></body></html>`;
}

function endCardHtml(headline: string, cta: string, url: string, w: number, h: number): string {
  const hfs = Math.round(w * 0.058);
  const cfs = Math.round(w * 0.036);
  const ufs = Math.round(w * 0.026);
  return `<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{width:${w}px;height:${h}px;background:#0F1117;display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;}
.c{display:flex;flex-direction:column;align-items:center;gap:${Math.round(w*0.04)}px;padding:${Math.round(w*0.08)}px;}
.h{font-size:${hfs}px;font-weight:900;color:#fff;text-align:center;letter-spacing:-1.5px;line-height:1.1;}
.cta{font-size:${cfs}px;font-weight:700;color:#00D5FF;text-align:center;letter-spacing:0.06em;text-transform:uppercase;}
.url{font-size:${ufs}px;font-weight:400;color:rgba(255,255,255,0.4);text-align:center;letter-spacing:0.04em;}
</style></head><body><div class="c">
<div class="h">${headline.replace(/</g,"&lt;")}</div>
<div class="cta">${cta.replace(/</g,"&lt;")}</div>
<div class="url">${url.replace(/</g,"&lt;")}</div>
</div></body></html>`;
}

function buildEdit(opts: {
  scenes: any[];
  voiceoverUrl: string;
  clips: any[];
  hook: string;
  endCard: { headline: string; cta: string; url: string };
}) {
  const { scenes, voiceoverUrl, clips, hook, endCard } = opts;

  // Canvas dimensions for HD 9:16
  const W = 720, H = 1280;

  // Compute timing
  let t = 0;
  const timed = scenes.map((sc: any) => {
    const dur = parseDuration(sc.duration ?? 4);
    const start = t;
    t += dur;
    return { ...sc, start, dur };
  });
  const contentDuration = t;
  const endCardDur = 6;
  const totalDuration = contentDuration + endCardDur;

  // Background video clips track
  const bgClips: any[] = [];
  let cursor = 0;
  let ci = 0;
  const goodClips = clips.filter((c: any) => c.url && c.duration >= 3);
  while (cursor < contentDuration && goodClips.length > 0) {
    const c = goodClips[ci % goodClips.length];
    const len = Math.min(c.duration, contentDuration - cursor, 10);
    if (len < 1) break;
    bgClips.push({
      asset: { type: "video", src: c.url, trim: 0, volume: 0 },
      start: cursor,
      length: len + 0.3,
      effect: ci % 2 === 0 ? "zoomIn" : "zoomOut",
      transition: { in: "fade", out: "fade" },
    });
    cursor += len;
    ci++;
  }
  // Fill remainder with last clip or black
  if (cursor < contentDuration && goodClips.length > 0) {
    const c = goodClips[(ci - 1) % goodClips.length];
    bgClips.push({ asset: { type: "video", src: c.url, trim: 0, volume: 0 }, start: cursor, length: contentDuration - cursor + 0.3, transition: { in: "fade", out: "fade" } });
  }

  // Gradient overlay (entire content section)
  const overlayClip = {
    asset: { type: "html", html: overlayHtml(W, H), width: W, height: H, background: "transparent" },
    start: 0, length: contentDuration,
  };

  // Scene text clips
  const textClips = timed.map((sc: any, i: number) => ({
    asset: {
      type: "html",
      html: sceneHtml(i === 0 ? hook : sc.narration, i === 0, W, H),
      width: W, height: H, background: "transparent",
    },
    start: sc.start + 0.5,
    length: sc.dur - 0.5,
    transition: { in: "fade", out: "fade" },
  }));

  // Logo watermark (throughout content)
  const logoClip = {
    asset: { type: "image", src: LOGO_URL },
    start: 0,
    length: contentDuration,
    fit: "contain",
    scale: 0.28,
    position: "top",
    offset: { x: 0, y: 0.08 },
    transition: { in: "fade", out: "fade" },
  };

  // End card HTML
  const endCardClip = {
    asset: {
      type: "html",
      html: endCardHtml(endCard.headline, endCard.cta, endCard.url, W, H),
      width: W, height: H, background: "transparent",
    },
    start: contentDuration,
    length: endCardDur,
    transition: { in: "fade" },
  };

  // End card logo (large centered)
  const endLogoClip = {
    asset: { type: "image", src: LOGO_URL },
    start: contentDuration + 0.5,
    length: endCardDur - 0.5,
    fit: "contain",
    scale: 0.5,
    position: "top",
    offset: { x: 0, y: -0.05 },
    transition: { in: "fade" },
  };

  return {
    timeline: {
      soundtrack: { src: voiceoverUrl, effect: "fadeOut", volume: 1 },
      background: "#0F1117",
      tracks: [
        { clips: bgClips },           // 0: BG video
        { clips: [overlayClip] },     // 1: dark overlay
        { clips: textClips },         // 2: scene narrations
        { clips: [logoClip] },        // 3: logo watermark
        { clips: [endCardClip] },     // 4: end card bg
        { clips: [endLogoClip] },     // 5: end card logo
      ],
    },
    output: {
      format: "mp4",
      resolution: "hd",
      aspectRatio: "9:16",
      fps: 25,
      quality: "high",
    },
    callback: `${SITE_URL}/api/reels/shotstack-webhook`,
  };
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SHOTSTACK_API_KEY not set" }, { status: 500 });

  const { script, voiceoverUrl, clips, campaignIndex, platforms, captions } = await req.json().catch(() => ({}));
  if (!script?.scenes || !voiceoverUrl) return NextResponse.json({ error: "script and voiceoverUrl required" }, { status: 400 });

  const edit = buildEdit({ scenes: script.scenes, voiceoverUrl, clips: clips ?? [], hook: script.hook ?? script.scenes[0]?.narration ?? "", endCard: script.endCard ?? { headline: "Built For You", cta: "Schedule Your Discovery", url: "CyberCraft360.com" } });

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
    console.error("[shotstack/render]", data);
    return NextResponse.json({ error: data?.response?.message ?? "Shotstack render failed", detail: data }, { status: 500 });
  }

  const renderId: string = data.response?.id;
  if (!renderId) return NextResponse.json({ error: "No render ID returned" }, { status: 500 });

  // Store job context in Redis for webhook to pick up
  await redis.set(`reels:shotstack:${renderId}`, {
    renderId,
    campaignIndex: campaignIndex ?? -1,
    platforms: platforms ?? ["instagram", "facebook"],
    captions: captions ?? {},
    script,
    status: "rendering",
    submittedAt: new Date().toISOString(),
  }, { ex: 48 * 3600 });

  return NextResponse.json({ ok: true, renderId, status: "rendering" });
}
