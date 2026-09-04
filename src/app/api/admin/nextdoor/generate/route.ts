import { NextRequest, NextResponse } from "next/server";

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

const SYSTEM = `You are a Nextdoor community post writer for CyberCraft360, an AI automation agency based in Sugar Land, TX. You write posts that feel like they're from a real local neighbor-business owner — warm, helpful, conversational, never salesy. Posts must feel native to Nextdoor, not like ads.

CyberCraft360 facts:
- Owner: Saad (runs the business personally)
- What we do: AI phone agents, email automation, lead generation for local service businesses (HVAC, dental, salons, plumbers, roofers, law firms, real estate)
- HQ: Sugar Land, TX (Fort Bend County)
- Website: cybercraft360.com
- Contact: info@cybercraft360.com
- Key benefit: Our AI (Amy) answers every call 24/7, books appointments, follows up — so owners never miss a lead

Nextdoor rules to follow:
- Sound like a neighbor, not a brand
- Use the neighborhood name naturally
- Include a genuine helpful tip or insight (not just promotion)
- End with a soft CTA or an open question to spark comments
- NO hashtags on Nextdoor (they don't work there)
- Keep posts 150-300 words
- First line must be attention-grabbing (it shows as preview)
- Use line breaks for readability`;

const CATEGORY_INSTRUCTIONS: Record<string, string> = {
  intro: "Write a warm introduction post. Saad is introducing himself as a local business owner. Mention the neighborhood specifically. Keep it personal — tell a quick story about why he started this. End with an open question inviting neighbors to say hi or ask questions. NO hard sell.",
  tip: "Write a genuinely helpful tip about AI or business automation that ANY local business owner would find valuable — even if they never hire us. This builds trust. Don't mention CyberCraft360 until the very end (optional soft mention). The tip should be actionable and specific.",
  promo: "Write a soft neighborhood-exclusive offer. Frame it as a thank-you to the local community, not an ad. Mention a specific pain point local service business owners face (missed calls, no-shows, etc.). Offer something tangible (free strategy call, free AI audit). Keep it light and conversational.",
  story: "Write a brief client success story (keep client anonymous — 'a local HVAC owner', 'a Sugar Land dental practice'). Make it specific with numbers if possible (e.g., '12 extra booked appointments per week'). Focus on the problem they had, not the tech. End with how neighbors can get similar results.",
  question: "Write a community engagement post that asks local business owners a genuine question about a challenge they face. Get them talking in the comments. Don't mention AI or CyberCraft360 prominently — this is about sparking discussion. Examples: 'What's your biggest challenge when you're slammed with calls?'",
  event: "Write a post promoting a free, no-pressure online event (e.g., '30-minute AI demo for local business owners', 'Free webinar: How local service businesses are using AI to book more clients'). Make it feel exclusive to the neighborhood. Include a specific date placeholder like [Date TBD].",
};

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { category, categoryLabel, neighborhood, tone, customContext } = await req.json();

    const toneNote = tone === "professional" ? "Use a confident, professional tone." : tone === "casual" ? "Use a very casual, relaxed tone — like texting a neighbor." : "Use a warm, friendly neighborhood-neighbor tone.";
    const contextNote = customContext ? `\n\nExtra context to weave in naturally: ${customContext}` : "";
    const instruction = CATEGORY_INSTRUCTIONS[category] || CATEGORY_INSTRUCTIONS.intro;

    const prompt = `Write 3 different Nextdoor posts for the "${categoryLabel}" category, targeting the ${neighborhood} neighborhood.

${instruction}

${toneNote}${contextNote}

Return ONLY valid JSON:
{
  "posts": [
    {
      "title": "Short internal label (5 words max)",
      "post": "The full Nextdoor post text",
      "tags": ["keyword1", "keyword2"]
    },
    { "title": "...", "post": "...", "tags": [...] },
    { "title": "...", "post": "...", "tags": [...] }
  ]
}

Each post must be distinct — different angle, different opening line, different CTA.`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

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
        temperature: 0.85,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: data.error?.message || "AI generation failed" }, { status: 500 });
    }

    const parsed = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
