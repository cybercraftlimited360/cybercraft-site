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
  const actionUrl = `${base}/api/amy/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}${isInbound ? "&amp;inbound=true" : ""}`;

  const greeting = isInbound
    ? `Thank you for calling CyberCraft360, this is Amy! How can I help you today?`
    : hasName
      ? `Hi, may I speak with ${firstName}?`
      : `Hey, who am I speaking with?`;
  // Personalized voicemail — left when nobody answers
  const voicemailText = hasName
    ? `Hey ${firstName}, this is Amy calling from CyberCraft360. I took a look at ${company} and noticed a few things that could be costing you leads — specifically around your online reviews and booking setup. Really worth a quick 5-minute chat. Give us a call back or I'll try you again soon. Have a great day!`
    : `Hey, this is Amy calling from CyberCraft360. I took a quick look at your business online and noticed a couple of things worth a quick conversation — mainly around Google reviews and getting more leads on autopilot. Give us a call back whenever works for you. Talk soon!`;

  // For inbound calls, if no speech detected just hang up gracefully (caller hung up)
  // For outbound calls, play a personalized voicemail when nobody answers
  const fallbackTwiml = isInbound
    ? `<Hangup/>`
    : `<Play>${base}/api/amy/tts?text=${encodeURIComponent(voicemailText)}</Play><Hangup/>`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="1" action="${actionUrl}&amp;stage=opening" method="POST">
    <Play>${base}/api/amy/tts?text=${encodeURIComponent(greeting)}</Play>
  </Gather>
  ${fallbackTwiml}
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
