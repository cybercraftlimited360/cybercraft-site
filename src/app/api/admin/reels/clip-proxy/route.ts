import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const CLIP_LIBRARY_KEY = "reels:clip_library";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  const s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return new NextResponse("Unauthorized", { status: 401 });

  const clipId = req.nextUrl.searchParams.get("id");
  const disposition = req.nextUrl.searchParams.get("disposition") ?? "inline";

  if (!clipId) return new NextResponse("Missing id", { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new NextResponse("GEMINI_API_KEY not set", { status: 500 });

  const clips = await redis.get<any[]>(CLIP_LIBRARY_KEY) ?? [];
  const clip = clips.find((c: any) => c.id === clipId);
  if (!clip?.veoUri) return new NextResponse("Clip not found", { status: 404 });

  // Fetch from Veo with API key — server-side only, key never exposed to browser
  const fetchUrl = clip.veoUri.includes("?")
    ? `${clip.veoUri}&key=${apiKey}`
    : `${clip.veoUri}?key=${apiKey}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) return new NextResponse(`Veo fetch failed: ${res.status}`, { status: res.status });

  const headers = new Headers({
    "Content-Type": "video/mp4",
    "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `${disposition}; filename="cybercraft360_clip.mp4"`,
  });
  const cl = res.headers.get("Content-Length");
  if (cl) headers.set("Content-Length", cl);

  return new NextResponse(res.body, { status: 200, headers });
}
