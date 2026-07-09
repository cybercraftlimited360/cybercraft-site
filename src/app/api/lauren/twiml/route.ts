import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "there";
  const company = searchParams.get("company") || "your business";
  const challenge = searchParams.get("challenge") || "automating your business";
  const firstName = name.split(" ")[0];

  const greeting = `Hi, is this ${firstName}? Great — this is Lauren calling from CyberCraft360. I'm reaching out because you expressed interest in AI solutions for ${company}. Do you have just two minutes? I think there are a couple of things that could really help you.`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="auto" action="/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}" method="POST">
    <Say voice="Polly.Joanna-Neural">${greeting}</Say>
  </Gather>
  <Say voice="Polly.Joanna-Neural">I didn't catch that — no worries at all. Feel free to call us back at any time or visit cybercraft360.com to book a free strategy session. Have a great day ${firstName}!</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
