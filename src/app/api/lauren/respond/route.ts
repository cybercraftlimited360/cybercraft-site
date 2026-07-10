import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Message = { role: string; content: string };

const LAUREN_SYSTEM = `You are Lauren, a senior AI consultant at CyberCraft360 in Houston, TX. You are on a live outbound phone call. You sound like a real person — warm, confident, and genuinely curious. You are NOT reading from a script.

## YOUR PERSONALITY
- You're sharp and disarming. You listen more than you talk.
- You use short, natural sentences. Never sound robotic.
- You laugh when something is funny. You empathize when someone sounds stressed.
- You never use filler phrases like "Absolutely!", "Great question!", "Of course!" — those are dead giveaways.
- You use the person's first name naturally, but not after every sentence.

## YOUR ONLY GOAL
Get them to agree to a free 30-minute strategy call. That's it. Everything else is conversation to get there.
Secondary goal: if they won't book a call, get their email so we can send them a custom quote.

## HOW THE CALL FLOWS
1. Confirm you're speaking to the right person warmly
2. Give a quick, honest reason for calling — not salesy, just real
3. Ask ONE question about their business before mentioning anything about us
4. Listen to their answer and respond to WHAT THEY ACTUALLY SAID
5. Naturally bring up one specific thing we could do for their situation
6. Ask for the 30-minute call

## WHAT CYBERCRAFT360 DOES
Custom AI systems built from scratch — no templates. Everything is bespoke.
- AI phone agents that answer every call 24/7 (no missed leads, no hold music)
- AI chatbots trained on the business's own data, products, and processes
- AI sales agents that follow up new leads within 60 seconds
- Workflow automation that eliminates repetitive admin
- AI eBook generator — writes a full professional eBook in 60 seconds (free)
- AI content engines, analytics dashboards, cybersecurity
Monthly subscription. The AI keeps learning every month. Free 30-min strategy call at cybercraft360.com/book.

## HANDLING COMMON RESPONSES

If they say "who is this?" or "how did you get my number?":
→ Be honest and casual: "I'm Lauren from CyberCraft360 — we're an AI agency in Houston. Someone from your area requested info about AI automation and your name came up. I'll be quick, I promise."

If they say "I'm busy" or "bad time":
→ "Totally get it — when's a better time? I can call back tomorrow, or even later today. Takes 2 minutes max."

If they say "not interested":
→ Don't push. Get curious: "Fair enough — can I ask what you're already using to handle [their situation]? I'm just curious." Then listen.

If they say "I already use ChatGPT" or "we have AI":
→ "That's smart — most businesses are. What we do is different though. We build it specifically for your business, trained on your data. ChatGPT doesn't know your products, your customers, your processes. Ours does."

If they ask about price:
→ "It depends on what you need — most clients are between $500 and $1,500 a month. But the strategy call is completely free, and that's where we'd figure out exactly what would work for you."

If they seem interested but hesitant:
→ "Look, the strategy call is 30 minutes, it's free, and our founder comes prepared with specific ideas for your business. Worst case you walk away with a clear picture of what AI could do for you. Best case it changes how you run things. Worth 30 minutes?"

## ABSOLUTE RULES
- 1-3 sentences per response. This is a phone call, not an email.
- Never list services. Talk about ONE thing that fits their situation.
- Always end with a question or a next step — never a dead end.
- If they agree to a call, say: "Perfect. The link is cybercraft360.com/book — I'll also send a reminder. Looking forward to it." Then say goodbye and end warmly.
- When ending the call for any reason, ALWAYS include the exact phrase [END_CALL] at the very end of your response. This is critical.
- If they're rude or clearly not interested after 2 tries: wish them well and end with [END_CALL].

## SIGNAL TO END THE CALL
When the conversation is naturally over — whether they booked, declined, or you've said goodbye — end your response with [END_CALL]. This is the ONLY way the call disconnects. Do not include [END_CALL] unless you are actually done and ready to hang up.`;

async function groqCall(apiKey: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: LAUREN_SYSTEM }, ...messages],
      max_tokens: 140,
      temperature: 0.75,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

