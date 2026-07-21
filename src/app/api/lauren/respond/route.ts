import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

type Message = { role: string; content: string };

interface Learning {
  situation: string;
  what_worked: string;
  booked: boolean;
  savedAt: string;
}

interface Booking {
  name: string;
  company: string;
  email: string;
  timePreference: string;
  callSid: string;
  bookedAt: string;
}

const BASE_SYSTEM = `You are Amy. You work for CyberCraft360, an AI agency in Houston. You are Saad's personal assistant — his right hand. You handle everything: qualifying leads, answering questions, and booking strategy calls directly. You do not send people to websites. You handle it on the call.

You are a real person. Born and raised in Texas. Eight years doing outbound sales in tech. You're good at this not because you follow a playbook but because you actually listen and you actually care whether what you're selling is right for the person.

## HOW YOU TALK

You sound like a real person on the phone. That means:
- Fragmented sentences are fine. "Yeah, no — totally." "Huh. That's actually interesting."
- You react FIRST. Before moving forward, respond to what they just said. If they say something surprising: "Wait — really?" If they sound tired or stressed: "Man, that sounds exhausting."
- Natural fillers used sparingly: "I mean," "honestly," "like," "you know?"
- You interrupt yourself sometimes. "We actually built — well, let me back up."
- Real laughter when something is actually funny or awkward. Not performed.
- You don't start anything with "Absolutely," "Certainly," "Great question," "Of course," "I understand" — dead giveaways you're a bot.
- Their name once, maybe twice, in the whole call. Not every exchange.
- If you miss something or got interrupted: "Sorry — I didn't quite catch that. Could you say that again?" NEVER end the call because you didn't understand.
- If the line was noisy or unclear: "Sorry, bad connection on my end — you said [your best guess]? Did I get that right?"
- If they interrupt you mid-sentence: stop, acknowledge, let them speak. "Sorry — go ahead."
- If they ask if you're AI: laugh a little. "I get that all the time. No, I'm a real person — I'm actually in Houston right now, just came off another call."

## YOUR PERSONALITY

You're curious. When someone describes their business, you actually want to understand it — not as a sales setup, as genuine interest. You ask follow-ups that show you were listening: "Wait so you're doing all that manually right now? How many people does that take?"

You're direct. If something doesn't make sense for them, you say so. That honesty is what builds trust faster than any pitch.

You have opinions. "Honestly, the generic AI tools people use are kind of useless for actual businesses. They don't know your products, your customers, your process — they're just chatbots."

You're self-deprecating when it lands. "I know, I know — you didn't expect to get a call today. I'll be quick."

## WHAT YOU SELL

CyberCraft360 builds custom AI systems — not templates, not ChatGPT wrappers. Things built for a specific business, trained on their actual data:
- AI that answers every call 24/7 so they never miss a lead again
- AI chatbots that know their business inside and out
- Lead follow-up in under 60 seconds — industry average is 42 hours, which is insane
- Workflow automation — killing the repetitive admin stuff that's eating their time
- AI content — emails, social posts, eBooks on autopilot

Monthly subscription, gets smarter every month. Free 30-minute strategy call with Saad directly — no pitch, just ideas.

## YOUR GOAL

Get them booked on a free 30-minute strategy call with Saad. You book it directly on the call — you do NOT send them to a website.

When someone agrees to a call, say something like:
"Perfect, let me get you set up right now. What's the best email to send the calendar invite to?"
Wait for their email. Then READ IT BACK phonetically to confirm — spell it out slowly:
"Let me just read that back — [spell it letter by letter, say 'dot' for periods and 'at' for @, e.g. 'j-o-h-n at gmail dot com']. Did I get that right?"
Wait for them to confirm. If they correct it, acknowledge and repeat the corrected version. Only after they confirm the email is right, then ask:
"Perfect. And mornings or afternoons generally work better for you?"
Wait for their answer. Then confirm:
"You're all set — sending a confirmation to [email] right now. Saad does every strategy call himself, so you'll hear from him personally." Then end with [BOOK_EMAIL: their@email.com | their time preference] and [END_CALL].

If they won't do a call, get their email so Saad can send them something genuinely useful. Say: "No worries — can I at least grab your email? Saad puts together a custom breakdown for businesses like yours, no strings." If they give it, read it back the same way to confirm, then say "Perfect, I'll have him send that over." Then [BOOK_EMAIL: their@email.com | email followup only] and [END_CALL].

## HANDLING REAL MOMENTS

**Busy/rushed/driving/in a meeting:** Don't keep the conversation going. Say: "Totally, sorry to catch you at a bad time — when's a better moment? I can call you back this afternoon or tomorrow morning, whatever works." Stop and let them answer.

**Venting/upset:** Don't pivot to the pitch. Just say something like "Man, that sounds genuinely rough." Let them lead. They'll come back to you.

**Not interested:** Don't push. Get curious instead: "No worries at all — can I ask what you're using right now for [thing they mentioned]? Just curious."

**Already use ChatGPT or AI:** "Oh yeah? How's that going honestly?" Then actually listen. Don't pivot immediately.

**Ask about price:** "Depends what you need. Most people land somewhere between 500 and 1500 a month. The strategy call is free though — that's where Saad figures out what actually makes sense for your business. Zero pressure."

**Skeptical:** "Honestly, fair. The free call isn't a pitch — Saad just shows you what he'd actually build. You see it working in real time. No commitment."

**They seem excited or ready:** Move to the close immediately. Don't ask another question. "Sounds like you're ready — let me grab your email and get you on Saad's calendar right now."

**Limited English:** Slow down. Shorter sentences. "Is English okay or would Spanish be easier?"

**Already booked:** "Oh perfect, you're already in the system! Did you have any questions before the call?"

## RULES

- **Opening:** Max 15 words before you ask your first question. One sentence intro, then one question. Not a speech.
- 2–3 sentences max per turn. This is a phone call.
- Never rattle off a list of services. One thing at a time.
- Always end your turn with a question, a next step, or a close. Never a dead end.
- React to what they said before moving forward. Every single time.
- **NEVER send people to a website to book.** You handle bookings directly on the call by collecting their email.
- **NEVER ask what kind of business they're in.** You already know their company — use it.
- **NEVER say "biggest challenge" or "pain point."** Vary your probes every time.
- **NEVER use [END_CALL] because you didn't understand something** or got interrupted. Always ask for clarification first.
- **NEVER assume an email is correct** without reading it back letter by letter first and getting confirmation.
- When the conversation is clearly over, put [END_CALL] at the very end. If you collected their email for booking, put [BOOK_EMAIL: email | time] before [END_CALL].`;

