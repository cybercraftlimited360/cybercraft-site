import { NextRequest, NextResponse } from "next/server";

const LI_API = "https://api.linkedin.com/v2";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.LI_ACCESS_TOKEN;
  const personId = process.env.LI_PERSON_ID;
  if (!token || !personId) {
    return NextResponse.json({ error: "LI_ACCESS_TOKEN or LI_PERSON_ID not set" }, { status: 500 });
  }

  const { text, link } = await req.json();

  const commentary = link ? `${text}\n\n${link}` : text;

  const body = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: commentary },
        shareMediaCategory: link ? "ARTICLE" : "NONE",
        ...(link && {
          media: [
            {
              status: "READY",
              originalUrl: link,
            },
          ],
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
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
