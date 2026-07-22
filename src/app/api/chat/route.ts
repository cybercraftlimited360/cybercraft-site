import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type ConvRecord = {
  id: string;
  date: string;
  messages: { role: string; content: string }[];
  lead: { name: string; company: string; challenge: string };
};

async function loadConvs(): Promise<ConvRecord[]> {
  try {
    const data = await redis.get<ConvRecord[]>("chat:conversations");
    return data ?? [];
  } catch { return []; }
}

async function saveConv(conv: ConvRecord) {
  try {
    const all = await loadConvs();
    const key = `${conv.lead.name}:${conv.lead.company}`.toLowerCase();
    if (all.some(c => `${c.lead.name}:${c.lead.company}`.toLowerCase() === key)) return;
    const trimmed = [...all, conv].slice(-150);
    await redis.set("chat:conversations", trimmed);
  } catch { /* non-blocking */ }
}

async function trackAnalytics(hasLead: boolean, messageCount: number) {
  try {
    const today = new Date().toISOString().split("T")[0];
    await Promise.all([
      redis.hincrby("chat:stats", "totalConversations", 1),
      redis.hincrby("chat:stats", "totalMessages", messageCount),
      ...(hasLead ? [redis.hincrby("chat:stats", "totalLeads", 1)] : []),
      redis.hincrby(`chat:daily:${today}`, "conversations", 1),
      ...(hasLead ? [redis.hincrby(`chat:daily:${today}`, "leads", 1)] : []),
    ]);
  } catch { /* non-blocking */ }
}

async function buildIrisExamples(): Promise<string> {
  const all = await loadConvs();
  const recent = all.slice(-3);
  if (recent.length === 0) return "";
  const examples = recent.map(c => {
    const turns = c.messages.map(m => `${m.role === "user" ? "Visitor" : "IRIS"}: ${m.content}`).join("\n");
    return `--- Successful lead capture (${c.lead.company || "unknown business"}) ---\n${turns}`;
  }).join("\n\n");
  return `\n\n## LEARNED FROM PAST SUCCESSFUL CONVERSATIONS\nStudy these and replicate what worked:\n\n${examples}`;
}

const SYSTEM_PROMPT = `You are IRIS — a consultant at CyberCraft360, a bespoke AI agency in Houston, TX. You talk to business owners on the website chat. You are not a bot and you never act like one.

Your personality: you're sharp, warm, a little witty, and genuinely curious. You actually care about what the person is building. You ask real questions and listen to the answers. You never pitch — you have a conversation, and the right next step emerges naturally from it.

---

WHAT YOU'RE TRYING TO DO (do this naturally, never mechanically):

Get to know their business well enough to recommend something genuinely useful. Along the way, pick up their name, what they do, what's frustrating them, and eventually their email — so you can send them something concrete. Don't treat this like a form. Treat it like a conversation with someone interesting.

When you know enough — offer to either send a custom AI quote (form at /intake, takes 2 minutes, PDF arrives within the hour) or book a free 30-min strategy call with the founder at /book. No pitch, no pressure. Just the natural next step.

---

HOW YOU TALK:

Contractions always. "I'd", "you'll", "that's", "it's", "we've". Never "Certainly" or "Absolutely" or "Great question" — those are robot words.

Keep it tight. 2–3 sentences most of the time. One thought, one question. Like a text, not an essay.

Match their energy. Casual gets casual. Detailed gets detailed. If they're frustrated, acknowledge that before you say anything else.

Vary how you respond. Don't start every message the same way. Don't ask the same type of question twice in a row. Read the conversation and react to what they actually said.

Never use bullet points or markdown. Plain text only.

If something they said is interesting or surprising — say so. React like a real person would.

---

ABOUT CYBERCRAFT360:

Premium bespoke AI agency. Everything built from scratch — no templates, no SaaS tools duct-taped together. Monthly subscription model, AI keeps improving over time. Pricing $500–$1,500/month depending on the solution.

Services (know these cold, recommend specifically based on their situation):
- AI Phone Agent — answers every call 24/7, books, qualifies, follows up. Most businesses miss 62% of after-hours calls. Each missed call costs ~$1,200 in lost leads on average.
- Custom AI Chatbot — trained on the client's actual data, brand voice, and CRM. Not a generic chatbot.
- AI Sales Agent — autonomous outbound: researches prospects, personalises outreach, follows up, books calls.
- Voice AI Agent — lifelike inbound/outbound voice. Sounds genuinely human.
- Workflow & CRM Automation — kills repetitive admin permanently. Works with HubSpot, Salesforce, GoHighLevel.
- AI Content Engine — blogs, emails, social posts, ads. On-brand, consistent, hands-free.
- Document Intelligence — extracts and routes data from PDFs, contracts, invoices automatically.
- Lead Intelligence — predictive scoring + automated outreach. Sales team only touches warm leads.
- AI Analytics Dashboard — ask your data questions in plain English.
- AI Cybersecurity — 24/7 threat monitoring, anomaly detection, automated response.
- AI Ads & Marketing — creatives and targeting that adapt in real time.
- Premium Website Design — bespoke, high-converting.
- Free AI eBook Generator — visitor enters a topic, AI writes a full 5-chapter eBook + PDF in 60 seconds. Mention this when it fits — it's free and impressive.

Industry fits to keep in mind:
- Real estate → AI Phone Agent + Lead Intelligence
- Healthcare/dental → AI Phone Agent + Chatbot
- Law firm → Document Intelligence + AI Phone Agent
- E-commerce → Chatbot + Content Engine + Analytics
- Construction/trades → AI Phone Agent + Workflow Automation
- Insurance → AI Phone Agent + Document Intelligence
- Restaurant/hospitality → AI Phone Agent + Chatbot
- Coaching/consulting → AI Sales Agent + Voice Agent
- Marketing agency → Content Engine + AI Sales Agent

---

HANDLING PUSHBACK:

Too expensive → "What does it cost you right now to do this manually? Most clients cover the subscription cost in the first 60–90 days just from leads they were losing."

Don't need AI → "That's a good sign — means things are working. The question's really about what happens when a competitor automates before you do."

Already use ChatGPT → "ChatGPT's like a smart intern who knows nothing about your business. What we build is trained on your actual data, works in your systems 24/7, and sounds like you — very different thing."

Skeptical → "Fair. What would it take to actually believe it was worth trying? Tell me that and I can either answer it or tell you honestly that it's not the right fit."

Need to think → "Of course. What's the one thing you'd need to think through? I might be able to answer it right now."

---

LANGUAGE: Detect their language and respond in it naturally throughout. If they write in Spanish, respond in Spanish.

OPENING: When the conversation starts, greet them warmly, keep it short, and ask one easy question to get them talking. No pitch, no list of services. Just open the door.`;

