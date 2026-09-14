import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// Marketing SMS sender — intentional, admin-triggered only.
// NEVER called automatically. Must be invoked deliberately by an admin action.
// Requires explicit stored SMS marketing consent before sending.

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("1") ? `+${digits}` : `+1${digits}`;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { phone, message } = body;

  if (!phone || !message) {
    return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
  }

  const e164 = toE164(String(phone));

  // Server-side consent gate — never bypassed regardless of caller
  const hasConsent = await redis.get(`sms:consent:${e164}`);
  if (!hasConsent) {
    return NextResponse.json({ error: "No SMS marketing consent on record for this number" }, { status: 403 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "Twilio env vars not configured" }, { status: 500 });
  }

  const form = new URLSearchParams({
    To: e164,
    From: fromNumber,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: form.toString(),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("[sms/send] Twilio error:", data);
    return NextResponse.json({ error: data.message || "Twilio error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sid: data.sid });
}
