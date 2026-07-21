import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, company, email, phone, challenge, source, score } = await req.json();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No GROQ_API_KEY" }, { status: 500 });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a senior sales qualifier for CyberCraft360, a premium AI agency in Houston TX. We build custom AI phone agents, chatbots, voice assistants, and automation for SMBs. Our typical deal size is $800–$2,500/month. You are direct, sharp, and help us prioritize who to call first.`,
        },
        {
          role: "user",
          content: `Qualify this inbound lead for CyberCraft360:

Name: ${name || "Unknown"}
Company: ${company || "Not provided"}
Email: ${email || "Not provided"}
Phone: ${phone ? "Yes" : "No"}
Challenge: ${challenge || "Not described"}
Lead source: ${source || "website"}
Lead score: ${score ?? "N/A"}/100

Return a JSON object with exactly these fields:
{
  "rating": "hot" | "warm" | "cold",
  "score_out_of_10": number,
  "one_line": "One punchy sentence summarizing this lead and their pain",
  "why_they_need_us": "1-2 sentences on the exact problem we solve for them",
  "red_flags": "Any concerns — vague request, no budget signals, unlikely to close — or 'None' if clean",
  "opening_line": "The exact first thing Lauren or Saad should say when they call this person — reference their specific situation",
  "estimated_deal_size": "$X/mo",
  "priority": "call today" | "call this week" | "nurture"
}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error?.message }, { status: 500 });

  try {
    const qualification = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ ok: true, qualification });
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
