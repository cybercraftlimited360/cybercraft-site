import { NextRequest, NextResponse } from "next/server";

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

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) return new NextResponse("BLOB_READ_WRITE_TOKEN not set", { status: 500 });

  try {
    // Private Vercel Blob access: append token as query param
    const separator = blobUrl.includes("?") ? "&" : "?";
    const fetchUrl = `${blobUrl}${separator}token=${encodeURIComponent(blobToken)}`;

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      const body = await res.text();
      return new NextResponse(`Blob error ${res.status}: ${body.slice(0, 200)}`, { status: res.status });
    }

    const headers = new Headers({
      "Content-Type": res.headers.get("Content-Type") ?? "video/mp4",
      "Cache-Control": "private, max-age=600",
      "Content-Disposition": `${disposition}; filename="clip.mp4"`,
    });
    const cl = res.headers.get("Content-Length");
    if (cl) headers.set("Content-Length", cl);

    return new NextResponse(res.body, { status: 200, headers });
  } catch (e: any) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 });
  }
}
