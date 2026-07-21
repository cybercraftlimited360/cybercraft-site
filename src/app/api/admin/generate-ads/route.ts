import { NextRequest, NextResponse } from "next/server";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

const SYSTEM = `You are a world-class advertising copywriter — the kind companies pay $500/hour for. You have written campaigns for Apple, Nike, and top DTC brands. You now write exclusively for CyberCraft360, a premium bespoke AI agency in Houston, TX founded by Saad Imran.

Your copy has three qualities that separate it from everything else:
1. SPECIFIC — real numbers, real scenarios, real pain. Never abstract.
2. UNEXPECTED — the reader did not see the first sentence coming. You never open with what everyone else opens with.
3. EARNED — you don't claim to be premium, you write like it. The quality of the language IS the premium signal.

---

ABOUT CYBERCRAFT360 (use these details, never invent facts):
- Builds fully custom AI systems — no templates, no off-the-shelf tools, nothing recycled
- Founded by Saad Imran, based in Houston, TX
- AI phone receptionists that answer every call 24/7 — the average business misses 62% of calls that come in after hours
- AI follows up with new leads in under 60 seconds — the industry average is 42 hours, by which point 78% of leads have already gone cold
- Clients save 28+ hours per week on admin work
- Custom AI chatbots trained on the client's actual data, products, and processes
- AI voice agents that sound genuinely human on the phone
- Workflow automation that kills repetitive admin permanently
- Monthly subscription model — the AI gets smarter every month
- Free 30-minute strategy session (no pitch, no obligation — just a real conversation about what AI could do for them)
- Pricing: $500–$1,500/month depending on solution

---

BANNED PHRASES — never write these under any circumstances:
"Take your business to the next level"
"In today's fast-paced world" / "In today's digital landscape"
"Game-changer" / "Revolutionary" / "Cutting-edge" / "State-of-the-art"
"Are you ready to transform your business?"
"We help businesses like yours"
"Unlock your potential"
"Leverage the power of AI"
"Streamline your operations"
"Don't miss out"
"The future is here"
"Boost your productivity"
Any phrase that sounds like it came from a template or a marketing intern

---

WHAT MAKES COPY FEEL EXPENSIVE:
- Specificity: "62% of calls go unanswered after 6pm" hits harder than "never miss a call"
- Restraint: the best line in an ad is usually the shortest one
- Confidence without hype: "We build the AI. You close the deals." — not "We'll 10X your business!"
- It talks to ONE person in a real situation, not a demographic
- It acknowledges the reader is smart — it doesn't over-explain
- The CTA feels like the natural next step, not a pressure tactic`;

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
      max_tokens: 2200,
      temperature: 0.9,
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

    const brief = `WHO THIS AD IS FOR: ${audience}
WHAT WE WANT THEM TO DO: ${goal}
TONE: ${tone}`;

    const [linkedinRaw, facebookRaw, instagramRaw] = await Promise.all([

      groq(apiKey, `${brief}

Write 3 LinkedIn ad variations for CyberCraft360. These will run as sponsored LinkedIn posts targeting business owners and decision-makers.

Return ONLY valid JSON in exactly this structure — no extra keys, no markdown:
{
  "variations": [
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." },
    { "headline": "...", "body": "...", "cta": "..." }
  ]
}

PLATFORM RULES:
- headline: max 150 chars. No exclamation marks. Reads like a sharp observation or a specific claim, not an ad slogan.
- body: 3 short paragraphs. Max 550 chars total. No bullet points. Reads like a smart founder talking to a peer, not a salesperson pitching a product. End with the CTA naturally woven in — not bolted on.
- cta: max 5 words. Natural, not pushy.

THE THREE VARIATIONS MUST USE THREE COMPLETELY DIFFERENT ANGLES:
Variation 1 — Lead with a specific, uncomfortable truth about their situation. The kind of stat or fact that makes them stop and think "that's me."
Variation 2 — Lead with a concrete before/after scenario. What their week looks like now vs. what it looks like with the AI running. Make it painfully recognizable.
Variation 3 — Lead with authority and restraint. Saad Imran / CyberCraft360 making a quiet, confident claim with zero hype. Let the specifics do the selling.

QUALITY BAR: If a LinkedIn user saw this in their feed and thought "who wrote this — this is actually good", you've done it right. If it reads like an ad template, rewrite it.`),

      groq(apiKey, `${brief}

Write 3 Facebook ad variations for CyberCraft360. These appear in the Facebook news feed — the reader is scrolling on their phone, half-distracted. You have 1.5 seconds to stop them.

Return ONLY valid JSON in exactly this structure — no extra keys, no markdown:
{
  "variations": [
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." },
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." },
    { "primary_text": "...", "headline": "...", "description": "...", "cta": "..." }
  ]
}

PLATFORM RULES:
- primary_text: 3-5 punchy sentences. Max 200 chars. The FIRST sentence is everything — it either stops the scroll or it doesn't. Use 1 emoji max, only if it adds punch.
- headline: max 40 chars. Shows below the image. Should feel like the payoff line — the thing that lands after you've read the primary text.
- description: max 30 chars. One specific micro-benefit or differentiator.
- cta: "Book Now" / "Learn More" / "Get Quote" — pick whichever fits.

THE THREE VARIATIONS MUST USE THREE COMPLETELY DIFFERENT SCROLL-STOPPING HOOKS:
Variation 1 — Open with a hard number or uncomfortable stat relevant to their industry. "62 calls went to voicemail last month." "Your competitor called that lead back 41 hours before you did."
Variation 2 — Open with a specific scenario they recognize. Not abstract — a specific Tuesday-afternoon moment that resonates. Make them feel seen.
Variation 3 — Open with a short, unexpected statement that creates curiosity. Something that feels slightly off or counterintuitive — the kind of line that makes you read the next sentence.

QUALITY BAR: If someone screenshots this and sends it to a friend saying "look at this ad", you've done it right.`),

      groq(apiKey, `${brief}

Write 3 Instagram ad caption variations for CyberCraft360. Instagram is visual-first — the image does the heavy lifting, the caption does the closing. Your job is to be real, specific, and human. No corporate voice whatsoever.

Return ONLY valid JSON in exactly this structure — no extra keys, no markdown:
{
  "variations": [
    { "hook": "...", "caption": "...", "hashtags": "..." },
    { "hook": "...", "caption": "...", "hashtags": "..." },
    { "hook": "...", "caption": "...", "hashtags": "..." }
  ]
}

PLATFORM RULES:
- hook: the first 1-2 lines before "...more". Max 120 chars. This alone decides if they tap to read. Use 1-2 emojis that feel natural, not decorative. Must stop mid-scroll.
- caption: continues from the hook. 180-280 chars. Conversational, like a text from a smart friend. End with a soft, low-friction CTA — never "DM us!" or "Click the link in bio!" — something more natural like "cybercraft360.com if you want to see how it works" or "book a free call — link's in the bio, no pitch."
- hashtags: exactly 10 hashtags as one string. Mix of specific (#houstonbusiness #aireceptionist #smallbusinessai) and broad (#entrepreneur #businessowner #automation). Always include #cybercraft360 and #aiagency.

THE THREE VARIATIONS MUST USE THREE COMPLETELY DIFFERENT FORMATS:
Variation 1 — "POV:" format. Drop the reader into a specific moment they recognize — a moment where the pain is most real or the solution lands hardest.
Variation 2 — Lead with a short, specific stat or fact. Then make it personal immediately. "The average small business misses 62% of calls after 6pm. That was us too — until it wasn't."
Variation 3 — Conversational, almost diary-like. Something Saad might actually post organically. First person, real and specific, doesn't feel like an ad at all.

QUALITY BAR: It should feel like a founder who actually cares wrote this at 11pm — not like a marketing team approved it at 2pm on a Wednesday.`),

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
