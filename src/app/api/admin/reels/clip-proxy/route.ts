import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  const s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

// Returns a short-lived pre-signed URL for the private blob — no streaming needed
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return new NextResponse("Unauthorized", { status: 401 });

  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return new NextResponse("Missing url", { status: 400 });

  try {
    const info = await head(blobUrl);
    // downloadUrl is pre-signed by Vercel Blob SDK — valid 10 min, no token needed client-side
    return NextResponse.json({ url: info.downloadUrl });
  } catch (e: any) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 });
  }
}
