import { NextRequest, NextResponse } from "next/server";

type Message = { role: "user" | "assistant"; content: string };

const PERSONAS: Record<string, any> = {
  beauty: {
    name: "Glam Studio",
    emoji: "💅",
    label: "Beauty Salon",
    business: "a luxury beauty salon in Houston, TX",
    services: "haircuts, balayage, color treatments, keratin smoothing, blowouts, lash extensions, brow shaping",
    hours: "Monday–Saturday 9am–7pm, Sunday 10am–5pm",
    pricing: "Haircuts start at $45. Balayage from $150. Full color from $120. Lashes from $80.",
    booking: "Clients can book online at glamstudio.com or we can schedule them right now.",
    faq: "We accept walk-ins but appointments are preferred. We carry Olaplex and K18 treatments. Parking is free in the rear lot.",
  },
  restaurant: {
    name: "Mario's Kitchen",
    emoji: "🍕",
    label: "Restaurant",
    business: "a family-owned Italian restaurant in Houston, TX",
    services: "dine-in, takeout, catering for events, private dining room rentals",
    hours: "Daily 11am–10pm, Friday and Saturday until 11pm. Closed on Thanksgiving and Christmas.",
    pricing: "Pasta dishes $16–$24. Pizzas $18–$28. Family platters from $65. Catering packages from $25/person.",
    booking: "Reservations available on OpenTable or I can note your party size and preferred time right now.",
    faq: "We have a full bar, vegetarian and gluten-free options. Kids menu available. Private dining room seats up to 30.",
  },
  dental: {
    name: "Bright Smile Dental",
    emoji: "🦷",
    label: "Dental Office",
    business: "a modern dental practice in Houston, TX",
    services: "routine cleanings, teeth whitening, fillings, crowns, implants, Invisalign, emergency dental care",
    hours: "Monday–Friday 8am–5pm, Saturday 9am–2pm. Emergency appointments available.",
    pricing: "New patient cleaning and exam $99. Whitening from $299. Free consultations for implants and Invisalign.",
    booking: "We have openings this week. I can schedule you right now — just need your name and preferred day.",
    faq: "We accept most PPO insurances. Payment plans available through CareCredit. X-rays included in new patient visit.",
  },
  realestate: {
    name: "Pinnacle Realty",
    emoji: "🏡",
    label: "Real Estate",
    business: "a real estate agency specializing in Houston residential and commercial properties",
    services: "home buying, home selling, property management, investment properties, commercial real estate",
    hours: "Monday–Friday 8am–6pm, weekends by appointment. Agents available evenings for urgent matters.",
    pricing: "Standard 3% commission for sellers. Buyer representation at no cost to you. Free home valuations.",
    booking: "I can connect you with one of our agents today. Free consultation, no pressure.",
    faq: "We have 12 agents covering all Houston metro areas. Average home sells in 21 days on our listings. We also manage rental properties.",
  },
  auto: {
    name: "QuickFix Auto",
    emoji: "🔧",
    label: "Auto Repair",
    business: "a full-service auto repair shop in Houston, TX",
    services: "oil changes, brake service, tire rotation and replacement, AC repair, engine diagnostics, transmission service, state inspections",
    hours: "Monday–Friday 7am–6pm, Saturday 8am–4pm. Closed Sunday.",
    pricing: "Oil changes from $49.99. Free multi-point inspection with every visit. Brake pads from $89/axle. Free diagnostics.",
    booking: "Walk-ins welcome but appointments get priority. I can get you scheduled now.",
    faq: "We work on all makes and models. 12-month/12,000 mile warranty on parts and labor. Loaner cars available for major repairs.",
  },
};

function buildSystem(persona: any): string {
  return `You are an AI receptionist named IRIS working for ${persona.name}, ${persona.business}.

You are handling an incoming customer inquiry. Be warm, helpful, and concise — this is a real conversation, not a form. Sound like a real person, not a bot.

BUSINESS INFO:
- Services: ${persona.services}
- Hours: ${persona.hours}
- Pricing: ${persona.pricing}
- Booking: ${persona.booking}
- FAQs: ${persona.faq}

RULES:
- Keep responses to 2-3 sentences max. This is a chat, not an essay.
- Always try to move toward booking an appointment or answering their question.
- If asked about something you don't know, say you'll have the team follow up.
- Never make up prices or info not listed above.
- Be warm and human. Use the customer's name if they share it.
- End most responses with a helpful question or offer to help further.`;
}

export async function POST(req: NextRequest) {
  try {
    const { persona: personaKey, messages }: { persona: string; messages: Message[] } = await req.json();

    const persona = PERSONAS[personaKey];
    if (!persona) return NextResponse.json({ error: "Unknown persona" }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: buildSystem(persona) }, ...messages],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Groq error");

    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("[Demo chat] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