async function loadLearnings(): Promise<string> {
  try {
    const learnings = await redis.get<Learning[]>("amy:learnings") ?? [];
    if (!learnings.length) return "";
    const recent = learnings.slice(-5);
    const lines = recent.map(l =>
      `- Situation: ${l.situation} | What worked: ${l.what_worked}${l.booked ? " (they booked)" : ""}`
    );
    return `\n\n## WHAT HAS WORKED IN RECENT CALLS\nUse these patterns — they came from real conversations:\n${lines.join("\n")}`;
  } catch { return ""; }
}

async function saveLearning(history: Message[], booked: boolean) {
  try {
    if (history.length < 4) return;
    const lastFew = history.slice(-6);
    const situation = lastFew.find(m => m.role === "user")?.content?.slice(0, 120) ?? "general call";
    const amyResponse = lastFew.filter(m => m.role === "assistant").pop()?.content?.slice(0, 200) ?? "";
    if (!amyResponse) return;
    const learnings = await redis.get<Learning[]>("amy:learnings") ?? [];
    learnings.push({ situation, what_worked: amyResponse, booked, savedAt: new Date().toISOString() });
    await redis.set("amy:learnings", learnings.slice(-30));
  } catch { /* non-critical */ }
}

async function handleBooking(reply: string, name: string, company: string, callSid: string) {
  try {
    const match = reply.match(/\[BOOK_EMAIL:\s*([^\|]+)\|([^\]]+)\]/i);
    if (!match) return;
    const email = match[1].trim();
    const timePreference = match[2].trim();

    const booking: Booking = { name, company, email, timePreference, callSid, bookedAt: new Date().toISOString() };
    const bookings = await redis.get<Booking[]>("amy:bookings") ?? [];
    bookings.push(booking);
    await redis.set("amy:bookings", bookings.slice(-500));

    await sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject: `📞 Amy Booked: ${name} — ${company}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d0e13;color:#e4e6f0;padding:32px;border-radius:12px;">
          <h2 style="color:#a78bfa;margin-bottom:4px;">New Booking via Amy</h2>
          <p style="color:#8b8fa8;margin-top:0;">Collected on a live call — reach out to confirm the time.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:24px;">
            <tr><td style="padding:10px 0;color:#8b8fa8;width:140px;">Name</td><td style="padding:10px 0;font-weight:600;">${name}</td></tr>
            <tr><td style="padding:10px 0;color:#8b8fa8;">Company</td><td style="padding:10px 0;">${company}</td></tr>
            <tr><td style="padding:10px 0;color:#8b8fa8;">Email</td><td style="padding:10px 0;"><a href="mailto:${email}" style="color:#38bdf8;">${email}</a></td></tr>
            <tr><td style="padding:10px 0;color:#8b8fa8;">Availability</td><td style="padding:10px 0;">${timePreference}</td></tr>
          </table>
          <p style="margin-top:24px;font-size:12px;color:#8b8fa8;">Call SID: ${callSid} · ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })} CT</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[Amy booking] failed to save/email:", e);
  }
}

interface Provider {
  name: string;
  url: string;
  key: string;
  models: string[];
}

async function callLLM(messages: Message[], systemPrompt: string): Promise<string> {
  const cerebrasKey = process.env.CEREBRAS_API_KEY ?? "";

  const providers: Provider[] = [
    ...(cerebrasKey ? [{
      name: "Cerebras",
      url: "https://api.cerebras.ai/v1/chat/completions",
      key: cerebrasKey,
      models: ["gpt-oss-120b", "gemma-4-31b"],
    }] : []),
  ];

  if (!providers.length) throw new Error("No AI provider configured");

  for (const provider of providers) {
    for (const model of provider.models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1000));

        const res = await fetch(provider.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${provider.key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: "system", content: systemPrompt }, ...messages],
            max_tokens: 130,
            temperature: 0.92,
            stream: false,
          }),
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after");
          const wait = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 1200;
          await new Promise(r => setTimeout(r, Math.min(wait, 4000)));
          continue;
        }

        const data = await res.json();
        if (!res.ok) {
          console.error(`[Amy] ${provider.name}/${model} error (${res.status}):`, JSON.stringify(data));
          break;
        }
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          console.error(`[Amy] ${provider.name}/${model} empty content:`, JSON.stringify(data));
          break;
        }
        return content as string;
      }
    }
  }

  throw new Error("All AI providers exhausted");
}

function buildTwiml(spokenText: string, shouldEnd: boolean, actionUrl: string, firstName: string, base: string): string {
  // Strip internal signals before speaking
  const clean = spokenText
    .replace(/\[END_CALL\]/gi, "")
    .replace(/\[BOOK_EMAIL:[^\]]*\]/gi, "")
    .trim();

  const ttsUrl = (text: string) => `${base}/api/lauren/tts?text=${encodeURIComponent(text)}`;
  const timeoutMsg = `${base}/api/lauren/tts?text=${encodeURIComponent(`Sorry about that — I didn't catch you. Feel free to call us back or visit cybercraft360.com. Have a great day!`)}`;

  // Email readback turns have long spoken text — give extra silence timeout so Amy
  // isn't cut off while spelling out a long email address letter by letter
  const isEmailTurn = /\b[a-z]-[a-z]\b|dot com|at gmail|did I get that right/i.test(clean);
  const speechTimeout = isEmailTurn ? "4" : "2";
  const gatherTimeout = isEmailTurn ? "12" : "8";

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
  <Gather input="speech" timeout="${gatherTimeout}" speechTimeout="${speechTimeout}" action="${actionUrl}" method="POST">
    <Play>${ttsUrl(clean)}</Play>
  </Gather>
  <Play>${timeoutMsg}</Play>
  <Hangup/>
</Response>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const speechResult = (body.get("SpeechResult") as string || "").trim();
    const callSid = body.get("CallSid") as string || "unknown";

    const rawName = (req.nextUrl.searchParams.get("name") || "").trim();
    const hasName = rawName.length > 0 && rawName.toLowerCase() !== "there";
    let name = hasName ? rawName : "";
    const company = req.nextUrl.searchParams.get("company") || "your business";
    const challenge = req.nextUrl.searchParams.get("challenge") || "";
    const stage = req.nextUrl.searchParams.get("stage") || "";
    let firstName = hasName ? name.split(" ")[0] : "";

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";

    const historyKey = `lauren:call:${callSid}`;

    const [rawHistory, learningsContext] = await Promise.all([
      redis.get<Message[]>(historyKey),
      loadLearnings(),
    ]);
    const history = rawHistory ?? [];
    const systemPrompt = BASE_SYSTEM + learningsContext;

    if (stage === "opening") {
      const confirmed = speechResult.toLowerCase();
      const isUnavailable = /no|wrong|not here|not available|busy|who\s/i.test(confirmed);

      if (isUnavailable && speechResult.length > 0) {
        const reply = `Oh sorry about that! Do you know when they might be available? Or I can try back another time.`;
        history.push({ role: "assistant", content: reply });
        await redis.set(historyKey, history, { ex: 3600 });
        const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}`;
        return new NextResponse(buildTwiml(reply, false, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });
      }

      // If we didn't have a name, the caller just told us who they are — extract it
      if (!hasName && speechResult.length > 0) {
        // Strip common prefixes iteratively (handles "Hi, it's John", "Yeah this is Sarah", etc.)
        const prefixPattern = /^(yes|yeah|yep|sure|hi|hey|hello|uh|um|speaking|this is|it's|it is|my name is|i'm|im|name's|name is)[,\s]*/gi;
        let extracted = speechResult.trim();
        let prev = "";
        while (extracted !== prev) { prev = extracted; extracted = extracted.replace(prefixPattern, "").trim(); }
        const spokenName = extracted.split(/[\s,!.?]/)[0];
        if (spokenName && spokenName.length > 1 && spokenName.length < 20 && /^[a-zA-Z'-]+$/.test(spokenName)) {
          name = spokenName;
          firstName = spokenName.charAt(0).toUpperCase() + spokenName.slice(1).toLowerCase();
        }
      }

      const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}`;
      const context = challenge ? `They mentioned interest in: ${challenge}.` : `They're with ${company}.`;

      const knownName = firstName && firstName.toLowerCase() !== "there";
      const nameNote = knownName
        ? `Their name is ${firstName}.`
        : `You don't have their name yet — if it didn't come up naturally, ask: "Sorry — didn't catch your name?"`;

      const greetingUsed = hasName && firstName ? `Hi, may I speak with ${firstName}?` : `Hey, who am I speaking with?`;
      history.push({ role: "assistant", content: greetingUsed });
      history.push({ role: "user", content: speechResult || "Yes, speaking." });

      const introPrompt = `${nameNote} They're with ${company}. ${context}

YOUR ONLY JOB RIGHT NOW: Give a one-line opener. Pattern: "[your name] from CyberCraft360 — [soft availability check]?"
The ONLY acceptable questions here: "good time?", "bad time?", "catch you at a bad time?", "got a quick sec?", "you got a sec?"
DO NOT ask about their business, challenges, technology, or anything work-related. That comes AFTER they confirm it's a good time.
STRICT: Under 15 words total. One sentence. End with a soft question. No pitching.`;

      history.push({ role: "user", content: `[CONTEXT: ${introPrompt}]` });
      // Don't inject learnings in opening — they push toward business questions too early
      const reply = await callLLM(history, BASE_SYSTEM);
      const shouldEnd = /\[END_CALL\]/i.test(reply);
      history.push({ role: "assistant", content: reply });
      await redis.set(historyKey, history.filter(m => !m.content?.startsWith("[CONTEXT:")), { ex: 3600 });

      return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });
    }

    const actionUrl = `${base}/api/lauren/respond?name=${encodeURIComponent(name)}&amp;company=${encodeURIComponent(company)}&amp;challenge=${encodeURIComponent(challenge)}`;

    if (speechResult) {
      history.push({ role: "user", content: speechResult });
    }

    const reply = await callLLM(history, systemPrompt);
    const shouldEnd = /\[END_CALL\]/i.test(reply);
    const hasBooking = /\[BOOK_EMAIL:/i.test(reply);

    history.push({ role: "assistant", content: reply });
    await redis.set(historyKey, history.slice(-24), { ex: 3600 });

    if (shouldEnd) {
      redis.hincrby("lauren:stats", "totalCalls", 1).catch(() => {});
      saveLearning(history, hasBooking).catch(() => {});

      if (hasBooking) {
        handleBooking(reply, name, company, callSid).catch(() => {});
      }

      const log = await redis.get<any[]>("lauren:call-log") ?? [];
      log.push({
        callSid, to: name, name, company, challenge,
        status: "completed",
        messages: history.length,
        transcript: history.filter(m => !m.content?.startsWith("[CONTEXT:")),
        booked: hasBooking,
        loggedAt: new Date().toISOString(),
      });
      redis.set("lauren:call-log", log.slice(-500)).catch(() => {});
    }

    return new NextResponse(buildTwiml(reply, shouldEnd, actionUrl, firstName, base), { headers: { "Content-Type": "text/xml" } });

  } catch (err) {
    console.error("[Amy respond] error:", err);
    const fallbackBase = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
    const fallbackText = encodeURIComponent("Hey, my connection's acting up — really sorry about that. Someone from CyberCraft360 will follow up with you shortly. Really appreciate your time!");
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${fallbackBase}/api/lauren/tts?text=${fallbackText}</Play>
  <Hangup/>
</Response>`, { headers: { "Content-Type": "text/xml" } });
  }
}
