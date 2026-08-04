import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function makeToken(secret: string) {
  return Buffer.from(`cc360:${secret}:v2`).toString("base64");
}
function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;
  return token === makeToken(secret);
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Limit 8MB
    if (buffer.length > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
    }

    const contentType = file.type || "image/jpeg";
    const b64 = buffer.toString("base64");
    const key = `social:uploaded_image:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Store for 48 hours
    await redis.set(key, { contentType, b64 }, { ex: 172800 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
    const imageUrl = `${siteUrl}/api/social/image/${encodeURIComponent(key)}`;

    return NextResponse.json({ ok: true, imageUrl, key });
  } catch (err) {
    console.error("[upload-image]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
