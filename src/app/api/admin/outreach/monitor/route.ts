import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

const PAIN_KEYWORDS = [
  "missed call", "missing calls", "can't answer", "no receptionist", "after hours",
  "lost a lead", "lost leads", "can't keep up", "overwhelmed with calls", "calls going to voicemail",
  "need a receptionist", "hiring receptionist", "too many calls", "no one answers",
  "automate", "automation help", "follow up", "following up with leads", "lead follow up",
  "chatbot", "AI receptionist", "AI for my business", "answering service",
  "booking appointments", "can't book", "no-show", "reduce no shows",
];

// Generate a comment draft using Cerebras
async function generateComment(postText: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [{
        role: "user",
        content: `You are Saad Imran, founder of CyberCraft360, a boutique AI agency that builds custom voice agents and automation for small businesses.

Someone in a Facebook business group posted this:
"${postText.slice(0, 500)}"

Write a short, helpful comment reply. Rules:
- 2-4 sentences max
- Lead with genuinely useful advice or a relevant observation — NOT a pitch
- Only mention CyberCraft360 or AI in the last sentence, and only if it's natural
- Sound like a real person, not a marketer
- No emojis, no hashtags
- If they're asking about AI/automation, you can be more direct about what's possible

Return ONLY the comment text, nothing else.`
      }],
      max_tokens: 200,
      temperature: 0.8,
      stream: false,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// POST — scan a post text for pain points and generate a comment draft
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing CEREBRAS_API_KEY" }, { status: 500 });

  const { postText, postUrl, groupName } = await req.json() as {
    postText: string;
    postUrl?: string;
    groupName?: string;
  };

  const lower = postText.toLowerCase();
  const matchedKeywords = PAIN_KEYWORDS.filter(k => lower.includes(k.toLowerCase()));
  const isRelevant = matchedKeywords.length > 0;

  const comment = isRelevant ? await generateComment(postText, apiKey) : null;

  // Save to monitor log
  if (isRelevant) {
    const log = await redis.get<any[]>("outreach:monitor_log") ?? [];
    log.unshift({
      id: `mon_${Date.now()}`,
      postText: postText.slice(0, 300),
      postUrl,
      groupName,
      matchedKeywords,
      commentDraft: comment,
      createdAt: new Date().toISOString(),
      actioned: false,
    });
    await redis.set("outreach:monitor_log", log.slice(0, 100));
  }

  return NextResponse.json({ isRelevant, matchedKeywords, commentDraft: comment });
}

// GET — list saved monitor alerts
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const log = await redis.get<any[]>("outreach:monitor_log") ?? [];
  return NextResponse.json({ alerts: log });
}

// PATCH — mark alert as actioned
export async function PATCH(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const log = await redis.get<any[]>("outreach:monitor_log") ?? [];
  await redis.set("outreach:monitor_log", log.map((a: any) => a.id === id ? { ...a, actioned: true } : a));
  return NextResponse.json({ ok: true });
}
