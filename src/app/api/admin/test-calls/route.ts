import { NextRequest } from "next/server";

const BASE = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://cybercraft360.com";

const RESPOND = `${BASE}/api/lauren/respond`;

const CALLS = [
  {
    label: "Interested lead — auto repair shop",
    name: "Marcus Johnson", company: "Marcus Auto Repair", challenge: "missing calls while working on vehicles",
    turns: [
      "Hey yeah I'm here",
      "We miss like 20 calls a day when we're under the hood",
      "Yeah that's exactly it, people just go somewhere else",
      "How does it actually work though?",
      "That sounds pretty good honestly. Would it know our pricing and hours?",
      "Yeah let's set something up",
      "It's marcus at marcusauto dot com",
      "Yeah that's right",
      "Mornings, like 9 or 10am",
    ],
  },
  {
    label: "Skeptical — heard it all before",
    name: "Gary Thompson", company: "Thompson Plumbing", challenge: "lead follow-up",
    turns: [
      "Yeah who's calling?",
      "Look I get these calls every week, what makes you different",
      "Every AI company says that",
      "Okay what would it actually do for a plumbing company",
      "We do get a ton of missed calls after hours",
      "And it sounds like a real person?",
      "Alright fine. What's the free call about exactly",
      "Okay I'll do it. gary at thompsonplumbing dot net",
      "Yeah that's right",
      "Any morning this week works",
    ],
  },
  {
    label: "Busy caller — bad time",
    name: "Rachel Torres", company: "Torres Real Estate", challenge: "lead response time",
    turns: [
      "Hey I'm literally about to walk into a showing",
      "Can you call me back tomorrow morning?",
      "Yeah 10am works",
      "rachel at torresrealty dot com",
      "Yep that's it",
    ],
  },
  {
    label: "Venting — had a rough day",
    name: "Tony Russo", company: "Russo Logistics", challenge: "operations",
    turns: [
      "Tony here",
      "Look I'm having a terrible day, my biggest client just pulled out",
      "Yeah 40k gone, just like that",
      "What do you even do",
      "Wait so your AI could have caught that before it got to that point?",
      "Tell me more about that",
      "How fast can something like this get set up",
      "Alright lets talk. tony at russologistics dot com",
      "Yeah that's right",
      "Afternoons work better for me",
    ],
  },
  {
    label: "Asks if AI",
    name: "Zoe Spencer", company: "Spencer Tech", challenge: "automation",
    turns: [
      "Yeah this is Zoe",
      "Wait, are you an AI?",
      "You sound really natural for a bot",
      "Okay I'll take your word for it. What's this about",
      "We do waste a lot of time on manual stuff honestly",
      "What kind of automation are we talking",
      "That's actually useful. Can I see a demo?",
      "Yeah okay lets book something. zoe at spencertech dot com",
      "That's right",
      "Wednesday afternoon works",
    ],
  },
  {
    label: "Price sensitive — small business",
    name: "Helen Tran", company: "Tran Nail Salon", challenge: "after-hours calls",
    turns: [
      "Helen speaking",
      "We're a small nail salon, I don't know if we can afford AI",
      "How much does it cost",
      "That's a lot for a small salon honestly",
      "But we do miss a lot of calls after 7pm",
      "How many bookings would I need to break even",
      "Okay that's not bad actually",
      "Alright let me try it. helen at trannailsalon dot com",
      "Yes that's correct",
      "Saturday mornings are best",
    ],
  },
  {
    label: "Wrong person — gatekeeper",
    name: "", company: "Henderson Law", challenge: "",
    turns: [
      "Henderson Law, how can I help",
      "Oh she's not in today",
      "Can I take a message",
      "She'll be back Thursday, you can try then",
    ],
  },
  {
    label: "Already uses ChatGPT",
    name: "Alan Porter", company: "Porter Marketing", challenge: "content and leads",
    turns: [
      "Alan here",
      "We already use ChatGPT for everything so I'm not sure I need this",
      "What's different about what you do",
      "Oh so it's trained on our actual business data",
      "ChatGPT doesn't know our clients at all, it just gives generic stuff",
      "How would it know our specific services and pricing",
      "That actually makes sense. What does setup look like",
      "Yeah lets talk. alan at portermarketing dot com",
      "Yep",
      "Tuesday afternoon",
    ],
  },
  {
    label: "Hard no — email only",
    name: "Debra Fox", company: "Fox Bakery", challenge: "",
    turns: [
      "Debra speaking",
      "Thanks but I'm really not interested right now",
      "We're doing fine honestly",
      "Can you just send me an email with information",
      "debra at foxbakery dot com",
      "Yes that's right, thanks",
    ],
  },
  {
    label: "Interrupted mid-conversation",
    name: "Pete Sanders", company: "Sanders HVAC", challenge: "scheduling",
    turns: [
      "Pete Sanders, hold on someone just walked in my office",
      "Sorry about that. What were you saying",
      "Oh yeah we definitely have issues with scheduling",
      "We've got 8 techs and I'm coordinating everything by hand",
      "Is there a way to automate the dispatch side",
      "Okay this is exactly what I need. pete at sandershvac dot com",
      "That's right",
      "Any Tuesday morning",
    ],
  },
];

async function postRespond(params: Record<string, string>, body: Record<string, string>): Promise<string> {
  const url = `${RESPOND}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  const matches = [...text.matchAll(/\/api\/lauren\/tts\?text=([^<"&]+)/g)];
  if (matches.length) return decodeURIComponent(matches[0][1]);
  return "[no speech]";
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      for (let i = 0; i < Math.min(3, CALLS.length); i++) {
        const call = CALLS[i];
        const sid = `ADMIN_TEST_${Date.now()}_${i}`;

        send({ type: "call_start", index: i, label: call.label, name: call.name, company: call.company, challenge: call.challenge });

        // Opening turn
        const firstLine = call.turns[0];
        const opening = await postRespond(
          { name: call.name, company: call.company, challenge: call.challenge, stage: "opening" },
          { SpeechResult: firstLine, CallSid: sid }
        );
        send({ type: "turn", caller: firstLine, amy: opening });

        // Remaining turns
        for (let j = 1; j < call.turns.length; j++) {
          await new Promise(r => setTimeout(r, 400));
          const line = call.turns[j];
          const reply = await postRespond(
            { name: call.name || "there", company: call.company, challenge: call.challenge },
            { SpeechResult: line, CallSid: sid }
          );
          send({ type: "turn", caller: line, amy: reply });
          if (/\[END_CALL\]/.test(reply)) break;
        }

        send({ type: "call_end", index: i });
        await new Promise(r => setTimeout(r, 800));
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
