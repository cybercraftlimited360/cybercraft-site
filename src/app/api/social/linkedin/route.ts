import { NextRequest, NextResponse } from "next/server";

const LI_API = "https://api.linkedin.com/v2";

async function uploadImageToLinkedIn(imageUrl: string, token: string, authorUrn: string): Promise<{ asset: string | null; debugSteps: string[] }> {
  const steps: string[] = [];

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

  if (!registerRes.ok) {
    const body = await registerRes.text();
    steps.push(`registerUpload FAILED ${registerRes.status}: ${body.slice(0, 200)}`);
    return { asset: null, debugSteps: steps };
  }
  const registerData = await registerRes.json();
  const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
  const asset = registerData.value?.asset;
  steps.push(`registerUpload OK — asset=${asset} uploadUrl=${uploadUrl ? "present" : "MISSING"}`);
  if (!uploadUrl || !asset) return { asset: null, debugSteps: steps };

  const imgRes = await fetch(imageUrl);
  steps.push(`imageFetch ${imgRes.status} for ${imageUrl.slice(0, 80)}`);
  if (!imgRes.ok) return { asset: null, debugSteps: steps };
  const imgBuffer = await imgRes.arrayBuffer();
  steps.push(`imageBuffer ${imgBuffer.byteLength} bytes`);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: imgBuffer,
  });
  steps.push(`blobUpload ${uploadRes.status}`);
  if (!uploadRes.ok) return { asset: null, debugSteps: steps };
  return { asset, debugSteps: steps };
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
  let liDebug: string[] = [];
  if (imageUrl) {
    const result = await uploadImageToLinkedIn(imageUrl, token, authorUrn);
    asset = result.asset;
    liDebug = result.debugSteps;
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
    return NextResponse.json({ ok: false, error: data.message ?? "LinkedIn post failed", data, liDebug }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, hasImage: !!asset, liDebug });
}
