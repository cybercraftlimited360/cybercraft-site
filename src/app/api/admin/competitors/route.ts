import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

async function groqAnalyze(apiKey: string, competitor: string, notes: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a competitive intelligence analyst for CyberCraft360, a premium bespoke AI agency in Houston TX that builds custom AI systems for small-to-medium businesses.

CyberCraft360's strengths: fully custom builds (no templates), Houston-local presence, personal founder relationship, monthly subscription with ongoing improvement, AI phone agents + chatbots + voice + automation all under one roof.

Analyze competitors and give sharp, actionable intelligence — not generic advice.`,
        },
        {
          role: "user",
          content: `Analyze this competitor for CyberCraft360:

Competitor: ${competitor}
Notes/what I know about them: ${notes || "No additional notes"}

Return a JSON object with exactly these fields:
{
  "positioning": "How they position themselves in 1-2 sentences",
  "likely_strengths": "Their 2-3 likely strengths based on their name/type/notes",
  "likely_weaknesses": "Their 2-3 likely weaknesses that CyberCraft360 can exploit",
  "counter_angle": "The single sharpest counter-positioning angle CyberCraft360 should use against them — be specific and bold",
  "talking_points": "3 specific things to say when a prospect mentions this competitor — one per line",
  "watch_for": "What to monitor about them going forward"
}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const competitors = await redis.get<any[]>("competitors:all") ?? [];
  return NextResponse.json({ competitors });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, id, name, website, notes, update } = await req.json();
  const apiKey = process.env.GROQ_API_KEY;

  if (action === "add") {
    const competitors = await redis.get<any[]>("competitors:all") ?? [];
    let analysis = null;
    if (apiKey) {
      try { analysis = JSON.parse(await groqAnalyze(apiKey, name, notes)); } catch {}
    }
    const entry = { id: Date.now().toString(), name, website: website || "", notes: notes || "", analysis, addedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    competitors.push(entry);
    await redis.set("competitors:all", competitors);
    return NextResponse.json({ ok: true, entry });
  }

  if (action === "update-notes") {
    const competitors = await redis.get<any[]>("competitors:all") ?? [];
    const updated = competitors.map(c => c.id === id ? { ...c, notes: update, updatedAt: new Date().toISOString() } : c);
    await redis.set("competitors:all", updated);
    return NextResponse.json({ ok: true });
  }

  if (action === "re-analyze") {
    if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });
    const competitors = await redis.get<any[]>("competitors:all") ?? [];
    const comp = competitors.find(c => c.id === id);
    if (!comp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const analysis = JSON.parse(await groqAnalyze(apiKey, comp.name, comp.notes));
    const updated = competitors.map(c => c.id === id ? { ...c, analysis, updatedAt: new Date().toISOString() } : c);
    await redis.set("competitors:all", updated);
    return NextResponse.json({ ok: true, analysis });
  }

  if (action === "delete") {
    const competitors = await redis.get<any[]>("competitors:all") ?? [];
    await redis.set("competitors:all", competitors.filter(c => c.id !== id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
