import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawName = (searchParams.get("name") || "").trim();
  const hasName = rawName.length > 0 && rawName.toLowerCase() !== "there";
  const name = hasName ? rawName : "";
  const company = searchParams.get("company") || "your business";
  const challenge = searchParams.get("challenge") || "";
  const firstName = hasName ? name.split(" ")[0] : "";

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
  const isInbound = !hasName && !req.nextUrl.searchParams.has("company");
  const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}${isInbound ? "&amp;inbound=true" : ""}`;

  const greeting = isInbound
    ? `Thank you for calling CyberCraft360, this is Amy! How can I help you today?`
    : hasName
      ? `Hi, may I speak with ${firstName}?`
      : `Hey, who am I speaking with?`;
  const noAnswer = `Hey, this is Amy from CyberCraft360 — I'll try you again soon. You can also visit cybercraft360.com whenever you're ready. Have a great day!`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="1" action="${actionUrl}&amp;stage=opening" method="POST">
    <Play>${base}/api/lauren/tts?text=${encodeURIComponent(greeting)}</Play>
  </Gather>
  <Play>${base}/api/lauren/tts?text=${encodeURIComponent(noAnswer)}</Play>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
