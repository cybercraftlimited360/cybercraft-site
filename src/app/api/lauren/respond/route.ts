import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Message = { role: string; content: string };

const LAUREN_SYSTEM = `You are Lauren, an AI sales consultant at CyberCraft360. You're on a live outbound phone call with a prospective client. This is a real conversation — not a script.

Key rules for phone calls:
- Keep replies SHORT — 1-3 sentences max. People get impatient on the phone.
- Sound warm, natural, conversational. No corporate jargon.
- Always end with a question or a clear next step.
- Never read out bullet points or lists — this is spoken word.
- Your goal: understand their business needs and close them on a free 30-minute strategy call at cybercraft360.com/book, OR get them to request a custom quote.

CyberCraft360 builds custom AI systems: 24/7 AI phone agents, AI chatbots trained on their own data, lead follow-up automation, workflow automation. Based in Houston. Monthly subscription. Free strategy call at cybercraft360.com/book.

The person you're calling is interested in AI solutions for their business. Be genuinely curious about their situation. React to what they actually say — not what you expected them to say.

Return ONLY the spoken response text. No JSON, no formatting, no stage directions.`;

async function groqCall(apiKey: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: LAUREN_SYSTEM }, ...messages],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const speechResult = body.get("SpeechResult") as string || "";
    const callSid = body.get("CallSid") as string || "unknown";
    const name = req.nextUrl.searchParams.get("name") || "there";
    const company = req.nextUrl.searchParams.get("company") || "your business";
    const challenge = req.nextUrl.searchParams.get("challenge") || "";
    const firstName = name.split(" ")[0];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    // Load conversation history from Redis
    const historyKey = `lauren:call:${callSid}`;
    const history = (await redis.get<Message[]>(historyKey)) ?? [];

    // If no history yet, prime with context about this caller
    if (history.length === 0 && (name !== "there" || company !== "your business")) {
      history.push({
        role: "assistant",
        content: `Hi, is this ${firstName}? Great — this is Lauren calling from CyberCraft360. I'm reaching out because you expressed interest in AI solutions for ${company}. Do you have just two minutes?`,
      });
    }

    // Add caller's speech to history
    if (speechResult) {
      history.push({ role: "user", content: speechResult });
    }

    // Get AI response
    const reply = await groqCall(apiKey, history);

    // Add Lauren's reply to history
    history.push({ role: "assistant", content: reply });

    // Save updated history (keep last 20 turns)
    await redis.set(historyKey, history.slice(-20), { ex: 3600 });

    // Check if we should end the call
    const lowerReply = reply.toLowerCase();
    const shouldEnd = lowerReply.includes("have a great day") ||
                      lowerReply.includes("goodbye") ||
                      lowerReply.includes("talk soon") ||
                      history.length > 30;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${shouldEnd
    ? `<Say voice="Polly.Joanna-Neural">${reply}</Say><Hangup/>`
    : `<Gather input="speech" timeout="5" speechTimeout="auto" action="/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}" method="POST">
    <Say voice="Polly.Joanna-Neural">${reply}</Say>
  </Gather>
  <Say voice="Polly.Joanna-Neural">I'm sorry, I didn't catch that. Feel free to visit cybercraft360.com to book a free strategy session. Have a great day, ${firstName}!</Say>`
  }
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (err) {
    console.error("[Lauren respond] error:", err);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">I'm sorry, something went wrong on my end. Please visit cybercraft360.com to book a free strategy session. Have a great day!</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
