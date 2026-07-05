import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { subject, body } = await req.json();
    if (!subject || !body) {
      return NextResponse.json({ error: "Missing subject or body" }, { status: 400 });
    }

    // Convert plain-text body to HTML (preserve line breaks and horizontal rules)
    const html = `<pre style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.7; color: #1a1a1a; white-space: pre-wrap; word-wrap: break-word; max-width: 640px;">${body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/━+/g, '<hr style="border: none; border-top: 1px solid #ccc; margin: 12px 0;">')
    }</pre>`;

    await sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notify-owner error:", err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
