import { NextRequest, NextResponse } from "next/server";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  const s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return new NextResponse("Unauthorized", { status: 401 });

  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return new NextResponse("Missing url", { status: 400 });

  const res = await fetch(blobUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });

  if (!res.ok) return new NextResponse("Failed to fetch blob", { status: 502 });

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "video/mp4",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
