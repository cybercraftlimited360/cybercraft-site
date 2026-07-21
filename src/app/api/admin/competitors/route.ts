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

  // ── Auto-seed: discover competitors via Groq ──────────────────────────────
  if (action === "auto-seed") {
    if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });
    const existing = await redis.get<any[]>("competitors:all") ?? [];

    const seedRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a competitive intelligence analyst. CyberCraft360 is a premium bespoke AI agency in Houston TX that builds custom AI phone agents, chatbots, voice assistants, and automation systems for small-to-medium businesses. Monthly subscription model, fully custom (no templates), founder-led.`,
          },
          {
            role: "user",
            content: `List the top 8 competitors CyberCraft360 should be tracking. Include: national AI agency platforms, local Houston competitors, and template-based chatbot tools that businesses often compare them to.

Return a JSON object: { "competitors": [ { "name": "...", "website": "...", "notes": "1-2 sentence description of what they do and why businesses consider them" } ] }`,
          },
        ],
        max_tokens: 900,
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });
    const seedData = await seedRes.json();
    if (!seedRes.ok) return NextResponse.json({ error: seedData.error?.message }, { status: 500 });

    const suggestions: any[] = JSON.parse(seedData.choices[0].message.content).competitors || [];
    const existingNames = existing.map((c: any) => c.name.toLowerCase());
    const toAdd = suggestions.filter((s: any) => !existingNames.includes(s.name.toLowerCase()));

    // Analyze each new competitor in parallel (max 8)
    const analyzed = await Promise.all(
      toAdd.slice(0, 8).map(async (s: any) => {
        let analysis = null;
        try { analysis = await groqAnalyze(apiKey, s.name, s.notes); } catch {}
        return { id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name: s.name, website: s.website || "", notes: s.notes || "", analysis, addedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), autoSeeded: true };
      })
    );

    const updated = [...existing, ...analyzed];
    await redis.set("competitors:all", updated);
    return NextResponse.json({ ok: true, added: analyzed.length, competitors: updated });
  }

  // ── Scan leads for competitor mentions ────────────────────────────────────
  if (action === "scan-leads") {
    const competitors = await redis.get<any[]>("competitors:all") ?? [];
    const leads = await redis.get<any[]>("leads:all") ?? [];
    if (competitors.length === 0) return NextResponse.json({ mentions: [] });

    const mentions: { competitorId: string; competitorName: string; count: number; leads: string[] }[] = [];

    for (const comp of competitors) {
      const regex = new RegExp(comp.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matched = leads.filter((l: any) =>
        regex.test(l.challenge || "") || regex.test(l.company || "") || regex.test(l.notes || "")
      );
      if (matched.length > 0) {
        mentions.push({
          competitorId: comp.id,
          competitorName: comp.name,
          count: matched.length,
          leads: matched.map((l: any) => l.name || "Unknown").slice(0, 5),
        });
      }
    }

    // Also scan Lauren call transcripts
    const callLog = await redis.get<any[]>("lauren:call-log") ?? [];
    for (const mention of mentions) {
      const comp = competitors.find((c: any) => c.id === mention.competitorId);
      if (!comp) continue;
      const regex = new RegExp(comp.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const callMatches = callLog.filter((call: any) =>
        (call.transcript || []).some((m: any) => regex.test(m.content || ""))
      );
      if (callMatches.length > 0) mention.count += callMatches.length;
    }

    mentions.sort((a, b) => b.count - a.count);
    return NextResponse.json({ mentions });
  }

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
