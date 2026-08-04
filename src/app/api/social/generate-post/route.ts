import { NextRequest, NextResponse } from "next/server";

const MARKETING_THEMES = [
  "Why most small businesses miss 30-40% of inbound calls and what AI can do about it overnight",
  "The difference between software that solves problems and intelligent systems that eliminate them entirely",
  "How AI automation allows small businesses to compete with companies 10x their size on a fraction of the budget",
  "Why the best business automation starts with understanding your workflows first, not the tools",
  "What happens when a service business never misses a customer inquiry again — real outcomes, real numbers",
  "How AI customer service agents handle after-hours calls, follow-ups, and scheduling automatically",
  "The real cost of manual follow-up in service businesses and how automation changes the math permanently",
  "Why Houston small businesses that adopt AI systems now will dominate their market in 24 months",
  "How conversational AI turns every missed call into a booked appointment without anyone lifting a finger",
  "The 3 workflows every service business — HVAC, dental, real estate — should automate before anything else",
  "Why hiring more staff is the expensive solution to a problem AI can solve for a fraction of the cost",
  "How one AI voice agent answering phones 24/7 is worth more than two full-time front desk employees",
  "The quiet competitive advantage: small businesses using AI to respond to leads in under 60 seconds",
  "What a custom AI workflow actually looks like inside a real Houston contracting business",
  "Why most AI tools fail small businesses — and what a custom-built system does differently",
  "How to automate lead follow-up so no prospect ever falls through the cracks again",
  "The business case for AI appointment booking in dental and medical practices",
  "Every great business runs on great systems — here is what that actually means in practice",
  "Why technology should feel invisible to your customers while doing everything behind the scenes",
  "How CyberCraft360 builds AI systems that pay for themselves inside the first 90 days",
];

// Core hashtags always included — high-performing AI/business tags
const INSTAGRAM_BASE_TAGS = "#AIAutomation #SmallBusiness #BusinessAutomation #AIAgency #HoustonBusiness #WorkflowAutomation #VoiceAI #ChatbotMarketing #BusinessGrowth #Entrepreneur #SmallBusinessOwner #AITools #CustomerExperience #DigitalTransformation #HoustonTX #CyberCraft360";

const LINKEDIN_BASE_TAGS = "#AIAutomation #SmallBusiness #BusinessGrowth #ArtificialIntelligence #WorkflowAutomation #HoustonBusiness";

async function generateCopy(theme: string): Promise<{
  imageHeadline: string;
  imageSubline: string;
  imageBody: string;
  linkedinCaption: string;
  instagramCaption: string;
  facebookCaption: string;
  photoKeyword: string;
} | null> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are Saad Imran, founder of CyberCraft360 — a boutique AI agency in Houston, TX that builds custom voice agents, chatbots, and workflow automation for small businesses (HVAC, dental, real estate, contractors, restaurants).

Write social media content around this theme: "${theme}"

RULES:
- Never use: "leverage", "revolutionize", "game-changer", "seamlessly", "cutting-edge", "dive in", "in today's world"
- Write like a founder who has seen hundreds of businesses — confident, direct, occasionally blunt
- Every sentence must earn its place
- imageHeadline must be 4-7 bold uppercase words — a statement, not a question
- imageBody is ONE punchy sentence, max 12 words, that expands on the headline
- LinkedIn: professional, specific, 120-160 words. End with EXACTLY this tag line (do not change it): "${LINKEDIN_BASE_TAGS}"
- Instagram: punchy hook, 60-80 words, then a blank line, then EXACTLY this hashtag block (do not change it): "${INSTAGRAM_BASE_TAGS}" — you may add 3-5 more niche hashtags after it
- Facebook: conversational, 80-110 words, no hashtags
- photoKeyword: 2-4 words describing the ideal background photo (think: cinematic architectural interiors, moody offices, dramatic landscapes — something that looks expensive and premium)

Return ONLY valid JSON, no markdown fences:
{
  "imageHeadline": "BOLD STATEMENT HERE",
  "imageSubline": "Supporting context",
  "imageBody": "One punchy sentence expanding the headline.",
  "linkedinCaption": "...",
  "instagramCaption": "...",
  "facebookCaption": "...",
  "photoKeyword": "modern office architecture"
}`;

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "zai-glm-4.7",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.85,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[generate-post] Cerebras error", res.status, errText);
    throw new Error(`Cerebras ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Try extracting JSON object from anywhere in the response
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    throw new Error(`JSON parse failed. Raw (first 400): ${raw.slice(0, 400)}`);
  }
}

async function fetchPexelsPhoto(keyword: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const query = encodeURIComponent(keyword);
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${query}&per_page=15&orientation=square`,
    { headers: { Authorization: apiKey } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const photos: Array<{ src: { large2x: string } }> = data.photos ?? [];
  if (photos.length === 0) return null;

  // Pick a random photo from the results for variety
  const pick = photos[Math.floor(Math.random() * photos.length)];
  return pick.src.large2x;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const themeIndex: number | undefined = body.themeIndex;

  const idx = typeof themeIndex === "number"
    ? themeIndex % MARKETING_THEMES.length
    : Math.floor(Math.random() * MARKETING_THEMES.length);

  const theme = MARKETING_THEMES[idx];

  let copy;
  try {
    copy = await generateCopy(theme);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: "Copy generation failed", detail: msg }, { status: 500 });
  }
  if (!copy) {
    return NextResponse.json({ ok: false, error: "Copy generation failed", detail: "null return (JSON parse failed)" }, { status: 500 });
  }

  const photoUrl = await fetchPexelsPhoto(copy.photoKeyword);

  return NextResponse.json({
    ok: true,
    themeIndex: idx,
    theme,
    copy,
    photoUrl,
  });
}

export { MARKETING_THEMES };
