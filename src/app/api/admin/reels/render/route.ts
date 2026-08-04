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

// ── CSS shared across all HTML assets ────────────────────────────────────────
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
@keyframes slideUp{0%{transform:translateY(48px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
@keyframes fadeIn{0%{opacity:0;}100%{opacity:1;}}
@keyframes lineExpand{0%{width:0;opacity:0;}100%{width:64px;opacity:1;}}
@keyframes glow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.7);}60%{opacity:0.18;}100%{opacity:0.06;transform:translate(-50%,-50%) scale(1.1);}}
`;

// ── LOGO OVERLAY (persistent across all scenes) ───────────────────────────────
function logoHtml(w: number, h: number): string {
  const logoH = Math.round(h * 0.028); // ~2.8% of frame height
  return `<html><head><style>${SHARED_CSS}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;font-family:'Montserrat',sans-serif;}
.logo-wrap{position:absolute;top:${Math.round(h*0.038)}px;left:50%;transform:translateX(-50%);animation:fadeIn 1.2s ease forwards;}
img{height:${logoH}px;width:auto;display:block;filter:brightness(0) invert(1) drop-shadow(0 2px 12px rgba(0,0,0,0.8));}
</style></head><body>
<div class="logo-wrap"><img src="${LOGO_URL}" crossorigin="anonymous"/></div>
</body></html>`;
}

// ── DARK CINEMATIC OVERLAY ────────────────────────────────────────────────────
function vignetteHtml(w: number, h: number): string {
  return `<html><head><style>*{margin:0;padding:0;}</style></head>
<body style="width:${w}px;height:${h}px;background:linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 20%,rgba(0,0,0,0.05) 50%,rgba(0,0,0,0.45) 75%,rgba(0,0,0,0.88) 100%);overflow:hidden;"></body></html>`;
}

// ── HOOK SCENE: full-frame centered impact statement ─────────────────────────
function hookHtml(text: string, w: number, h: number): string {
  const fs = Math.round(w * 0.088);
  return `<html><head><style>${SHARED_CSS}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;font-family:'Montserrat',sans-serif;display:flex;align-items:center;justify-content:center;padding:${Math.round(w*0.08)}px;text-align:center;}
