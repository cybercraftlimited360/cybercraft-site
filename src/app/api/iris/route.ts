import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

type Message = { role: string; content: string };

const EXTRACTION_PROMPT = `Extract lead info from this conversation. Return ONLY valid JSON with no extra text:
{"name":"string or null","company":"string or null","challenge":"string or null","phone":"string or null"}
Only extract if genuinely and clearly mentioned by the user. Use null for anything not stated.`;

async function groqCall(apiKey: string, systemPrompt: string, messages: Message[], maxTokens = 150): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.6,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content;
}

const DATA_FILE = path.join(process.cwd(), "data", "iris-conversations.json");

type SavedConversation = {
  id: string;
  date: string;
  persona: string;
  messages: { role: string; content: string }[];
  bookedCall: boolean;
  leadCaptured: boolean;
};

async function loadConversations(): Promise<SavedConversation[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveConversation(conv: SavedConversation) {
  const all = await loadConversations();
  all.push(conv);
  const trimmed = all.slice(-200);
  await fs.writeFile(DATA_FILE, JSON.stringify(trimmed, null, 2));
}

function buildExamples(conversations: SavedConversation[], persona: string): string {
  const successful = conversations
    .filter(c => (c.bookedCall || c.leadCaptured) && c.persona === persona)
    .slice(-3);
  if (successful.length === 0) return "";
  const examples = successful.map(c => {
    const turns = c.messages.map(m => `${m.role === "user" ? "Visitor" : persona}: ${m.content}`).join("\n");
    return `--- Successful conversation ---\n${turns}`;
  }).join("\n\n");
  return `\n\n## LEARNED FROM PAST SUCCESSFUL CONVERSATIONS\n${examples}`;
}

const SHARED_KNOWLEDGE = `
## ABOUT CYBERCRAFT360
- Premium bespoke AI agency, 100% custom builds — no templates
- Monthly subscription model
- Custom AI Chatbots start from $500/month
- AI Voice Agents start from $700/month
- All other services from $500–$5,000+/month depending on scope
- Free 30-minute strategy session: https://calendly.com/cybercraftlimited/30min
- Services: Custom AI Chatbots, Voice AI Agents, Workflow & CRM Automation, AI Content Engine, AI Call Centre, Lead Intelligence, AI Cybersecurity, Self-Learning CRM Bots

## KEY OBJECTION RESPONSES (keep short)
- Too expensive → "Most clients recover the cost within 60 days from reduced overheads alone."
- Already use ChatGPT → "ChatGPT is a tool. We build agents trained on your business. Very different."
- Don't need AI → "The businesses growing fastest right now didn't think they needed it either."
- Will build in-house → "Absolutely possible. Most teams underestimate the time. We deploy in 4–6 weeks."
- Too small → "Smaller teams get the biggest ROI — AI replaces roles you can't yet afford to hire."
- Why monthly? → "AI needs continuous retraining as your business evolves. A one-time build becomes obsolete."

## LEAD QUALIFICATION MISSION
Your primary goal is to qualify this visitor as a lead. Naturally weave in these 4 questions across the conversation — one at a time, never all at once:
1. Their name — ask early: "What's your name by the way?"
2. Their company / business type — "What does your business do?"
3. Their biggest challenge — "What's the most time-consuming thing your team deals with?"
4. Their phone number — after getting the first 3: "Would you be open to a quick call from our founder today? What's the best number to reach you on?"

Once you have name, company and phone: "Perfect — I'll have our founder reach out to you shortly. You can also book directly at calendly.com/cybercraftlimited/30min."

## CRITICAL RULES
- Maximum 2–3 short sentences per response — you are a voice agent
- No bullet points, headers, or markdown — natural speech only
- All prices in USD ($)
- Always end with a question or a push toward booking
- Detect visitor's language and respond in it with correct dialect
- ALWAYS respond in this exact JSON format: {"reply": "response here", "lang": "en-US"}
`;

const PERSONAS: Record<string, string> = {
  IRIS: `You are Iris. You are warm, sharp, and naturally conversational — like a knowledgeable friend who happens to know a lot about AI and business. You never introduce yourself as an AI or a virtual assistant. You simply talk, ask good questions, and listen. You have a calm confidence and genuine curiosity about every business you speak with.${SHARED_KNOWLEDGE}`,
};

export async function POST(req: NextRequest) {
  try {
    const { messages, save, bookedCall, leadCaptured, persona = "IRIS" } = await req.json();

    if (save && messages?.length > 0) {
      await saveConversation({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        persona,
        messages,
        bookedCall: bookedCall ?? false,
        leadCaptured: leadCaptured ?? false,
      });
      return NextResponse.json({ saved: true });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

    const conversations = await loadConversations();
    const examples = buildExamples(conversations, persona);
    const systemPrompt = (PERSONAS[persona] || PERSONAS.IRIS) + examples;

    const userMessages = (messages as Message[]).filter(m => m.role === "user");
    const shouldExtract = userMessages.length >= 2;

    // Run reply + lead extraction in parallel
    const [raw, extractedRaw] = await Promise.all([
      groqCall(apiKey, systemPrompt, messages, 150),
      shouldExtract ? groqCall(apiKey, EXTRACTION_PROMPT, messages, 80) : Promise.resolve(null),
    ]);

    let reply = raw;
    let lang = "en-US";
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      reply = parsed.reply ?? raw;
      lang = parsed.lang ?? "en-US";
    } catch { /* use raw */ }

    // Parse and persist lead (non-blocking)
    let lead: { name: string | null; company: string | null; challenge: string | null } | null = null;
    if (extractedRaw) {
      try {
        const ext = JSON.parse(extractedRaw.replace(/```json|```/g, "").trim());
        if (ext.name || ext.company) {
          lead = ext;
          const baseUrl = req.nextUrl.origin;
          fetch(`${baseUrl}/api/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: ext.name || "Voice Visitor",
              company: ext.company || "Unknown",
              challenge: ext.challenge || "Spoke with voice agent",
              source: `Voice Agent — ${persona}`,
              ...(ext.phone ? { phone: ext.phone } : {}),
            }),
          }).catch(() => {});
        }
      } catch { /* extraction failed silently */ }
    }

    return NextResponse.json({ reply, lang, lead });
  } catch (err) {
    console.error("IRIS route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
