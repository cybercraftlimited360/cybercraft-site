import { NextRequest, NextResponse } from "next/server";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

const TRENDING_HASHTAGS = [
  "#AIAutomation","#BusinessAutomation","#AIAgency","#CyberCraft360",
  "#WorkflowAutomation","#IntelligentSystems","#AIEngineering","#SmallBusiness",
  "#DigitalTransformation","#BusinessGrowth","#Productivity","#TechSolutions",
  "#AutomateYourBusiness","#AIForBusiness","#LeadGeneration",
  "#SalesAutomation","#AIPhoneAgent","#NeverMissALead","#24_7Business",
  "#ScaleYourBusiness","#FutureOfWork","#BusinessEfficiency","#AIFirst",
];

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { context } = await req.json().catch(() => ({}));
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.75,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: "You are a social media expert for CyberCraft360, an AI automation agency serving businesses across the United States. They build AI phone agents, automated workflows, lead qualification systems, and intelligent business systems for small-to-mid-size businesses. Your captions are direct, punchy, and conversion-focused. Always include a CTA pointing to CyberCraft360.com.",
        },
        {
          role: "user",
          content: `Write platform-optimized captions for a social media reel from CyberCraft360.
${context?.trim() ? `Reel topic: ${context.trim()}` : "General AI automation / business growth reel."}

Return ONLY valid JSON (no markdown, no explanation):
{
  "instagram": "Hook line that stops the scroll.\\n\\n2-3 lines of value.\\n\\nCTA → CyberCraft360.com",
  "facebook": "Conversational opening.\\n\\nExpand the value prop with 2-3 sentences.\\n\\nCTA → CyberCraft360.com",
  "linkedin": "Professional hook.\\n\\n2-3 lines positioning CyberCraft360 as the expert.\\n\\nTagline + CTA → CyberCraft360.com\\n\\n#AIEngineering #BusinessAutomation #SmallBusiness",
  "hashtags": ["#AIAutomation","#BusinessAutomation","#AIAgency","#WorkflowAutomation","#LeadGeneration","#AIPhoneAgent","#ScaleYourBusiness","#DigitalTransformation","#AIForBusiness","#NeverMissALead","#SalesAutomation","#CyberCraft360","#24_7Business","#SmallBusiness"]
}

Keep Instagram under 300 chars before hashtags. Facebook under 500 chars. LinkedIn under 700 chars.`,
        },
      ],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Groq request failed" }, { status: 500 });
  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "{}";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "Failed to parse captions" }, { status: 500 });

  try {
    const parsed = JSON.parse(match[0]);
    const hashtags: string[] = parsed.hashtags?.length ? parsed.hashtags : TRENDING_HASHTAGS.slice(0, 15);
    return NextResponse.json({ ok: true, instagram: parsed.instagram ?? "", facebook: parsed.facebook ?? "", linkedin: parsed.linkedin ?? "", hashtags });
  } catch {
    return NextResponse.json({ error: "Invalid JSON from LLM" }, { status: 500 });
  }
}
