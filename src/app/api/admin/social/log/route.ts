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

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await redis.get<unknown[]>("social:auto_posts") ?? [];
  return NextResponse.json({ posts });
}
