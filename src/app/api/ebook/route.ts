import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";
import { renderToBuffer } from "@react-pdf/renderer";
import { EbookDocument } from "@/components/ebook/EbookDocument";
import React from "react";

const OWNER_EMAIL = "cybercraftlimited@gmail.com";

async function generateEbookContent(form: {
  name: string; email: string; businessName: string; industry: string;
  topic: string; audience: string; tone: string; keyPoints: string;
}): Promise<{ title: string; subtitle: string; chapters: { title: string; content: string }[]; conclusion: string; authorBio: string }> {
  const prompt = `You are a professional business eBook writer. Write a high-value, practical eBook for a business owner.

Business: ${form.businessName} (${form.industry})
Author/Owner: ${form.name}
Topic: ${form.topic}
Target Audience: ${form.audience}
Tone: ${form.tone}
Key Points to Cover: ${form.keyPoints}

Write a complete, professional eBook. Return ONLY valid JSON in this exact format:
{
  "title": "compelling eBook title",
  "subtitle": "one sentence subtitle that explains the value",
  "chapters": [
    { "title": "Chapter 1 title", "content": "600-800 word chapter content in flowing paragraphs. No bullet points. Professional business writing." },
    { "title": "Chapter 2 title", "content": "600-800 word chapter content..." },
    { "title": "Chapter 3 title", "content": "600-800 word chapter content..." },
    { "title": "Chapter 4 title", "content": "600-800 word chapter content..." },
    { "title": "Chapter 5 title", "content": "600-800 word chapter content..." }
  ],
  "conclusion": "200-300 word conclusion that ties it together and includes a soft call to action for the author's business",
  "authorBio": "2-3 sentence professional bio for ${form.name} of ${form.businessName}"
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "AI generation failed");
  return JSON.parse(data.choices[0].message.content);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();
    const { name, email, businessName, industry, topic, audience, tone, keyPoints } = form;

    if (!name || !email || !businessName || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate eBook content via Groq
    const content = await generateEbookContent({ name, email, businessName, industry, topic, audience, tone, keyPoints });

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(EbookDocument, { content, author: name, businessName, email })
    );

    // Email PDF to client
    await sendEmail({
      to: email,
      subject: `Your eBook is Ready — "${content.title}"`,
      html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#f97316,#ec4899);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360 · AI eBook Generator</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Your eBook is ready, ${name.split(" ")[0]}.</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 20px;">
        <strong style="color:#f97316;">"${content.title}"</strong> is attached as a PDF — ready to share, publish, or use as a lead magnet.
      </p>
      <p style="font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;margin:0 0 28px;">
        This eBook was generated in seconds using CyberCraft360's AI content engine, trained specifically around your topic and audience. Share it freely — it's yours.
      </p>
      <a href="https://cybercraft360.com/book" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
        Book a Free Strategy Call →
      </a>
      <p style="font-size:12px;color:rgba(255,255,255,0.2);margin:24px 0 0;">Want a full AI content engine for ${businessName}? We automate blog posts, social content, emails, and more — every week, hands-free.</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.15);margin:16px 0 0;">CyberCraft360 · Houston, TX · cybercraft360.com</p>
    </div>
  </div>
</div>`,
      attachments: [{
        filename: `${content.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-")}.pdf`,
        content: pdfBuffer.toString("base64"),
        encoding: "base64",
        contentType: "application/pdf",
      }],
    });

    // Notify owner (non-blocking)
    sendEmail({
      to: OWNER_EMAIL,
      subject: `📖 New eBook Generated — ${name} (${businessName})`,
      html: `
<div style="background:#0a0c12;padding:32px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0f1117;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#f97316,#ec4899);"></div>
    <div style="padding:28px;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 10px;">CyberCraft360 · eBook Lead</p>
      <h2 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 20px;">📖 New eBook generated & sent</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ["Name", name],
          ["Email", email],
          ["Business", businessName],
          ["Industry", industry || "—"],
          ["Topic", topic],
          ["eBook Title", content.title],
        ].map(([label, value]) => `
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);width:90px;">${label}</td>
          <td style="padding:9px 0;font-size:13px;font-weight:600;color:#f97316;">${value}</td>
        </tr>`).join("")}
      </table>
      <a href="https://cybercraft360.com/admin" style="display:block;text-align:center;margin-top:20px;padding:11px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">View in Dashboard →</a>
    </div>
  </div>
</div>`,
    }).catch(() => {});

    // Save lead to Redis
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, company: businessName,
        challenge: `eBook: ${topic}`,
        source: "ebook-generator",
      }),
    }).catch(() => {});

    // Save to Redis log
    redis.get<any[]>("ebooks:all").then(all => {
      const list = all ?? [];
      list.push({ name, email, businessName, topic, title: content.title, createdAt: new Date().toISOString() });
      return redis.set("ebooks:all", list.slice(-500));
    }).catch(() => {});

    return NextResponse.json({ ok: true, title: content.title });
  } catch (err) {
    console.error("[ebook] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
