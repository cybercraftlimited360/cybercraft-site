import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing CEREBRAS_API_KEY" }, { status: 500 });

  const { lead, platform } = await req.json() as {
    lead: {
      name: string; industry: string; city: string; rating: number; reviewCount: number;
      website?: string; email?: string; ownerName?: string; flags?: string[];
    };
    platform: "linkedin" | "facebook" | "email";
  };

  const painPoints: Record<string, string> = {
    "HVAC": "missing calls during peak season when techs are on the road",
    "Dental": "patients calling after hours and booking with a competitor instead",
    "Real Estate": "leads going cold because follow-up takes too long",
    "Plumbing": "missing emergency calls on nights and weekends",
    "Roofing": "losing storm-season leads to faster-responding competitors",
    "Auto Repair": "customers hanging up when put on hold too long",
    "Cleaning": "missing quote requests outside business hours",
  };

  const pain = painPoints[lead.industry] ?? "missed calls and slow lead follow-up";
  const ownerLine = lead.ownerName ? `\n- Owner name: ${lead.ownerName}` : "";
  const flagLine = lead.flags?.length ? `\n- Notable signals: ${lead.flags.join(", ")}` : "";
  const emailLine = lead.email ? `\n- Email on file: ${lead.email}` : "";

  const prompts: Record<string, string> = {
    linkedin: `Write a short, personalized LinkedIn connection message from Saad Imran, founder of CyberCraft360, to the owner or manager of "${lead.name}", a ${lead.industry} business in ${lead.city}.

Context about their business:
- Rating: ${lead.rating ?? "unknown"} stars, ${lead.reviewCount} Google reviews
- Common pain point for their industry: ${pain}
- Website: ${lead.website ?? "none found"}${ownerLine}${flagLine}

Rules:
- Under 300 characters (LinkedIn limit)
- If owner name is provided, address them by first name
- Sound like a real person, not a sales pitch
- Reference something specific about their type of business or the signals above
- No "I hope this message finds you well"
- End with a soft question, not a CTA
- First person, conversational

Return ONLY the message text, nothing else.`,

    facebook: `Write a short Facebook message from Saad Imran, founder of CyberCraft360, to the owner of "${lead.name}", a ${lead.industry} business in ${lead.city}.

Context: ${pain}${ownerLine}${flagLine}

Rules:
- 2-3 sentences max
- If owner name is provided, address them by first name
- Sounds like a real person stumbled on their page
- Mention something specific to ${lead.industry}
- Soft, no pressure
- No emojis

Return ONLY the message text, nothing else.`,

    email: `Write a cold email from Saad Imran, founder of CyberCraft360, to the owner of "${lead.name}", a ${lead.industry} business in ${lead.city}.

Context:
- Rating: ${lead.rating ?? "unknown"} stars, ${lead.reviewCount} reviews
- Pain point: ${pain}
- Website: ${lead.website ?? "none found"}${ownerLine}${flagLine}${emailLine}

Rules:
- Subject line + body
- If owner name is provided, use it in the greeting
- Under 150 words total
- Specific stat or observation in the first line (reference their review count or score if notable)
- One clear CTA: 15-minute call
- No corporate language
- Sign off as Saad, CyberCraft360

Return JSON: { "subject": "...", "body": "..." }`,
  };

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: prompts[platform] }],
      max_tokens: 400,
      temperature: 0.85,
      stream: false,
    }),
  });

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (platform === "email") {
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim());
      return NextResponse.json({ ok: true, platform, subject: parsed.subject, body: parsed.body });
    } catch {
      return NextResponse.json({ ok: true, platform, body: raw });
    }
  }

  return NextResponse.json({ ok: true, platform, message: raw });
}
