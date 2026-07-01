import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalDocument } from "@/components/proposal/ProposalDocument";
import React from "react";

interface ProposalData {
  company: string;
  industry: string;
  challenge: string;
  email: string;
  headline: string;
  executiveSummary: string;
  services: { name: string; why: string; price: string }[];
  roiEstimate: string;
  timeline: string;
  nextStep: string;
}

async function generateProposalContent(company: string, industry: string, challenge: string): Promise<Omit<ProposalData, "email" | "company" | "industry" | "challenge">> {
  const apiKey = process.env.GROQ_API_KEY!;

  const prompt = `You are a senior AI solutions consultant at CyberCraft360, a premium bespoke AI agency. Generate a tailored AI proposal for the following client.

Company: ${company}
Industry: ${industry}
Main Challenge: ${challenge}

Return ONLY valid JSON matching this exact shape:
{
  "headline": "A compelling 8-12 word headline specific to their industry and challenge",
  "executiveSummary": "2-3 sentence paragraph explaining exactly how AI solves their specific challenge. Be specific to their industry. Mention ${company} by name.",
  "services": [
    {"name": "Service Name", "why": "One sentence why this is right for their challenge", "price": "from $X/month"},
    {"name": "Service Name", "why": "One sentence why this is right for their challenge", "price": "from $X/month"},
    {"name": "Service Name", "why": "One sentence why this is right for their challenge", "price": "from $X/month"}
  ],
  "roiEstimate": "Specific ROI estimate e.g. '340% ROI within 90 days based on typical ${industry} deployments'",
  "timeline": "e.g. 'Live within 4–6 weeks of your discovery call'",
  "nextStep": "One warm, direct sentence pushing them to book the free strategy session"
}

Pick the 3 most relevant services from: Custom AI Chatbot ($500/mo), Voice AI Agent ($700/mo), Workflow Automation ($800/mo), CRM & Lead Intelligence ($900/mo), AI Content Engine ($600/mo), AI Cybersecurity ($1,200/mo), Premium Website Design ($1,500/mo), AI Ads & Marketing ($1,000/mo).`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.65,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.choices?.[0]?.message?.content) {
    console.error("Groq proposal error:", JSON.stringify(data));
    throw new Error(data.error?.message || "AI generation failed — please try again.");
  }
  return JSON.parse(data.choices[0].message.content);
}

async function sendProposalEmail(to: string, company: string, pdfBuffer: Buffer) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "CyberCraft360 <onboarding@resend.dev>",
      to: [to],
      bcc: ["cybercraftlimited@gmail.com"],
      subject: `Your Bespoke AI Proposal — ${company}`,
      html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 16px;">Your AI Proposal is Ready</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0 0 28px;">
        We've put together a bespoke AI strategy document for <strong style="color:rgba(255,255,255,0.85);">${company}</strong>.
        Your proposal is attached — it outlines the exact AI solutions we'd recommend and what you can expect in terms of ROI and timeline.
      </p>
      <a href="https://calendly.com/cybercraftlimited/30min" style="display:inline-block;padding:13px 28px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
        Book Your Free Strategy Call →
      </a>
      <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:28px 0 0;">CyberCraft360 · Bespoke AI Agency · cybercraftlimited.com</p>
    </div>
  </div>
</div>`,
      attachments: [
        {
          filename: `CyberCraft360-Proposal-${company.replace(/\s+/g, "-")}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { company, industry, challenge, email } = await req.json();

    if (!company || !industry || !challenge || !email) {
      return NextResponse.json({ error: "All fields required." }, { status: 400 });
    }

    // Generate AI content
    const content = await generateProposalContent(company, industry, challenge);

    const proposalData: ProposalData = { company, industry, challenge, email, ...content };

    // Render PDF
    const pdfBuffer = Buffer.from(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await renderToBuffer(React.createElement(ProposalDocument, { data: proposalData }) as any)
    );

    // Send email with PDF attached
    await sendProposalEmail(email, company, pdfBuffer);

    return NextResponse.json({ ok: true, headline: content.headline, services: content.services });
  } catch (err) {
    console.error("Proposal route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
