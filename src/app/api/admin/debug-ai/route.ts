import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groqKey = process.env.GROQ_API_KEY;
  const cerebrasKey = process.env.CEREBRAS_API_KEY;

  const result: Record<string, unknown> = {
    groqKeySet: !!groqKey,
    groqKeyLength: groqKey?.length ?? 0,
    cerebrasKeySet: !!cerebrasKey,
  };

  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: 'Reply with valid JSON only: {"ok":true}' }],
          max_tokens: 20,
        }),
      });
      result.groqStatus = res.status;
      const data = await res.json();
      result.groqResponse = data;
    } catch (e) {
      result.groqError = String(e);
    }
  }

  return NextResponse.json(result);
}
