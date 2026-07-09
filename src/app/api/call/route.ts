import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone, name, company, challenge } = await req.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
    }
    if (!phone) return NextResponse.json({ error: "Phone number required" }, { status: 400 });

    const cleaned = phone.replace(/\D/g, "");
    const e164 = cleaned.startsWith("1") ? `+${cleaned}` : `+1${cleaned}`;

    const leadName = name || "there";
    const leadCompany = company || "your business";
    const leadChallenge = challenge || "";

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
    const twimlUrl = `${baseUrl}/api/lauren/twiml?name=${encodeURIComponent(leadName)}&company=${encodeURIComponent(leadCompany)}&challenge=${encodeURIComponent(leadChallenge)}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;

    const form = new URLSearchParams({
      To: e164,
      From: fromNumber,
      Url: twimlUrl,
      Method: "GET",
      StatusCallback: `${baseUrl}/api/lauren/status`,
      StatusCallbackMethod: "POST",
    });

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: form.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio error:", data);
      return NextResponse.json({ error: data.message || "Call failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, callSid: data.sid, status: data.status });
  } catch (err) {
    console.error("Call route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
