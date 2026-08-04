import { NextRequest, NextResponse } from "next/server";

const LI_API = "https://api.linkedin.com/v2";

async function uploadImageToLinkedIn(imageUrl: string, token: string, authorUrn: string): Promise<string | null> {
  const registerRes = await fetch(`${LI_API}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: authorUrn,
        serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }],
      },
    }),
  });

  if (!registerRes.ok) return null;
  const registerData = await registerRes.json();
  const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const asset = registerData.value?.asset;
  if (!uploadUrl || !asset) return null;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;
  const imgBuffer = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: imgBuffer,
  });

  if (!uploadRes.ok) return null;
  return asset;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.LI_ACCESS_TOKEN;
  const personId = process.env.LI_PERSON_ID;
  const orgId = process.env.LI_ORGANIZATION_ID;

  if (!token || (!personId && !orgId)) {
    return NextResponse.json({ error: "LI_ACCESS_TOKEN and LI_PERSON_ID (or LI_ORGANIZATION_ID) not set" }, { status: 500 });
  }

  // Use org if available (company page), otherwise fall back to personal profile
  const authorUrn = orgId ? `urn:li:organization:${orgId}` : `urn:li:person:${personId}`;

  const { text, link, imageUrl } = await req.json();
  const commentary = link ? `${text}\n\n${link}` : text;

  let asset: string | null = null;
  if (imageUrl) {
    asset = await uploadImageToLinkedIn(imageUrl, token, authorUrn);
  }

  const body = asset
    ? {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: commentary },
            shareMediaCategory: "IMAGE",
            media: [{ status: "READY", media: asset }],
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }
    : {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: commentary },
            shareMediaCategory: link ? "ARTICLE" : "NONE",
            ...(link && { media: [{ status: "READY", originalUrl: link }] }),
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      };

  const res = await fetch(`${LI_API}/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data.message ?? "LinkedIn post failed", data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
