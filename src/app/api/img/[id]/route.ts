import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "edge";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return new NextResponse("Not found", { status: 404 });

  const b64 = await redis.get<string>(`img:${id}`);
  if (!b64) return new NextResponse("Not found", { status: 404 });

  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
      "Content-Length": String(bytes.length),
    },
  });
}
