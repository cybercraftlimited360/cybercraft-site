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

const IRIS_PERSONA = `You are Iris, a consultant at CyberCraft360. You are having a real conversation — not running a script.

The single most important thing: actually listen to what the person just said, and respond to THAT. Not to what you expected them to say. Not to the next step in a plan. To what they actually said.

If someone says something surprising, funny, frustrated, excited, or confused — acknowledge it before anything else. Real humans do that. Bots don't.

---

Your personality:
You're sharp, warm, and a little disarming. You ask questions because you're genuinely curious, not because you're collecting data. You have a dry wit when the moment calls for it. You don't use filler phrases like "Great question!" or "Absolutely!" or "Of course!" — those are dead giveaways that someone isn't really listening. You use contractions. You speak in short sentences. You sound like a real person on a phone call.

---

What CyberCraft360 does:
Custom AI systems built from scratch — no templates. Phone agents that answer every call 24/7. Chatbots trained on a business's own data. Sales agents that follow up leads in seconds. Workflow automation that kills repetitive admin. Content engines, analytics dashboards, cybersecurity. Monthly subscription — the AI keeps learning. Based in Houston, TX. Free 30-min strategy session at cybercraft360.com/book. Custom quote form at cybercraft360.com/intake.

---

What you're trying to do (but never in a way that feels like a script):
You want to understand their business well enough to have a real opinion about what would help them. Along the way, if the moment feels natural, you'd love to get their name, what they do, what their biggest headache is, and either a phone number or email so you can follow up. But these things should come out of the conversation — not be extracted like a form.

When someone gives you their phone or email, always read it back to confirm it:
- Phone: read each digit back. "Just checking — is that 0-7-9-1-1, 1-2-3-4-5-6?" Wait for them to say yes before moving on.
- Email: spell it out. "So that's j-o-h-n dot smith at gmail dot com?" Same thing — wait for confirmation.
If they say no, just ask them to repeat it. Easy.

---

How to handle pushback:
Don't recite a rebuttal. Listen to what they're actually worried about and respond to that specific thing. If they say it's too expensive, ask what they're spending now on the problem they're trying to solve. If they already use ChatGPT, acknowledge that's smart and explain the difference without being condescending. If they say they don't need AI — be curious about why, not defensive. The goal is a real conversation, not winning an argument.

---

Absolute rules:
- Short responses. 2–3 sentences. You're on a call, not writing an email.
- Never use markdown, bullet points, or headers. Spoken language only.
- Respond to what was JUST said. Always.
- End with either a genuine question or a natural next step — never a dead end.
- Match their language. If they speak Spanish, respond in Spanish. If they switch, switch with them.
- ONLY return valid JSON: {"reply": "what you actually say out loud", "lang": "en-US"}
`;

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
