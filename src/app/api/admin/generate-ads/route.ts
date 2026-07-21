import { NextRequest, NextResponse } from "next/server";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

const SYSTEM = `You are an expert paid advertising copywriter for CyberCraft360, a premium AI agency in Houston, TX. You write high-converting ad copy that is specific, benefit-driven, and tailored to each platform's format and character limits.

CyberCraft360 builds custom AI systems: AI phone receptionists, AI chatbots, AI voice agents, workflow automation, and AI content engines. Monthly subscriptions $500–$1,500/month. Free 30-min strategy call to start.

Key proof points to weave in naturally:
- Never miss a call again — AI answers 24/7
- Leads followed up in under 60 seconds (humans average 42 hours)
- Save 28+ hours/week on admin tasks
- Custom built for each business — no templates
- Based in Houston, TX
- Free strategy session with no obligation`;

async function groq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      max_tokens: 1800,
      temperature: 0.82,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { audience, goal, tone } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });

    const brief = `Target audience: ${audience}
Campaign goal: ${goal}
Tone: ${tone}`;

    // Run all 3 platform prompts in parallel
    const [linkedinRaw, facebookRaw, instagramRaw] = await Promise.all([

      groq(apiKey, `${brief}

Write 3 LinkedIn ad variations for CyberCraft360. Each variation must have different angles (e.g. pain-point, social proof, curiosity).

Return ONLY this JSON structure:
{
  "variations": [
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." }
  ]
}

Rules:
- headline: max 150 characters, punchy and specific
- body: max 600 characters, conversational, no bullet points, 2-3 short paragraphs
- cta: one of: "Book Free Call", "Get Free Quote", "Learn More", "See How It Works", "Book a Demo"
- No emojis in headline. 1-2 emojis max in body, used sparingly
- Mention Houston or "local business" at least once across the 3 variations
- Each variation must feel distinctly different in angle and opening line`),

      groq(apiKey, `${brief}

Write 3 Facebook ad variations for CyberCraft360. Each variation should have a different hook.

Return ONLY this JSON structure:
{
  "variations": [
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." },
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." },
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." }
  ]
}

Rules:
- primary_text: 80-125 characters for the main feed text shown above the image. Hook in the first sentence.
- headline: max 40 characters — this shows on the ad card below the image
- description: max 30 characters — short benefit statement below headline
- cta: one of: "Book Now", "Learn More", "Get Quote", "Sign Up", "Contact Us"
- Use 1-2 emojis in primary_text to increase scroll-stop
- Make each variation open with a completely different hook (question, stat, story, or bold claim)`),

      groq(apiKey, `${brief}

Write 3 Instagram ad caption variations for CyberCraft360. Instagram is visual and scroll-stopping — lead with the hook.

Return ONLY this JSON structure:
{
  "variations": [
    { "hook": "...", "caption": "...", "hashtags": "..." },
    { "hook": "...", "caption": "...", "hashtags": "..." },
    { "hook": "...", "caption": "...", "hashtags": "..." }
  ]
}

Rules:
- hook: first 1-2 lines shown before "more" — must stop the scroll. Max 125 characters. Use 1-2 emojis.
- caption: full caption body continuing from the hook. 150-300 characters. Conversational, end with a soft CTA directing to link in bio or cybercraft360.com
- hashtags: 8-12 relevant hashtags as a single string. Mix: niche (#houstonbusiness #aiforbusiness), broad (#smallbusiness #entrepreneur), and branded (#cybercraft360 #aiagency)
- Each variation must open with a completely different hook type (question / bold stat / "POV:" / "If your business..." etc.)`),

    ]);

    const linkedin = JSON.parse(linkedinRaw).variations ?? [];
    const facebook = JSON.parse(facebookRaw).variations ?? [];
    const instagram = JSON.parse(instagramRaw).variations ?? [];

    return NextResponse.json({ ads: { linkedin, facebook, instagram } });

  } catch (err: any) {
    console.error("[generate-ads]", err);
    return NextResponse.json({ error: err.message || "Generation failed" }, { status: 500 });
  }
}
