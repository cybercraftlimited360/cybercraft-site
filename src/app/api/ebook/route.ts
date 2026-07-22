import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";
import { renderToBuffer } from "@react-pdf/renderer";
import { EbookDocument } from "@/components/ebook/EbookDocument";
import React from "react";

const OWNER_EMAIL = "cybercraftlimited@gmail.com";

function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function cerebrasCall(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error("CEREBRAS_API_KEY not configured");
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Cerebras error");
  return stripJsonFences(data.choices[0].message.content as string);
}

async function generateSocialContent(title: string, subtitle: string, chapters: { title: string; content: string }[], businessName: string, industry: string): Promise<{
  linkedin: string[];
  instagram: string[];
  emails: { subject: string; body: string }[];
}> {
  const summary = chapters.map((c, i) => `Chapter ${i + 1}: ${c.title}\n${c.content.slice(0, 300)}…`).join("\n\n");
  const prompt = `You are a social media and email marketing expert. Based on this eBook, create a content package for ${businessName} (${industry}).

eBook: "${title}" — ${subtitle}

Chapter summaries:
${summary}

Return ONLY valid JSON (no markdown, no code fences):
{
  "linkedin": [
    "Full LinkedIn post 1 (150-200 words, professional tone, ends with a question or CTA, include 3-5 relevant hashtags)",
    "Full LinkedIn post 2 (different angle from post 1)",
    "Full LinkedIn post 3 (story-driven, personal insight)",
    "Full LinkedIn post 4 (data/stat focused)",
    "Full LinkedIn post 5 (contrarian or myth-busting take)"
  ],
  "instagram": [
    "Instagram caption 1 with 15-20 hashtags (punchy, 2-3 lines max)",
    "Instagram caption 2",
    "Instagram caption 3",
    "Instagram caption 4",
    "Instagram caption 5",
    "Instagram caption 6",
    "Instagram caption 7",
    "Instagram caption 8",
    "Instagram caption 9",
    "Instagram caption 10"
  ],
  "emails": [
    { "subject": "Email subject line 1", "body": "Full email body 1 (conversational, 150-200 words, one clear CTA)" },
    { "subject": "Email subject line 2", "body": "Full email body 2 (different angle)" },
    { "subject": "Email subject line 3", "body": "Full email body 3 (story-based)" }
  ]
}`;

  return JSON.parse(await cerebrasCall(prompt, 3000));
}

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

Write a complete, professional eBook. Return ONLY valid JSON (no markdown, no code fences) in this exact format:
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

  return JSON.parse(await cerebrasCall(prompt, 4000));
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

    // Render PDF + generate social content in parallel
    const [pdfBuffer, social] = await Promise.all([
      renderToBuffer(React.createElement(EbookDocument, { content, author: name, businessName, email })),
      generateSocialContent(content.title, content.subtitle, content.chapters, businessName, industry).catch(() => null),
    ]);

    const socialHtml = social ? `
      <div style="margin-top:28px;padding:20px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.07);">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f97316;margin:0 0 14px;">🚀 Your Social Content Pack</p>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 18px;line-height:1.6;">We turned your eBook into a full month of content. Copy, paste, and post.</p>

        <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px;">LinkedIn Posts (5)</p>
        ${(social.linkedin ?? []).map((p: string, i: number) => `
          <div style="margin-bottom:10px;padding:14px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid #0077b5;">
            <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);margin:0 0 6px;">Post ${i + 1}</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;line-height:1.6;white-space:pre-line;">${p}</p>
          </div>`).join("")}

        <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;margin:18px 0 10px;">Instagram Captions (10)</p>
        ${(social.instagram ?? []).map((p: string, i: number) => `
          <div style="margin-bottom:8px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid #e1306c;">
            <p style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.25);margin:0 0 5px;">Caption ${i + 1}</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;line-height:1.6;">${p}</p>
          </div>`).join("")}

        <p style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;margin:18px 0 10px;">Email Newsletter Drafts (3)</p>
        ${(social.emails ?? []).map((e: any, i: number) => `
          <div style="margin-bottom:10px;padding:14px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid #22c55e;">
            <p style="font-size:11px;font-weight:700;color:#22c55e;margin:0 0 4px;">Subject: ${e.subject}</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.7);margin:0;line-height:1.6;white-space:pre-line;">${e.body}</p>
          </div>`).join("")}
      </div>` : "";

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
      ${socialHtml}
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
        source: "ebook",
      }),
    }).catch(() => {});

    // Save to Redis log
    redis.get<any[]>("ebooks:all").then(all => {
      const list = all ?? [];
      list.push({ name, email, businessName, topic, title: content.title, social: social ?? null, createdAt: new Date().toISOString() });
      return redis.set("ebooks:all", list.slice(-500));
    }).catch(() => {});

    return NextResponse.json({ ok: true, title: content.title });
  } catch (err) {
    console.error("[ebook] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
