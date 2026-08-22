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

  const lines = body.split("\n");
  const sigIdx = lines.findIndex(l => /^(best|regards|warm regards|sincerely),?\s*$/i.test(l.trim()));
  const bodyLines = sigIdx >= 0 ? lines.slice(0, sigIdx) : lines;
  const sigLines = sigIdx >= 0 ? lines.slice(sigIdx) : [];
  const SITE_URL = "https://cybercraft360.com";

  const renderBodyLines = bodyLines.map(line =>
    line.trim() === ""
      ? `<tr><td style="padding:6px 0"></td></tr>`
      : `<tr><td style="padding:1px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.75;color:#1a1a1a">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#1a1a1a;text-decoration:underline">${url}</a>`)}</td></tr>`
  ).join("");

  const renderSigLines = sigLines.map((line, i) =>
    line.trim() === ""
      ? `<tr><td style="padding:3px 0"></td></tr>`
      : i === 0
        ? `<tr><td style="padding-top:18px;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.6;color:#1a1a1a">${line}</td></tr>`
        : `<tr><td style="font-family:${i === 1 ? "Georgia,'Times New Roman',Times,serif;font-size:15px;font-weight:bold" : "'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#555;letter-spacing:0.02em"};line-height:1.6;color:${i === 1 ? "#1a1a1a" : "#555"}">${line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#555;text-decoration:none">${url}</a>`)}</td></tr>`
  ).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#ffffff">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;margin:0 auto;padding:40px 24px">
  <tbody>
    ${renderBodyLines}
    ${renderSigLines}
    <tr><td style="padding-top:24px;border-top:1px solid #e8e8e8;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#aaa;letter-spacing:0.04em">CYBERCRAFT360 &nbsp;·&nbsp; <a href="${SITE_URL}" style="color:#aaa;text-decoration:none">${SITE_URL.replace("https://","")}</a></td></tr>
  </tbody>
</table>
</body></html>`;

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
