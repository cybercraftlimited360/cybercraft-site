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


export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
  const body = await req.json().catch(() => ({}));
  const customPrompt = body.customPrompt || undefined;

  // Generate copy + photo (same as cron but without posting)
  const genRes = await fetch(`${siteUrl}/api/social/generate-post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify(customPrompt ? { customPrompt } : {}),
  });

  if (!genRes.ok) {
    return NextResponse.json({ error: "Copy generation failed" }, { status: 500 });
  }

  const { copy, photoUrl, landscapePhotoUrl, topic, day, frame, layoutVariant } = await genRes.json();

  const lv = String(layoutVariant ?? 1);
  const squareParams = new URLSearchParams({
    ey: copy.eyebrow ?? "", hl: copy.headline ?? "", bd: copy.body ?? "", ct: copy.cta ?? "",
    layout: lv, aspect: "square",
    ...(photoUrl ? { photo: photoUrl } : {}),
  });
  const landscapeParams = new URLSearchParams({
    ey: copy.eyebrow ?? "", hl: copy.headline ?? "", bd: copy.body ?? "", ct: copy.cta ?? "",
    layout: lv, aspect: "landscape",
    ...(landscapePhotoUrl ? { photo: landscapePhotoUrl } : photoUrl ? { photo: photoUrl } : {}),
  });

  const squareImageUrl = `${siteUrl}/social-image?${squareParams.toString()}`;
  const landscapeImageUrl = `${siteUrl}/social-image?${landscapeParams.toString()}`;

  return NextResponse.json({
    ok: true,
    topic,
    day,
    frame,
    layoutVariant,
    copy,
    photoUrl,
    landscapePhotoUrl,
    squareImageUrl,
    landscapeImageUrl,
  });
}
