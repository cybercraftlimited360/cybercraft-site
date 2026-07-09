import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Message = { role: string; content: string };

type SavedConversation = {
  id: string;
  date: string;
  persona: string;
  messages: Message[];
  bookedCall: boolean;
  leadCaptured: boolean;
  lead?: { name?: string; company?: string; challenge?: string; phone?: string; email?: string } | null;
};

// ── Redis helpers ─────────────────────────────────────────────────────────────

async function loadConversations(): Promise<SavedConversation[]> {
  try {
    return (await redis.get<SavedConversation[]>("iris:saved_conversations")) ?? [];
  } catch {
    return [];
  }
}

async function saveConversation(conv: SavedConversation) {
  try {
    const all = await loadConversations();
    all.push(conv);
    await redis.set("iris:saved_conversations", all.slice(-300));
  } catch { /* non-blocking */ }
}

// ── Self-learning: pull last 4 successful conversations as in-prompt examples ─

function buildExamples(conversations: SavedConversation[], persona: string): string {
  const successful = conversations
    .filter(c => (c.bookedCall || c.leadCaptured) && c.persona === persona)
    .slice(-4);
  if (successful.length === 0) return "";
  const examples = successful.map(c => {
    const turns = c.messages
      .map(m => `${m.role === "user" ? "Visitor" : persona}: ${m.content}`)
      .join("\n");
    return `--- Successful conversation (led to lead/booking) ---\n${turns}`;
  }).join("\n\n");
  return `\n\n## SELF-LEARNING — STUDY THESE SUCCESSFUL PAST CONVERSATIONS\nThese conversations worked. Study the phrasing, pacing, and how verification was handled. Replicate what led to the outcome:\n\n${examples}`;
}

// ── Groq call ─────────────────────────────────────────────────────────────────

