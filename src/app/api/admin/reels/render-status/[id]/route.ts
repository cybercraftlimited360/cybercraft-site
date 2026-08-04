import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = await redis.get<any>(`reels:shotstack:${id}`);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Also poll Shotstack directly for fresh status
  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (apiKey && job.status === "rendering") {
    const ssBase = process.env.SHOTSTACK_ENV === "production"
      ? "https://api.shotstack.io/v1"
      : "https://api.shotstack.io/stage/v1";

    const res = await fetch(`${ssBase}/render/${id}`, {
      headers: { "x-api-key": apiKey },
    });
    if (res.ok) {
      const d = await res.json();
      const ssStatus = d.response?.status;
      const ssUrl = d.response?.url;
      if (ssStatus === "done" && ssUrl) {
        await redis.set(`reels:shotstack:${id}`, { ...job, status: "done", videoUrl: ssUrl }, { ex: 48 * 3600 });
        return NextResponse.json({ ok: true, status: "done", videoUrl: ssUrl, job });
      }
      if (ssStatus === "failed") {
        await redis.set(`reels:shotstack:${id}`, { ...job, status: "failed" }, { ex: 48 * 3600 });
        return NextResponse.json({ ok: true, status: "failed", job });
      }
    }
  }

  return NextResponse.json({ ok: true, status: job.status, videoUrl: job.videoUrl ?? null, postedAt: job.postedAt ?? null, job });
}
