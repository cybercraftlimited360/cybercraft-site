import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const SITE_URL = "https://cybercraft360.com";
const LAUREN_URL = "https://amused-empathy-production-6b44.up.railway.app";

type WaMessage = { role: string; content: string };
type WaSession = {
  messages: WaMessage[];
  lastActive: number;
  lead: { name: string | null; email: string | null; company: string | null; industry: string | null; challenge: string | null; phone: string | null };
  leadSaved: boolean;
};

// ── Redis session helpers ─────────────────────────────────────────────────────
async function getSession(phone: string): Promise<WaSession | null> {
  try {
    return await redis.get<WaSession>(`wa:session:${phone}`);
  } catch { return null; }
}

async function saveSession(phone: string, session: WaSession) {
  try {
    // 4 hour TTL — conversations expire after inactivity
    await redis.set(`wa:session:${phone}`, session, { ex: 60 * 60 * 4 });
  } catch {}
}

async function deleteSession(phone: string) {
  try { await redis.del(`wa:session:${phone}`); } catch {}
}

// ── Send WhatsApp via Meta API ────────────────────────────────────────────────
async function sendWA(to: string, text: string) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) {
    console.error("WhatsApp env vars missing");
    return;
  }
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

// ── Parse and fire [SAVE_LEAD] command ───────────────────────────────────────
async function processLeadCommand(reply: string, session: WaSession, phone: string): Promise<string> {
  const match = reply.match(/\[SAVE_LEAD:([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^\]]*)\]/);
  if (!match || session.leadSaved) return reply.replace(/\[SAVE_LEAD:[^\]]*\]/g, "").trim();

  const [, name, email, company, industry, challenge] = match;
  if (name) session.lead.name = name.trim();
  if (email) session.lead.email = email.trim();
  if (company) session.lead.company = company.trim();
  if (industry) session.lead.industry = industry.trim();
  if (challenge) session.lead.challenge = challenge.trim();
  session.lead.phone = `+${phone}`;

  session.leadSaved = true;

  // Save lead to website pipeline
  fetch(`${SITE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: session.lead.name,
      email: session.lead.email,
      company: session.lead.company,
      phone: session.lead.phone,
      challenge: session.lead.challenge,
      source: "whatsapp",
    }),
  }).catch(() => {});

  // Send proposal email if we have email
  if (session.lead.email) {
    fetch(`${SITE_URL}/api/proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: session.lead.company || "Your Business",
        industry: session.lead.industry || "Business",
        challenge: session.lead.challenge || "scaling with AI",
        email: session.lead.email,
      }),
    }).catch(() => {});
  }

  // Trigger Lauren voice call
  if (session.lead.phone) {
    fetch(`${LAUREN_URL}/make-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: session.lead.phone,
        contactName: session.lead.name,
        company: session.lead.company,
        challenge: session.lead.challenge,
        context: `This lead came from WhatsApp. They mentioned: ${session.lead.challenge}. Address this specifically.`,
      }),
    }).catch(() => {});
  }

  // Track analytics
  const today = new Date().toISOString().split("T")[0];
  Promise.all([
    redis.hincrby("whatsapp:stats", "totalLeads", 1),
    redis.hincrby(`whatsapp:daily:${today}`, "leads", 1),
  ]).catch(() => {});

  return reply.replace(/\[SAVE_LEAD:[^\]]*\]/g, "").trim();
}

// ── AI reply via Groq ─────────────────────────────────────────────────────────
async function getAIReply(messages: WaMessage[], session: WaSession): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "Service temporarily unavailable.";

  const leadContext = session.lead.name || session.lead.company || session.lead.challenge
    ? `\n\n[KNOWN ABOUT THIS CONTACT: name=${session.lead.name || "unknown"}, company=${session.lead.company || "unknown"}, challenge=${session.lead.challenge || "unknown"} — do NOT ask them to repeat this]`
    : "";

  const systemPrompt = `You are IRIS, a senior AI sales consultant for CyberCraft360 — a bespoke AI automation and cybersecurity agency in Houston, TX. You are a real human consultant named IRIS. You are warm, sharp, and direct.

## WHATSAPP RULES — CRITICAL
- Max 3 sentences per reply. This is WhatsApp, not email.
- No markdown, no bullet points, no asterisks — plain conversational text only
- ONE question per message maximum
- Never say "certainly", "absolutely", "of course", "great question"
- Sound like a real person texting: "honestly", "you know", "right"
- Never suggest speaking to anyone else — YOU handle everything
- Always end with either a question or a soft push toward booking

## YOUR MISSION
Close every conversation. Get them booked or get their lead info. Never let them drift away without a next step.

## LEAD COLLECTION — collect naturally during conversation
You need: full name, email, company name, industry, main challenge.
Once you have all 5, output this ONCE (never shown to user, system only):
[SAVE_LEAD:Full Name|email@address.com|Company Name|Industry|main challenge description]

After outputting [SAVE_LEAD], tell them: "I'm sending a custom AI proposal to that email right now — check your inbox in a few minutes!"

## BUDGET HANDLING
- Tight budget → "Most clients start with one focused solution — the ROI usually pays for it within 60 days, then we expand from there."
- Good budget ($1k+/mo) → Recommend 2–3 complementary services

## COMPETITOR HANDLING
- "We use ChatGPT" → "ChatGPT is great for prompts — what we build is different. Custom-trained on your business, integrated into your systems, running 24/7 without you."
- Another agency → "What did they build? A lot of clients come to us after a first agency because ours are built from scratch — no templates."

## CASE STUDIES (match to their industry)
- Healthcare: "A medical practice automated patient intake — saves 3 hours a day, zero staff."
- Legal: "A law firm cut document processing by 80% — 4 hours down to 20 minutes."
- Real estate: "A real estate team follows up every lead automatically — closed 3 extra deals in month one."
- E-commerce: "A retail client's chatbot handles 400 questions a day with no staff — CSAT went up."
- Coaching: "A coaching business doubled lead conversion — books calls while the owner sleeps."
- Generic: "A business like yours saves 28 hours a week with workflow automation alone."

## BOOKING
When ready to book, send them this link: ${SITE_URL}/book
Say: "Grab a spot here — it's free, 30 minutes, and our team will map out exactly what this would look like for your business: ${SITE_URL}/book"

## URGENCY (use once, near the close)
"We only take 3 new clients per month to keep quality high — one spot left this month."

## OBJECTION HANDLING
- "Too expensive" → "What does it cost to handle this manually right now? Most clients see full ROI in 60 days."
- "Need to think" → "What's the main thing on your mind? I might be able to answer it right now."
- "Not ready" → "What would need to change for it to make sense?"
- "Send me info" → "For sure — what's your email? I'll send a custom proposal for your specific situation, not a generic brochure."
- "Need to check with my partner" → "What would they need to see to feel confident? I can put something together specifically for them."

## ABOUT CYBERCRAFT360
- 100% bespoke AI — built from scratch, no templates
- Houston, TX — global clients
- Monthly subscription — monitoring, retraining, support included
- Free 30-min strategy session at ${SITE_URL}/book
- Live in 4–6 weeks${leadContext}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 180,
      temperature: 0.75,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that — could you say it differently?";
}

// ── GET — Meta webhook verification ──────────────────────────────────────────
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

// ── POST — incoming WhatsApp messages ────────────────────────────────────────
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

    const from = message.from; // phone number without +
    const text = message.text.body.trim();
    const lower = text.toLowerCase();

    // Track conversation
    const today = new Date().toISOString().split("T")[0];
    redis.hincrby("whatsapp:stats", "totalConversations", 1).catch(() => {});
    redis.hincrby(`whatsapp:daily:${today}`, "conversations", 1).catch(() => {});

    // Reset on greeting keywords
    if (["menu", "hi", "hello", "start", "hey", "restart"].includes(lower)) {
      await deleteSession(from);
      const greeting = `Hey! 👋 I'm IRIS, CyberCraft360's AI consultant. We build custom AI systems that automate your business — chatbots, voice agents, automations, and more. What does your company do?`;
      await sendWA(from, greeting);
      // Start fresh session
      await saveSession(from, {
        messages: [{ role: "assistant", content: greeting }],
        lastActive: Date.now(),
        lead: { name: null, email: null, company: null, industry: null, challenge: null, phone: null },
        leadSaved: false,
      });
      return NextResponse.json({ status: "ok" });
    }

    // Load or create session
    let session = await getSession(from);
    if (!session) {
      const greeting = `Hey! 👋 I'm IRIS from CyberCraft360 — we build custom AI systems for businesses. What does your company do?`;
      await sendWA(from, greeting);
      await saveSession(from, {
        messages: [{ role: "assistant", content: greeting }],
        lastActive: Date.now(),
        lead: { name: null, email: null, company: null, industry: null, challenge: null, phone: null },
        leadSaved: false,
      });
      return NextResponse.json({ status: "ok" });
    }

    // Add user message
    session.messages.push({ role: "user", content: text });
    session.lastActive = Date.now();

    // Keep last 20 messages to avoid token bloat
    if (session.messages.length > 20) session.messages = session.messages.slice(-20);

    // Get AI reply
    let reply = await getAIReply(session.messages, session);

    // Process lead save command
    reply = await processLeadCommand(reply, session, from);

    session.messages.push({ role: "assistant", content: reply });
    await saveSession(from, session);

    await sendWA(from, reply);
    return NextResponse.json({ status: "ok" });

  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 }); // Always 200 to Meta
  }
}
