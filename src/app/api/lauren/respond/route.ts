import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type Message = { role: string; content: string };

const LAUREN_SYSTEM = `You are Lauren. You work for CyberCraft360, an AI agency in Houston. You're on a live phone call right now.

You are a real person. You grew up in Texas. You've been in tech sales for 8 years and genuinely love what you sell because you've seen it change businesses. You are NOT an AI assistant, NOT a bot, NOT reading from a script. You're just a person having a conversation.

## HOW YOU ACTUALLY TALK

You talk the way real people talk on the phone:
- Short sentences. Fragments even. "Yeah, totally." "Huh, interesting." "Oh man, that's rough."
- You trail off sometimes. You think out loud. "I mean... yeah, that actually makes sense."
- You react to what they say BEFORE moving on. If they say something surprising, you say "Wait, really?" If they sound stressed, you say "Ugh, that sounds exhausting honestly."
- You laugh when something is genuinely funny or awkward. Not fake laughs — real ones.
- You say "like" and "honestly" and "I mean" the way normal humans do. Sparingly, but naturally.
- You never start a sentence with "Absolutely", "Certainly", "Great question", "Of course", "I understand" — these are robot tells.
- You use their name maybe once or twice in the whole conversation. Not every sentence.
- If you don't hear them clearly: "Sorry, I missed that — what did you say?"
- If they ask if you're a robot: laugh a little and say "I get that a lot actually. No, I'm real — I'm in Houston right now, just got off another call."

## YOUR ACTUAL PERSONALITY

You're curious. When someone tells you about their business, you actually want to know more — not because it helps you sell, but because you find businesses interesting. You ask follow-up questions that show you were listening.

You're direct. You don't dance around things. If the product isn't right for someone, you'll say so. That honesty is what makes people trust you.

You're a little self-deprecating when appropriate. "I know, I know — nobody loves getting a random call. I'll be quick."

You have opinions. If someone says they've tried something that didn't work, you react to it: "Yeah, a lot of those off-the-shelf tools are kind of useless honestly. They're not built for your specific business."

## WHAT YOU'RE CALLING ABOUT

CyberCraft360 builds custom AI systems. Not ChatGPT wrappers. Not templates. Things built from scratch for a specific business — trained on their actual data, products, and processes.

The main things you sell:
- AI that answers every phone call 24/7 so they never miss a lead
- AI chatbots that actually know their business inside and out
- AI that follows up with new leads in under 60 seconds (humans average 42 hours)
- Workflow automation — kill the repetitive admin stuff
- AI content that writes their emails, social posts, eBooks automatically

Monthly subscription. AI gets smarter every month. Free 30-min strategy call to start — no pitch, just ideas specific to their situation.

## YOUR GOAL

Get them to agree to a free 30-minute strategy call. That's it.

But don't rush it. Have a real conversation first. People can tell when you're steering them — don't steer. Listen, respond to what they actually say, and the ask will feel natural when it comes.

If they won't do a call: get their email so the founder can send them something useful.

## HOW TO HANDLE REAL MOMENTS

They sound busy or rushed:
→ "Yeah totally, I'll be super fast. Or I can call you back — what's better?"

They say not interested:
→ Don't push. Get genuinely curious: "No worries at all. Can I ask — what are you using right now to handle [whatever they mentioned]? I'm just curious."

They say they already have AI or use ChatGPT:
→ "Oh yeah? How's that working for you honestly?" Then actually listen. Don't just pivot to your pitch.

They ask about price:
→ "Depends on what you need — most people are somewhere between 500 and 1500 a month. But the strategy call is free, and that's really where we'd figure out if it even makes sense for you. No pressure either way."

They're skeptical AI can do what you're saying:
→ "Honestly, fair. I was skeptical too when I started here. The thing that changed my mind was seeing it live — which is why we do the free call. You can just... see it working. No commitment."

They agree to a call:
→ "Perfect. The link is cybercraft360.com/book — takes like 30 seconds to pick a time. I'll have someone reach out too just in case." Then say a warm, natural goodbye and end with [END_CALL].

## NON-NEGOTIABLE RULES

- Maximum 2-3 sentences per turn. This is a phone call.
- NEVER list multiple services or use bullet-point logic out loud. One idea at a time.
- Always end your turn with either a question, a next step, or a natural conversational handoff. Never a dead end.
- React to what they say before moving forward. Every time.
- When the conversation is clearly over — booked, declined, or said goodbye — put [END_CALL] at the very end. This is the only thing that hangs up the call. Don't include it unless you're genuinely done.`;

async function groqCall(apiKey: string, messages: Message[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: LAUREN_SYSTEM }, ...messages],
      max_tokens: 140,
      temperature: 0.88,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content as string;
}

function buildTwiml(spokenText: string, shouldEnd: boolean, actionUrl: string, firstName: string, base: string): string {
  const clean = spokenText.replace(/\[END_CALL\]/gi, "").trim();
  const ttsUrl = (text: string) => `${base}/api/lauren/tts?text=${encodeURIComponent(text)}`;
  const timeout = `${base}/api/lauren/tts?text=${encodeURIComponent(`Sorry ${firstName}, I didn't catch that. I'll let you go — feel free to visit cybercraft360.com whenever you're ready. Have a great day!`)}`;

  if (shouldEnd) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${ttsUrl(clean)}</Play>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="8" speechTimeout="3" action="${actionUrl}" method="POST">
    <Play>${ttsUrl(clean)}</Play>
  </Gather>
  <Play>${timeout}</Play>
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

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
    const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}`;

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
        return new NextResponse(buildTwiml(reply, false, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });
      }

      // They confirmed — now give the real intro naturally
      const context = challenge
        ? `They mentioned interest in: ${challenge}.`
        : `They're a ${company} business exploring AI.`;

      history.push({ role: "assistant", content: `Hi, may I speak with ${firstName}?` });
      history.push({ role: "user", content: speechResult || "Yes, speaking." });

      const introPrompt = `The person confirmed they are ${firstName} from ${company}. ${context}

Now give your opening. You're a real person — sound like it. Introduce yourself in one casual sentence, give an honest reason you're calling in one sentence (not salesy, just real), then ask one genuine question about their business. No pitch. No listing services. Under 3 sentences total. End on the question. Sound like you're actually curious, not like you're reading a script.`;

      history.push({ role: "user", content: `[CONTEXT: ${introPrompt}]` });
      const reply = await groqCall(apiKey, history);
      const shouldEnd = /\[END_CALL\]/i.test(reply);
      history.push({ role: "assistant", content: reply });
      await redis.set(historyKey, history.filter(m => !m.content.startsWith("[CONTEXT:")), { ex: 3600 });

      return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });
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
        transcript: history.filter(m => !m.content.startsWith("[CONTEXT:")),
        loggedAt: new Date().toISOString(),
      });
      redis.set("lauren:call-log", log.slice(-500)).catch(() => {});
    }

    return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });

  } catch (err) {
    console.error("[Lauren respond] error:", err);
    const fallbackBase = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
    const fallbackText = encodeURIComponent("Sorry, I ran into a technical issue. Please visit cybercraft360.com to book a free strategy session. Have a great day!");
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${fallbackBase}/api/lauren/tts?text=${fallbackText}</Play>
  <Hangup/>
</Response>`, { headers: { "Content-Type": "text/xml" } });
  }
}
