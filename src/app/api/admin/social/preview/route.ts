import { NextRequest, NextResponse } from "next/server";

function makeToken(secret: string) {
  return Buffer.from(`cc360:${secret}:v2`).toString("base64");
}
function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;
  return token === makeToken(secret);
}

function pickLayout(themeIndex: number): number {
  return (themeIndex % 4) + 1;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  // Generate copy + photo (same as cron but without posting)
  const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({}),
  });

  if (!genRes.ok) {
    return NextResponse.json({ error: "Copy generation failed" }, { status: 500 });
  }

  const { copy, photoUrl, themeIndex, theme } = await genRes.json();

  const layout = pickLayout(themeIndex);

  const imageParams = new URLSearchParams({
    hl: copy.imageHeadline,
    sl: copy.imageSubline,
    bd: copy.imageBody,
    layout: String(layout),
    ...(photoUrl ? { photo: photoUrl } : {}),
  });

  const squareImageUrl = `${siteUrl}/social-image?${imageParams.toString()}&aspect=square`;
  const landscapeImageUrl = `${siteUrl}/social-image?${imageParams.toString()}&aspect=landscape`;

  return NextResponse.json({
    ok: true,
    themeIndex,
    theme,
    layout,
    copy,
    photoUrl,
    squareImageUrl,
    landscapeImageUrl,
  });
}
