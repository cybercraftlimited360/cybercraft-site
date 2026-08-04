import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const data = await redis.get<{ b64: string; contentType: string }>(decodeURIComponent(key));
  if (!data) return new NextResponse("Not found", { status: 404 });

  const buffer = Buffer.from(data.b64, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": data.contentType,
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=172800",
      "Accept-Ranges": "bytes",
    },
  });
}
