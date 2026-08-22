import { NextRequest, NextResponse } from "next/server";
import { createTransport } from "nodemailer";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to } = await req.json() as { to: string };
  if (!to) return NextResponse.json({ error: "to address required" }, { status: 400 });

  const host = process.env.OUTREACH_SMTP_HOST ?? "smtp.gmail.com";
  const port = parseInt(process.env.OUTREACH_SMTP_PORT ?? "465");
  const user = process.env.OUTREACH_EMAIL;
  const pass = process.env.OUTREACH_EMAIL_PASSWORD;
  const fromName = process.env.OUTREACH_NAME ?? "Saad — CyberCraft360";

  if (!user || !pass) {
    return NextResponse.json({ error: "OUTREACH_EMAIL and OUTREACH_EMAIL_PASSWORD not configured in Vercel environment variables" });
  }

  const transport = createTransport({ host, port, secure: port === 465, auth: { user, pass } });

  const subject = "Introducing CyberCraft360 — AI Automation for Your Business";
  const body = `Hi there,

I wanted to take a moment to introduce CyberCraft360 — we build AI-powered automation systems for small and medium-sized businesses across the US.

What we do in plain terms: if your business gets inbound calls, inquiries, or appointment requests, we build a system that handles all of that automatically — answering calls, qualifying leads, booking appointments — so you and your team can focus on the actual work.

No generic off-the-shelf software. Every system is built specifically for the business it serves.

If you'd like to see what that looks like in practice, our website is a good place to start:
https://cybercraft360.com

We also write regularly about how service businesses are using AI to reduce costs and grow revenue — worth a read if you're thinking about this space:
https://cybercraft360.com/blog

Happy to set up a 15-minute call if you'd like to explore whether it makes sense for your business.

Best,
Saad
CyberCraft360
https://cybercraft360.com`;

  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#222;max-width:560px;">
${body.split("\n").map(line => line.trim() === "" ? "<br>" : `<p style="margin:0 0 8px">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#0066cc">${url}</a>`)}</p>`).join("")}
</div>`;

  try {
    await transport.sendMail({
      from: `${fromName} <${user}>`,
      to,
      subject,
      text: body,
      html,
    });
    return NextResponse.json({ ok: true, from: user, to, subject });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e).slice(0, 300) });
  }
}
