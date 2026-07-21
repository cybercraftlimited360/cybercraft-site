import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

async function groqAnalyze(apiKey: string, competitor: string, notes: string): Promise<any> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a competitive intelligence analyst for CyberCraft360, a premium bespoke AI agency in Houston TX that builds custom AI systems for SMBs. Strengths: fully custom builds, Houston-local, founder relationship, monthly subscription, AI phone + chat + voice + automation under one roof.`,
        },
        {
          role: "user",
          content: `Analyze this competitor for CyberCraft360:\n\nCompetitor: ${competitor}\nNotes: ${notes || "No additional notes"}\n\nReturn JSON with: positioning, likely_strengths, likely_weaknesses, counter_angle, talking_points, watch_for`,
        },
      ],
      max_tokens: 600,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return JSON.parse(data.choices[0].message.content);
}

// Vercel Cron calls this every Monday at 8am UTC
export async function GET(req: NextRequest) {
  // Vercel passes CRON_SECRET as Authorization header
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No GROQ_API_KEY" }, { status: 500 });

  const competitors = await redis.get<any[]>("competitors:all") ?? [];
  if (competitors.length === 0) return NextResponse.json({ ok: true, refreshed: 0 });

  let refreshed = 0;
  const updated = await Promise.all(
    competitors.map(async (c) => {
      try {
        const analysis = await groqAnalyze(apiKey, c.name, c.notes || "");
        refreshed++;
        return { ...c, analysis, updatedAt: new Date().toISOString(), autoRefreshedAt: new Date().toISOString() };
      } catch {
        return c;
      }
    })
  );

  await redis.set("competitors:all", updated);
  console.log(`[cron] reanalyzed ${refreshed}/${competitors.length} competitors`);
  return NextResponse.json({ ok: true, refreshed, total: competitors.length });
}