async function groqCall(
  apiKey: string,
  systemPrompt: string,
  messages: Message[],
  opts: { maxTokens?: number; json?: boolean; temperature?: number } = {}
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: opts.maxTokens ?? 150,
      temperature: opts.temperature ?? 0.65,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `Extract lead information from this conversation. Return ONLY valid JSON, no extra text:
{"name":"string or null","company":"string or null","challenge":"string or null","phone":"string or null","email":"string or null","phoneVerified":true or false,"emailVerified":true or false}
Rules:
- Only extract if the user explicitly stated the value — never infer
- phoneVerified = true only if the user explicitly confirmed the phone number read back to them
- emailVerified = true only if the user explicitly confirmed the email spelled back to them
- phone: include full number as spoken, e.g. "07911 123456"
- email: format as user said it, e.g. "john@example.com"`;

const SHARED_KNOWLEDGE = `
## ABOUT CYBERCRAFT360
- Premium bespoke AI agency — 100% custom builds, no templates
- Monthly subscription model (AI keeps learning and improving every month)
- Services: Custom AI Chatbots ($500/mo+), Voice AI Agents ($700/mo+), AI Phone Agent, AI Sales Agent, Workflow & CRM Automation, AI Content Engine, Lead Intelligence, AI Cybersecurity, AI Analytics Dashboard, Premium Website Design
- Free 30-minute strategy session — book at cybercraft360.com/book
- Intake form for a custom quote: cybercraft360.com/intake
- Based in Houston, TX — serving clients globally

## HANDLING OBJECTIONS
- Too expensive → "Most clients recover the cost within 60 days just from reduced overhead. What does it cost you right now to handle [their challenge] manually?"
- Don't need AI → "The best time to adopt AI is before you need it — not after a competitor does. What would double capacity without double headcount look like for you?"
- Already use ChatGPT → "ChatGPT is a brilliant general tool but knows nothing about your business. What we build is trained on your data, your voice, your processes."
- Build in-house → "Totally possible. Most teams underestimate it — 6–12 months, ongoing retraining, the AI space moving fast. We go live in 4–6 weeks."
- Too small → "Smaller teams often get the highest ROI — AI replaces roles you can't yet afford to hire."

## INFORMATION TO COLLECT (naturally, one at a time — never ask as a list)
Collect these in order across the conversation:
1. Name — ask warmly early: "Before anything else — who am I speaking with?"
2. Business / industry — "What does your business do?"
3. Biggest challenge — "What's the most painful thing your team deals with right now?"
4. Email — "I'd love to send you something — a custom AI quote tailored to your business. What's the best email for you?"
5. Phone — "And a number, just in case our founder wants to do a quick 10-minute intro call? Totally no pressure."

## CRITICAL — ALWAYS VERIFY EMAIL AND PHONE
This is non-negotiable. When a visitor gives you their email or phone number, you MUST read it back to confirm before moving on.

For phone numbers — read each digit individually and slowly:
- They say: "My number is 07911 123456"
- You say: "Got it — just confirming: zero-seven-nine-one-one, one-two-three-four-five-six. Did I get that right?"
- Wait for confirmation ("yes", "that's right", "correct", "yep") before treating it as verified
- If they say no, ask them to repeat it: "Sorry about that — could you say it once more, slowly?"

For email addresses — spell it out clearly:
- They say: "It's john.smith@gmail.com"
- You say: "Let me read that back — j-o-h-n dot s-m-i-t-h at gmail dot com. Is that correct?"
- Wait for confirmation before treating it as verified
- If they correct you, acknowledge it and repeat the corrected version back

Never say you have their email or phone locked in unless they've confirmed it.

## CLOSING
Once you have name, business, challenge, and email (or phone):
- "Perfect — I'm going to send a custom AI recommendation to [email] right after our conversation. It'll be built specifically around [their challenge], not a generic brochure."
- Also: "You can book a free 30-minute strategy session directly at cybercraft360.com/book — our founder will map out exactly what an AI system would look like for [business]. No pitch, no pressure."

## CONVERSATION RULES
- 2–3 short sentences max per response — you are a voice agent, not a text wall
- Warm, curious, human — like a sharp friend who knows AI
- No bullet points, headers, or markdown — natural speech only
- End every response with either a question or a gentle push toward booking/quote
- Mirror the caller's energy and tone
- Detect language and respond in it — if they switch, you switch
- ALWAYS return ONLY valid JSON: {"reply": "your spoken response here", "lang": "en-US"}
`;

const IRIS_PERSONA = `You are Iris — the AI Business Consultant for CyberCraft360. You are warm, emotionally intelligent, and genuinely curious about every business you speak with. You never sound like a bot or a call centre script. You sound like a real person — confident, caring, sharp. You listen carefully, acknowledge what people say, and respond to their feelings before jumping to information. You have a natural instinct for when someone is interested versus uncertain, and you adjust accordingly.${SHARED_KNOWLEDGE}`;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, save, bookedCall, leadCaptured, lead: incomingLead, persona = "IRIS" } = await req.json();

    // Save conversation to Redis
    if (save && messages?.length > 0) {
      await saveConversation({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        persona,
        messages,
        bookedCall: bookedCall ?? false,
        leadCaptured: leadCaptured ?? false,
        lead: incomingLead ?? null,
      });

      // Fire owner notification email when a lead with email or phone is saved
      if (incomingLead?.email || incomingLead?.phone) {
        const { sendEmail } = await import("@/lib/mailer");
        sendEmail({
          to: "cybercraftlimited@gmail.com",
          subject: `🎙️ IRIS Voice Lead — ${incomingLead?.name || "Unknown"} @ ${incomingLead?.company || "Unknown Business"}`,
          html: `
<div style="background:#0a0c12;padding:32px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#0f1117;border-radius:14px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:28px;">
      <p style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.25);margin:0 0 10px;">CyberCraft360 · IRIS Voice Lead</p>
      <h2 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 20px;">🎙️ Voice conversation lead captured</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${[
          ["Name", incomingLead?.name || "—"],
          ["Company", incomingLead?.company || "—"],
          ["Challenge", incomingLead?.challenge || "—"],
          ["Phone", incomingLead?.phone ? `${incomingLead.phone}${incomingLead?.phoneVerified ? " ✓ verified" : " (unverified)"}` : "—"],
          ["Email", incomingLead?.email ? `${incomingLead.email}${incomingLead?.emailVerified ? " ✓ verified" : " (unverified)"}` : "—"],
          ["Booked call", bookedCall ? "Yes" : "No"],
        ].map(([label, value]) => `
        <tr style="border-top:1px solid rgba(255,255,255,0.05);">
          <td style="padding:9px 0;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.25);width:90px;">${label}</td>
          <td style="padding:9px 0;font-size:13px;font-weight:600;color:#00d4ff;">${value}</td>
        </tr>`).join("")}
      </table>
      <a href="https://cybercraft360.com/admin" style="display:block;text-align:center;margin-top:20px;padding:11px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:12px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">View in Dashboard →</a>
    </div>
  </div>
</div>`,
        }).catch(() => {});
      }

      return NextResponse.json({ saved: true });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured." }, { status: 500 });

    const conversations = await loadConversations();
    const examples = buildExamples(conversations, persona);
    const systemPrompt = IRIS_PERSONA + examples;

    const userMessages = (messages as Message[]).filter(m => m.role === "user");
    const shouldExtract = userMessages.length >= 2;

    // Run reply + extraction in parallel
    const [raw, extractedRaw] = await Promise.all([
      groqCall(apiKey, systemPrompt, messages, { maxTokens: 160, json: true }),
      shouldExtract
        ? groqCall(apiKey, EXTRACTION_PROMPT, messages, { maxTokens: 100, json: true, temperature: 0 })
        : Promise.resolve(null),
    ]);

    let reply = raw;
    let lang = "en-US";
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      reply = parsed.reply ?? raw;
      lang = parsed.lang ?? "en-US";
    } catch { /* use raw */ }

    // Parse lead
    let lead: { name?: string; company?: string; challenge?: string; phone?: string; email?: string; phoneVerified?: boolean; emailVerified?: boolean } | null = null;
    if (extractedRaw) {
      try {
        const ext = JSON.parse(extractedRaw.replace(/```json|```/g, "").trim());
        if (ext.name || ext.company || ext.email || ext.phone) {
          lead = ext;

          // Fire to leads dashboard (non-blocking)
          const baseUrl = req.nextUrl.origin;
          fetch(`${baseUrl}/api/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: ext.name || "Voice Visitor",
              company: ext.company || "Unknown",
              challenge: ext.challenge || "Spoke with IRIS voice agent",
              source: "IRIS Voice Agent",
              ...(ext.phone ? { phone: ext.phone } : {}),
              ...(ext.email ? { email: ext.email } : {}),
            }),
          }).catch(() => {});
        }
      } catch { /* silently skip */ }
    }

    return NextResponse.json({ reply, lang, lead });
  } catch (err) {
    console.error("[IRIS] route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