.t{font-size:${fs}px;font-weight:900;color:#fff;line-height:1.0;letter-spacing:-3px;text-shadow:0 4px 60px rgba(0,0,0,0.98),0 0 120px rgba(0,0,0,0.6);animation:slideUp 1s 0.15s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
</style></head><body><p class="t">${text.replace(/</g,"&lt;")}</p></body></html>`;
}

// ── NARRATION SCENE: bottom-anchored with animated accent line ────────────────
function narrationHtml(text: string, w: number, h: number, delay: number = 0): string {
  const fs = Math.round(w * 0.054);
  const pad = Math.round(w * 0.075);
  const d = (delay * 1000).toFixed(0);
  return `<html><head><style>${SHARED_CSS}
body{width:${w}px;height:${h}px;background:transparent;overflow:hidden;font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;justify-content:flex-end;padding:${pad}px;}
.line{height:2px;background:#00D5FF;margin-bottom:20px;animation:lineExpand 0.6s ${d}ms cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;border-radius:1px;}
.t{font-size:${fs}px;font-weight:900;color:#fff;line-height:1.1;letter-spacing:-1px;text-shadow:0 2px 40px rgba(0,0,0,0.98);animation:slideUp 0.9s ${Number(d)+150}ms cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;max-width:90%;}
</style></head><body>
<div class="line"></div>
<p class="t">${text.replace(/</g,"&lt;")}</p>
</body></html>`;
}

// ── END CARD: branded premium close ──────────────────────────────────────────
function endCardHtml(headline: string, cta: string, url: string, w: number, h: number): string {
  const logoH = Math.round(h * 0.052);
  const hfs = Math.round(w * 0.055);
  const cfs = Math.round(w * 0.033);
  const ufs = Math.round(w * 0.023);
  return `<html><head><style>${SHARED_CSS}
body{width:${w}px;height:${h}px;background:#0F1117;overflow:hidden;font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(w*0.045)}px;position:relative;}
.glow{position:absolute;width:${Math.round(w*0.8)}px;height:${Math.round(w*0.8)}px;border-radius:50%;background:radial-gradient(circle,rgba(0,213,255,0.35) 0%,transparent 65%);left:50%;top:50%;transform:translate(-50%,-50%);animation:glow 3s 0.5s ease forwards;opacity:0;pointer-events:none;}
img{height:${logoH}px;width:auto;display:block;filter:brightness(0) invert(1);animation:slideUp 0.9s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
.headline{font-size:${hfs}px;font-weight:900;color:#fff;text-align:center;letter-spacing:-1.5px;line-height:1.05;animation:slideUp 0.9s 0.35s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;max-width:90%;}
.cta{font-size:${cfs}px;font-weight:700;color:#00D5FF;text-align:center;letter-spacing:0.08em;text-transform:uppercase;animation:slideUp 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) forwards;opacity:0;}
.url{font-size:${ufs}px;font-weight:400;color:rgba(255,255,255,0.38);text-align:center;letter-spacing:0.05em;animation:fadeIn 0.8s 0.8s ease forwards;opacity:0;}
</style></head><body>
<div class="glow"></div>
<img src="${LOGO_URL}" crossorigin="anonymous"/>
<div class="headline">${headline.replace(/</g,"&lt;")}</div>
<div class="cta">${cta.replace(/</g,"&lt;")}</div>
<div class="url">${url.replace(/</g,"&lt;")}</div>
</body></html>`;
}

function buildEdit(opts: {
  scenes: any[];
  voiceoverUrl: string;
  clips: any[];
  hook: string;
  endCard: { headline: string; cta: string; url: string };
}) {
  const { scenes, voiceoverUrl, clips, hook, endCard } = opts;

  // 1080p portrait canvas
  const W = 1080, H = 1920;

  // Compute scene timing
  let t = 0;
  const timed = scenes.map((sc: any) => {
    const dur = parseDuration(sc.duration ?? 5);
    const start = t;
    t += dur;
    return { ...sc, start, dur };
  });
  const contentDuration = t;
  const endCardDur = 7;
  const totalDuration = contentDuration + endCardDur;

  // Background video clips — prefer portrait, cycle through available
  const goodClips = clips.filter((c: any) => c.url && c.duration >= 3);
  const bgClips: any[] = [];
  let cursor = 0;
  let ci = 0;
  while (cursor < contentDuration) {
    if (goodClips.length === 0) break;
    const c = goodClips[ci % goodClips.length];
    const len = Math.min(c.duration, contentDuration - cursor, 9);
    if (len < 0.5) break;
    bgClips.push({
      asset: { type: "video", src: c.url, trim: 0, volume: 0 },
      start: cursor,
      length: len + 0.4,
      effect: ci % 2 === 0 ? "zoomIn" : "zoomOut",
      transition: { in: "fade", out: "fade" },
    });
    cursor += len;
    ci++;
  }
  // Black fill for remainder (or if no clips)
  if (cursor < contentDuration) {
    bgClips.push({
      asset: { type: "html", html: `<html><body style="width:${W}px;height:${H}px;background:#000;"></body></html>`, width: W, height: H, background: "transparent" },
      start: cursor, length: contentDuration - cursor,
    });
  }

  // Vignette overlay (full content duration)
  const vignetteClip = {
    asset: { type: "html", html: vignetteHtml(W, H), width: W, height: H, background: "transparent" },
    start: 0, length: contentDuration,
  };

  // Scene text clips — hook = centered big, rest = bottom narration
  const textClips = timed.map((sc: any, i: number) => ({
    asset: {
      type: "html",
      html: i === 0 ? hookHtml(hook, W, H) : narrationHtml(sc.narration, W, H, 0.1),
      width: W, height: H, background: "transparent",
    },
    start: sc.start + 0.3,
    length: sc.dur - 0.3,
  }));

  // Logo — persistent watermark throughout content
  const logoClip = {
    asset: { type: "html", html: logoHtml(W, H), width: W, height: H, background: "transparent" },
    start: 0, length: contentDuration,
  };

  // End card (black bg + logo + text, all animated via CSS)
  const endClip = {
    asset: {
      type: "html",
      html: endCardHtml(endCard.headline, endCard.cta, endCard.url, W, H),
      width: W, height: H, background: "transparent",
    },
    start: contentDuration,
    length: endCardDur,
    transition: { in: "fade" },
  };

  return {
    timeline: {
      soundtrack: { src: voiceoverUrl, effect: "fadeOut", volume: 1 },
      background: "#0F1117",
      tracks: [
        { clips: bgClips },         // 0: BG video (bottom)
        { clips: [vignetteClip] },  // 1: cinematic gradient overlay
        { clips: textClips },       // 2: animated scene narrations
        { clips: [logoClip] },      // 3: persistent logo watermark
        { clips: [endClip] },       // 4: branded end card (top)
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

  const { script, voiceoverUrl, clips, campaignIndex, platforms, captions } = await req.json().catch(() => ({}));
  if (!script?.scenes || !voiceoverUrl) return NextResponse.json({ error: "script and voiceoverUrl required" }, { status: 400 });

  const edit = buildEdit({
    scenes: script.scenes,
    voiceoverUrl,
    clips: clips ?? [],
    hook: script.hook ?? script.scenes[0]?.narration ?? "",
    endCard: script.endCard ?? { headline: "Built For You", cta: "Schedule Your Discovery", url: "CyberCraft360.com" },
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
    status: "rendering",
    submittedAt: new Date().toISOString(),
  }, { ex: 48 * 3600 });

  return NextResponse.json({ ok: true, renderId, status: "rendering" });
}
