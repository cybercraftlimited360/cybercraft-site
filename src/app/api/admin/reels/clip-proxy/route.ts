import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

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

  try {
    const info = await head(blobUrl);
    // Return the pre-signed download URL as JSON — the frontend sets video src directly
    return NextResponse.json({ downloadUrl: info.downloadUrl });
  } catch (e: any) {
    return new NextResponse(`Blob error: ${e.message}`, { status: 500 });
  }
}
