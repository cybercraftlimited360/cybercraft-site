import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  const s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return new NextResponse("Unauthorized", { status: 401 });

  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return new NextResponse("Missing url", { status: 400 });

  const disposition = req.nextUrl.searchParams.get("disposition") ?? "inline";

  try {
    // head() uses BLOB_READ_WRITE_TOKEN server-side to get a pre-signed downloadUrl
    const info = await head(blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });

    // downloadUrl is a pre-signed URL — fetch it server-side and pipe the bytes
    const res = await fetch(info.downloadUrl);
    if (!res.ok) return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });

    const headers = new Headers({
      "Content-Type": info.contentType ?? "video/mp4",
      "Cache-Control": "private, max-age=600",
      "Content-Disposition": `${disposition}; filename="clip.mp4"`,
    });
    if (info.size) headers.set("Content-Length", String(info.size));

    return new NextResponse(res.body, { status: 200, headers });
  } catch (e: any) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 });
  }
}
