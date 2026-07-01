import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  try {
    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "GMAIL_APP_PASSWORD is not set in environment variables" }, { status: 500 });
    }

    await sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject: "✅ CyberCraft360 Email Test",
      html: "<p>Email is working correctly via Gmail.</p>",
    });

    return NextResponse.json({ ok: true, message: "Test email sent to cybercraftlimited@gmail.com" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
