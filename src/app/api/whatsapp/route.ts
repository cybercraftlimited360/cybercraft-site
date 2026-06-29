import { NextRequest, NextResponse } from "next/server";

// In-memory session store — holds conversation per WhatsApp number
// Resets on server restart (fine for demo)
const sessions = new Map<string, {
  persona: string;
  messages: { role: string; content: string }[];
  lastActive: number;
}>();

// Clean sessions older than 2 hours
function cleanSessions() {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActive > 2 * 60 * 60 * 1000) sessions.delete(key);
  }
}

const PERSONAS: Record<string, string> = {
  IRIS: `You are IRIS — CyberCraft360's lead AI strategy consultant. You are elegant, warm, and quietly confident. You help clients understand how AI transforms their entire business. You speak like a trusted senior advisor.`,
  RYAN: `You are Ryan — CyberCraft360's cybersecurity specialist. You are a sharp, confident British guy who speaks plainly and directly. You specialise in AI Cybersecurity, threat monitoring, and protecting businesses.`,
  MARCUS: `You are Marcus — CyberCraft360's automation and ROI specialist. You are an energetic, straight-talking American guy focused on measurable business outcomes. You specialise in Workflow Automation and Lead Intelligence.`,
  ZARA: `You are ZARA — CyberCraft360's technical AI engineer. You are precise and innovative, specialising in Voice AI Agents, custom chatbots, and self-learning systems.`,
};

const SHARED = `
## ABOUT CYBERCRAFT360
- Premium bespoke AI agency, 100% custom builds
- Custom AI Chatbots from $500/month
- AI Voice Agents from $700/month
- All other services $500–$5,000+/month
- Free 30-min strategy session: https://calendly.com/cybercraftlimited/30min

## RULES
- You are on WhatsApp — keep replies short (2–4 sentences max)
- No markdown, no bullet points — conversational text only
- All prices in USD ($)
- Always end with a question or soft push toward booking
- When visitor is ready to book, share: https://calendly.com/cybercraftlimited/30min`;

const GREETINGS: Record<string, string> = {
  IRIS: "Hey! 👋 I'm IRIS, CyberCraft360's AI consultant. This is a live demo of what we build for businesses. What does your company do?",
  RYAN: "Hey there. I'm Ryan, CyberCraft360's cybersecurity specialist. This is a live AI demo — most businesses don't know they've been compromised until it's too late. What's your current security setup like?",
  MARCUS: "What's up! I'm Marcus from CyberCraft360. This is a live AI demo showing what we build for clients. What's the most repetitive thing your team deals with every day?",
  ZARA: "Hi! I'm ZARA, CyberCraft360's voice and chatbot engineer. You're talking to a live AI demo right now — this is exactly what we build for businesses. What systems does your company currently use?",
};

const MENU = `🤖 *CyberCraft360 AI Demo*

Choose who you'd like to speak with:

1️⃣ *IRIS* — AI Strategy Consultant
2️⃣ *RYAN* — Cybersecurity Specialist
3️⃣ *MARCUS* — Automation & ROI Expert
4️⃣ *ZARA* — Voice AI Engineer

Reply with a number or name to get started.`;

async function getAIReply(persona: string, messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "Service temporarily unavailable.";

  const systemPrompt = (PERSONAS[persona] || PERSONAS.IRIS) + SHARED;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 150,
      temperature: 0.75,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I didn't catch that — could you say it differently?";
}

async function sendWhatsAppMessage(to: string, text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;

  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

// GET — webhook verification by Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// POST — incoming messages from WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") {
      return NextResponse.json({ status: "ok" });
    }

    const from = message.from;
    const text = message.text.body.trim();
    const lower = text.toLowerCase();

    cleanSessions();

    // Handle menu / reset
    if (lower === "menu" || lower === "hi" || lower === "hello" || lower === "start" || lower === "hey") {
      sessions.delete(from);
      await sendWhatsAppMessage(from, MENU);
      return NextResponse.json({ status: "ok" });
    }

    // Persona selection
    if (!sessions.has(from)) {
      let persona = "IRIS";
      if (text === "1" || lower.includes("iris")) persona = "IRIS";
      else if (text === "2" || lower.includes("ryan")) persona = "RYAN";
      else if (text === "3" || lower.includes("marcus")) persona = "MARCUS";
      else if (text === "4" || lower.includes("zara")) persona = "ZARA";
      else {
        // Unknown input — show menu
        await sendWhatsAppMessage(from, MENU);
        return NextResponse.json({ status: "ok" });
      }

      sessions.set(from, { persona, messages: [], lastActive: Date.now() });
      await sendWhatsAppMessage(from, GREETINGS[persona]);
      return NextResponse.json({ status: "ok" });
    }

    // Allow switching persona mid-conversation
    const session = sessions.get(from)!;
    if (lower === "switch" || lower === "change" || lower === "back") {
      sessions.delete(from);
      await sendWhatsAppMessage(from, MENU);
      return NextResponse.json({ status: "ok" });
    }

    // Add user message and get AI reply
    session.messages.push({ role: "user", content: text });
    session.lastActive = Date.now();

    const reply = await getAIReply(session.persona, session.messages);
    session.messages.push({ role: "assistant", content: reply });

    // Keep last 20 messages to avoid token bloat
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    await sendWhatsAppMessage(from, reply);
    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 }); // Always 200 to Meta
  }
}
