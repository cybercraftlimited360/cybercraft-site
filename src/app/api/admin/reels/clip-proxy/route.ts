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

  try {
    // Fetch the private blob using the server-side token
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const res = await fetch(blobUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return new NextResponse(`Blob fetch failed: ${res.status}`, { status: res.status });

    const headers = new Headers({
      "Content-Type": res.headers.get("Content-Type") ?? "video/mp4",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `${disposition}; filename="clip.mp4"`,
    });
    const cl = res.headers.get("Content-Length");
    if (cl) headers.set("Content-Length", cl);

    return new NextResponse(res.body, { status: 200, headers });
  } catch (e: any) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 });
  }
}
