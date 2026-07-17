import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "there";
  const company = searchParams.get("company") || "your business";
  const challenge = searchParams.get("challenge") || "";
  const firstName = name.split(" ")[0];

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
  const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}`;

  // Opening: confirm who we're speaking to first — don't assume
  const greeting = `Hi, may I speak with ${firstName}?`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="8" speechTimeout="3" action="${actionUrl}&amp;stage=opening" method="POST">
    <Say voice="Polly.Joanna-Neural">${greeting}</Say>
  </Gather>
  <Say voice="Polly.Joanna-Neural">Hi ${firstName}, this is Lauren from CyberCraft360. I'll try you again another time — you can also visit cybercraft360.com whenever you're ready. Have a great day!</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