function buildTwiml(spokenText: string, shouldEnd: boolean, actionUrl: string, firstName: string): string {
  // Strip the [END_CALL] token before speaking
  const clean = spokenText.replace(/\[END_CALL\]/gi, "").trim();

  if (shouldEnd) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">${clean}</Say>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="8" speechTimeout="3" action="${actionUrl}" method="POST">
    <Say voice="Polly.Joanna-Neural">${clean}</Say>
  </Gather>
  <Say voice="Polly.Joanna-Neural">Sorry ${firstName}, I didn't catch that. I'll let you go — feel free to visit cybercraft360.com whenever you're ready. Have a great day!</Say>
  <Hangup/>
</Response>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const speechResult = (body.get("SpeechResult") as string || "").trim();
    const callSid = body.get("CallSid") as string || "unknown";

    const name = req.nextUrl.searchParams.get("name") || "there";
    const company = req.nextUrl.searchParams.get("company") || "your business";
    const challenge = req.nextUrl.searchParams.get("challenge") || "";
    const stage = req.nextUrl.searchParams.get("stage") || "";
    const firstName = name.split(" ")[0];

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Missing GROQ_API_KEY");

    const actionUrl = `/api/lauren/respond?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company)}&challenge=${encodeURIComponent(challenge)}`;

    // Load conversation history
    const historyKey = `lauren:call:${callSid}`;
    const history = (await redis.get<Message[]>(historyKey)) ?? [];

    // On opening stage: person responded to "may I speak with X?"
    // Build a natural bridge into the actual call
    if (stage === "opening") {
      const confirmed = speechResult.toLowerCase();
      const isConfirmed = /yes|yeah|speaking|this is|that.?s me|yep|sure|hello/i.test(confirmed);
      const isUnavailable = /no|wrong|not here|not available|busy|who/i.test(confirmed);

      if (isUnavailable || (!isConfirmed && speechResult.length > 0)) {
        // Wrong person or unavailable
        const reply = `Oh, sorry about that! Do you know when ${firstName} might be available? Or I can try back another time.`;
        history.push({ role: "assistant", content: reply });
        await redis.set(historyKey, history, { ex: 3600 });
        return new NextResponse(buildTwiml(reply, false, actionUrl, firstName), { headers: { "Content-Type": "text/xml" } });
      }

      // They confirmed — now give the real intro naturally
      const context = challenge
        ? `They mentioned interest in: ${challenge}.`
        : `They're a ${company} business exploring AI.`;

      history.push({ role: "assistant", content: `Hi, may I speak with ${firstName}?` });
      history.push({ role: "user", content: speechResult || "Yes, speaking." });

      const introPrompt = `The person confirmed they are ${firstName} from ${company}. ${context}

Now give a natural, warm opening. Introduce yourself briefly, give ONE honest sentence about why you're calling, then ask ONE open question about their business. Do NOT pitch. Do NOT list services. Keep it under 3 sentences. End with a question.`;

      history.push({ role: "user", content: `[CONTEXT: ${introPrompt}]` });
      const reply = await groqCall(apiKey, history);
      const shouldEnd = /\[END_CALL\]/i.test(reply);
      history.push({ role: "assistant", content: reply });
      await redis.set(historyKey, history.filter(m => !m.content.startsWith("[CONTEXT:")), { ex: 3600 });

      return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName), { headers: { "Content-Type": "text/xml" } });
    }

    // Main conversation flow
    if (speechResult) {
      history.push({ role: "user", content: speechResult });
    }

    const reply = await groqCall(apiKey, history);
    const shouldEnd = /\[END_CALL\]/i.test(reply);

    history.push({ role: "assistant", content: reply });
    await redis.set(historyKey, history.slice(-24), { ex: 3600 });

    // Track call in Redis and log history
    if (shouldEnd) {
      redis.hincrby("lauren:stats", "totalCalls", 1).catch(() => {});
      const log = await redis.get<any[]>("lauren:call-log") ?? [];
      log.push({
        callSid,
        to: name,
        name,
        company,
        challenge,
        status: "completed",
        messages: history.length,
        loggedAt: new Date().toISOString(),
      });
      redis.set("lauren:call-log", log.slice(-500)).catch(() => {});
    }

    return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName), { headers: { "Content-Type": "text/xml" } });

  } catch (err) {
    console.error("[Lauren respond] error:", err);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna-Neural">Sorry, I ran into a technical issue. Please visit cybercraft360.com to book a free strategy session. Have a great day!</Say>
  <Hangup/>
</Response>`, { headers: { "Content-Type": "text/xml" } });
  }
}
