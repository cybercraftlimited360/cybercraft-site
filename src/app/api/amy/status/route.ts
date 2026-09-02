import { NextRequest, NextResponse } from "next/server";

// Twilio calls this after every outbound call ends with the final call status.
// We use it to send a follow-up SMS to the lead.
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const callStatus = (body.get("CallStatus") as string || "").toLowerCase();
    const to = body.get("To") as string || "";       // lead's number
    const from = body.get("From") as string || "";   // our Twilio number

    if (!to || !from) return new NextResponse("ok");

    // Send SMS for all outbound call outcomes except "in-progress"
    const shouldSms = ["completed", "no-answer", "busy", "failed"].includes(callStatus);
    if (!shouldSms) return new NextResponse("ok");

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return new NextResponse("ok");

    const smsBody = callStatus === "completed"
      ? `Hi, this is Amy from CyberCraft360 — great connecting with you! If you have any questions or want to pick up where we left off, just reply here. We'd love to help your business grow. 🚀`
      : `Hi, this is Amy from CyberCraft360 — I tried calling about some opportunities I spotted for your business (Google reviews, online bookings). Happy to share what I found — just reply here and I'll send it over!`;

    const form = new URLSearchParams({
      To: to,
      From: from,
      Body: smsBody,
    });

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: form.toString(),
    });
  } catch (e) {
    console.error("[Amy status] SMS error:", e);
  }

  return new NextResponse("ok");
}