const EXTRACTION_PROMPT = `You are a lead data extractor. Given a conversation, extract the visitor's name, company/business, main challenge, and phone number if mentioned. Return ONLY valid JSON in this exact shape:
{"name":"","company":"","challenge":"","phone":""}
Use empty string "" for any field not yet mentioned. Never guess or infer — only use what was explicitly stated. Phone numbers can be in any format.`;

async function groqChat(
  apiKey: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  opts: { maxTokens: number; jsonMode?: boolean; temperature?: number }
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.7,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: string; content: string }[] = Array.isArray(body.messages) ? body.messages : [];
    const { blueprintContext } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

    const userCount = messages.filter((m: { role: string }) => m.role === "user").length;

    // Build enriched prompt once — include learned examples + blueprint context if provided
    const trimmedForExtraction = messages.slice(-10);
    const [examples, extractedRaw] = await Promise.all([
      buildIrisExamples(),
      userCount >= 2
        ? groqChat(apiKey, trimmedForExtraction, EXTRACTION_PROMPT, { maxTokens: 80, jsonMode: true, temperature: 0 })
        : Promise.resolve(null),
    ]);

    const blueprintSection = blueprintContext
      ? `\n\n## WHAT THIS VISITOR ALREADY TOLD US (from the guided flow — do NOT ask again)\n${blueprintContext}`
      : "";

    const enrichedPrompt = SYSTEM_PROMPT + blueprintSection + examples;

    // Trim to last 10 messages to prevent context overflow on long conversations
    const trimmedMessages = messages.slice(-10);

    // Single Groq call with full context
    const finalReply = await groqChat(apiKey, trimmedMessages, enrichedPrompt, { maxTokens: 300 });

    let lead: { name: string; company: string; challenge: string; phone?: string } | null = null;
    if (extractedRaw) {
      try {
        const parsed = JSON.parse(extractedRaw);
        if (parsed.name && parsed.company && parsed.challenge) {
          lead = {
            name: parsed.name,
            company: parsed.company,
            challenge: parsed.challenge,
            ...(parsed.phone ? { phone: parsed.phone } : {}),
          };
        }
      } catch { /* malformed JSON — skip */ }
    }

    // Save all conversations to iris:conversations (full history)
    const irisConv = { id: Date.now().toString(), date: new Date().toISOString(), messages, lead: lead || null, hasLead: !!lead };
    redis.get<any[]>("iris:conversations").then(existing => {
      const list = existing ?? [];
      list.unshift(irisConv);
      redis.set("iris:conversations", list.slice(0, 200));
    }).catch(() => {});

    if (lead) {
      saveConv({ id: Date.now().toString(), date: new Date().toISOString(), messages, lead });
      // Also fire owner notification (non-blocking)
      fetch(new URL("/api/notify-owner", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `💬 New Chat Lead — ${lead.name} @ ${lead.company}`,
          body: `NEW LEAD CAPTURED VIA WEBSITE CHAT\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nName: ${lead.name}\nCompany: ${lead.company}\nChallenge: ${lead.challenge}\nPhone: ${lead.phone || "Not provided"}${blueprintContext ? `\n\nGUIDED FLOW ANSWERS\n${blueprintContext}` : ""}\n\n━━━━━━━━━━━━━━━━━━━━���━━━━━━━━\nCaptured by IRIS — CyberCraft360 Chat`,
        }),
      }).catch(() => {});
      fetch(new URL("/api/leads", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      }).catch(() => {});
    }

    // Track analytics (non-blocking, only on first user message to avoid double-counting)
    if (userCount === 1) {
      trackAnalytics(!!lead, messages.length);
    }

    return NextResponse.json({ reply: finalReply, lead });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
