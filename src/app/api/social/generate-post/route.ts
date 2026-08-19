import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// ── Service / Topic Rotation ───────────────────────────────────────────────────
// GPT rotates through these. Tracks used topics in Redis.
const TOPICS = [
  // Core AI services
  { topic: "AI Voice Agents",          image: "premium commercial phone environment, executive on call in modern glass office, cinematic lighting, photorealistic" },
  { topic: "AI Chatbots",              image: "sleek digital interface on high-end device, luxury hospitality setting, professional service environment, photorealistic" },
  { topic: "Workflow Automation",      image: "modern operations center, multiple screens showing dashboards, clean industrial workspace, professionals at work, photorealistic" },
  { topic: "Lead Qualification",       image: "premium sales environment, executive reviewing reports, sophisticated office, confident professional, cinematic" },
  { topic: "Lead Follow-Up",           image: "business professional making calls from premium office, golden hour light, executive workspace, cinematic" },
  { topic: "Appointment Booking",      image: "elegant reception area of a premium business, calendar on screen, clean minimal design, photorealistic" },
  { topic: "Customer Support Automation", image: "premium customer experience environment, service desk in luxury setting, clean architecture, photorealistic" },
  { topic: "CRM Automation",           image: "data visualization on large screens in modern office, strategic environment, professionals analyzing insights, cinematic" },
  { topic: "Business Intelligence",    image: "executive boardroom with data displays, sophisticated analytics environment, premium architectural interior, cinematic" },
  { topic: "Marketing Automation",     image: "creative digital studio, modern marketing workspace, clean design environment, professionals at work, photorealistic" },
  { topic: "Sales Automation",         image: "premium sales operations floor, executives in modern office, city view, confident and sophisticated, photorealistic" },
  { topic: "Operations Automation",    image: "clean industrial operations environment, modern manufacturing or logistics facility, precision and order, cinematic" },
  // Industry-specific
  { topic: "AI for HVAC Companies",    image: "commercial HVAC rooftop system with city skyline, technician in professional gear, industrial precision, golden hour, photorealistic" },
  { topic: "AI for Real Estate",       image: "luxury real estate interior, premium property, architectural photography, natural light, sophisticated materials, photorealistic" },
  { topic: "AI for Healthcare",        image: "premium medical office or clinic, clean minimal design, professional environment, natural light, photorealistic" },
  { topic: "AI for Law Firms",         image: "sophisticated law office interior, dark wood and glass, premium materials, books and order, cinematic lighting, photorealistic" },
  { topic: "AI for Dental Offices",    image: "modern dental clinic, pristine clean environment, premium equipment, professional setting, photorealistic" },
  { topic: "AI for Home Services",     image: "professional home services operation, clean branded vehicles, organized team preparing for work, photorealistic" },
  { topic: "AI for Restaurants",       image: "premium restaurant kitchen or dining environment, chefs at work, sophisticated food service operation, cinematic" },
  { topic: "AI for Auto Repair",       image: "premium automotive workshop, clean garage with luxury vehicles, professional mechanics, industrial precision, photorealistic" },
  { topic: "AI for Insurance Agents",  image: "professional insurance office, executive in premium workspace, client meeting, sophisticated and trustworthy, photorealistic" },
  { topic: "AI for Property Management", image: "luxury residential building exterior at dusk, premium property, architectural photography, photorealistic" },
  // Outcome-focused
  { topic: "Never Missing a Call",     image: "professional answering a call in premium office, confident posture, modern glass workspace, cinematic lighting, photorealistic" },
  { topic: "Faster Lead Response",     image: "executive reviewing incoming inquiries on sleek device, modern office at night, city lights, urgency and precision, photorealistic" },
  { topic: "Scaling Without Hiring",   image: "small but highly efficient modern team in premium workspace, productivity and order, photorealistic" },
  { topic: "After-Hours Business",     image: "office building lit at night, city skyline, business operating after dark, cinematic and premium, photorealistic" },
  { topic: "Reducing Manual Work",     image: "clean organized desk replacing paperwork with digital system, modern minimal workspace, natural light, photorealistic" },
  { topic: "Improving Response Times", image: "precision timing environment, executive acting decisively, premium office at golden hour, cinematic" },
  { topic: "Creating Better Customer Journeys", image: "premium customer experience environment, luxury hospitality or service setting, elegant and sophisticated, photorealistic" },
  { topic: "Business Systems Design",  image: "architectural blueprint or system diagram in premium context, strategic planning environment, sophisticated materials, photorealistic" },
];

// ── Day-of-week content frames ─────────────────────────────────────────────────
const DAY_FRAMES: Record<string, { frame: string; goalDescription: string }> = {
  Monday: {
    frame: "AWARENESS",
    goalDescription: "Make someone stop scrolling. Introduce a business problem or opportunity. The hook is everything. Headline must create immediate recognition of a problem the viewer has. Do NOT explain the solution yet — just make the problem real.",
  },
  Wednesday: {
    frame: "EDUCATION",
    goalDescription: "Explain how AI or automation solves the problem. Focus on practical mechanics, real business outcomes, and dispelling misconceptions. Inform and build credibility. The viewer should finish understanding something they did not before.",
  },
  Friday: {
    frame: "CONVERSION",
    goalDescription: "Move the viewer toward CyberCraft360. Combine the problem awareness from Monday with the solution clarity from Wednesday and make a compelling case for action. CTA should feel like a natural next step, not a hard sell.",
  },
};

// ── Layout system ──────────────────────────────────────────────────────────────
// Layout variant tells DALL-E where to place negative space AND tells social-image route which layout to render
const LAYOUT_CONFIGS = [
  { variant: 1, name: "bottom-left text",   spaceNote: "natural dark negative space in the lower third and lower-left area suitable for typography, main subject positioned in upper or upper-right portion" },
  { variant: 2, name: "left-center text",   spaceNote: "subject positioned naturally in the right half of the frame, leaving the left third as natural dark or clean negative space for text overlay" },
  { variant: 3, name: "upper-left text",    spaceNote: "main subject positioned in the lower portion or lower-right of the frame, upper area and upper-left naturally clear and dark for typography" },
  { variant: 4, name: "centered text",      spaceNote: "dramatic centered composition, subject can be anywhere, overall dark moody aesthetic with enough shadow around the frame for text legibility" },
  { variant: 5, name: "right-center text",  spaceNote: "subject positioned naturally in the left half of the frame, right third naturally dark or clean for text overlay" },
  { variant: 6, name: "minimal corner text",spaceNote: "subject fills most of the frame dramatically, lower-right corner naturally darker for minimal typography" },
];

// ── Copy type ──────────────────────────────────────────────────────────────────
type CopyResult = {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  dallePromptSquare: string;
  dallePromptLandscape: string;
  layoutVariant: number;
  linkedinCaption: string;
  instagramCaption: string;
  facebookCaption: string;
};

// ── Brand system prompt ────────────────────────────────────────────────────────
const BRAND_SYSTEM = `You are the Chief Creative Officer of CyberCraft360 — a premium AI engineering and business automation company serving ambitious businesses across the United States.

BRAND POSITIONING:
CyberCraft360 communicates: intelligence, precision, engineering excellence, trust, sophistication, modern technology, and business transformation.

The content must feel like it belongs to a major global technology company — clean, confident, restrained. NOT a generic AI agency.

VOICE & TONE:
Intelligent. Calm. Precise. Declarative. Confident without arrogance.
Every sentence earns its place. No padding. No hype.

Reference the quality level of: Stripe, Linear, Vercel, AWS — technology companies that communicate with authority and restraint.

ABSOLUTE PROHIBITIONS:
• Banned words: leverage, revolutionize, game-changer, seamlessly, cutting-edge, dive in, unlock, empower, harness, transform, disrupt, innovative, solution, ecosystem, synergy, streamline, robust, scalable (as a lazy adjective), paradigm, holistic, world-class, best-in-class, state-of-the-art, unprecedented
• No exclamation marks
• No rhetorical questions to open anything
• No emoji in any copy
• No passive voice
• Never call CyberCraft360 a tool, platform, software, or chatbot company
• Never say "we help you" — say what we do, not that we help
• Every word must justify its existence`;

function buildPrompt(
  topic: typeof TOPICS[0],
  dayFrame: { frame: string; goalDescription: string },
  layout: typeof LAYOUT_CONFIGS[0],
  recentTopics: string[],
  recentLayouts: number[]
): string {
  const recentNote = recentTopics.length > 0
    ? `\nANTI-REPETITION: Recent posts covered [${recentTopics.join(", ")}] and used layouts [${recentLayouts.join(", ")}]. This post must feel visually and conceptually distinct.`
    : "";

  return `${BRAND_SYSTEM}

ASSIGNMENT:
Topic: ${topic.topic}
Content Frame: ${dayFrame.frame} — ${dayFrame.goalDescription}
Layout: ${layout.name} (variant ${layout.variant})${recentNote}

==================================================
GRAPHIC TEXT (what appears ON the image)
==================================================

eyebrow (2–5 words max):
- Small category label. Calm. E.g.: "AI ENGINEERING · VOICE AI" or "BUSINESS AUTOMATION" or "HVAC INDUSTRY"
- ALL CAPS. Do NOT make it a sentence.

headline (4–10 words):
- The single most important statement. Billboard-level clarity.
- Present tense. Declarative. Lands in under 2 seconds.
- Strong examples: "YOUR BUSINESS SHOULD NEVER MISS A CALL." / "MANUAL WORK DOES NOT SCALE." / "THE CALL IS ANSWERED. ALWAYS." / "PRECISION RUNS THE BUSINESS."
- Use line breaks (\\n) to create intentional rhythm — never leave an awkward orphan word on its own line.
- Avoid: questions, hype words, generic AI clichés

body (25–45 words exactly):
- Sharp insight that expands the headline. Specific. Earned.
- Opens with a concrete truth, not a definition.
- No hedging, no pitching, no filler.
- Every sentence must change what the reader thinks, not restate what they already know.

cta (3–6 words):
- Action-oriented, premium, specific to the topic.
- Examples: "EXPLORE AI VOICE →" / "SEE HOW IT WORKS →" / "BUILD YOUR SYSTEM →" / "BOOK A STRATEGY CALL →"
- NOT: "LEARN MORE" / "CLICK HERE" / "VISIT WEBSITE"

==================================================
DALL-E IMAGE PROMPTS
==================================================

Generate two DALL-E 3 prompts for the background photography.

The image must:
- Be DIRECTLY related to: ${topic.topic}
- Image direction: ${topic.image}
- Composition requirement: ${layout.spaceNote}
- Style: cinematic, photorealistic, premium, editorial — as if shot by a professional commercial photographer for a Fortune 500 brand campaign
- Lighting: dramatic but natural — directional light, realistic shadows, no studio-flash look
- Color: restrained — dark charcoals, warm whites, natural tones. No neon, no glowing blue tech, no holograms
- NO text in the image. NO logos. NO floating UI elements. NO people looking directly at camera in a posed way.
- The image must look expensive BEFORE any typography is added.

dallePromptSquare: for 1024x1024 Instagram square/portrait post
dallePromptLandscape: for 1792x1024 Facebook/LinkedIn horizontal post

==================================================
CAPTIONS (what appears in the post caption, NOT on the image)
==================================================

linkedinCaption (130–180 words):
- Executive register. Reads like a memo from a senior operator, not a marketing post.
- Opens with a counterintuitive observation or specific business truth — NOT the headline repeated.
- Builds the idea over 3–4 sentences. Lands CyberCraft360 once, naturally.
- End with: "Book a strategy call at CyberCraft360.com" then a blank line then: "#AIEngineering #BusinessAutomation #IntelligentSystems #OperationalExcellence #CyberCraft360"

instagramCaption (60–90 words):
- First line is the hook — must be strong enough to stop the scroll.
- Confident, editorial, precise.
- End with: "CyberCraft360.com" then a blank line then: "#AIEngineering #BusinessAutomation #AIAgency #IntelligentSystems #OperationalExcellence #CyberCraft360 #SmallBusiness #AIForBusiness"

facebookCaption (90–130 words):
- Narrative. A business scenario, problem moment, or before/after. Accessible and business-focused.
- No hashtags. End with: "CyberCraft360.com"

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "eyebrow": "...",
  "headline": "...",
  "body": "...",
  "cta": "...",
  "dallePromptSquare": "...",
  "dallePromptLandscape": "...",
  "layoutVariant": ${layout.variant},
  "linkedinCaption": "...",
  "instagramCaption": "...",
  "facebookCaption": "..."
}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function escapeControlCharsInStrings(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped) { result += c; escaped = false; }
    else if (c === "\\") { result += c; escaped = true; }
    else if (c === '"') { result += c; inString = !inString; }
    else if (inString && c.charCodeAt(0) < 32) {
      if (c === "\n") result += "\\n";
      else if (c === "\r") result += "\\r";
      else if (c === "\t") result += "\\t";
      else result += `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
    } else {
      result += c;
    }
  }
  return result;
}

function extractJson(raw: string): string {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = s.indexOf("{"), end = s.lastIndexOf("}");
  if (start !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

let _lastRaw = "";

async function callOpenAI(prompt: string): Promise<CopyResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("[generate-post] OPENAI_API_KEY not set"); return null; }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 3000,
      temperature: 0.78,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[generate-post] OpenAI error", res.status, err.slice(0, 200));
    _lastRaw = `HTTP_ERROR_${res.status}: ${err.slice(0, 200)}`;
    return null;
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  _lastRaw = raw;
  const clean = escapeControlCharsInStrings(extractJson(raw));
  try {
    return JSON.parse(clean) as CopyResult;
  } catch (e) {
    console.error("[generate-post] JSON parse failed:", String(e), "raw:", raw.slice(0, 300));
    return null;
  }
}

async function generateDalleImage(prompt: string, square: boolean): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: `${prompt} Photorealistic, cinematic, no text, no logos, no watermarks. Shot on high-end camera, professional editorial photography.`,
      n: 1,
      size: square ? "1024x1024" : "1792x1024",
      quality: "standard",
      response_format: "url",
    }),
  });

  if (!res.ok) {
    console.error("[generate-post] DALL-E error", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.data?.[0]?.url ?? null;
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const customPrompt: string | undefined = body.customPrompt?.trim() || undefined;

  // Get anti-repetition state from Redis
  const recentTopics = await redis.get<string[]>("social:recent_topics") ?? [];
  const recentLayouts = await redis.get<number[]>("social:recent_layouts") ?? [];
  const usedTopicIndexes = await redis.get<number[]>("social:used_topic_indexes") ?? [];

  // Pick topic — rotate through, avoid recent
  let topicIndex: number;
  if (typeof body.topicIndex === "number") {
    topicIndex = body.topicIndex % TOPICS.length;
  } else {
    const unused = TOPICS.map((_, i) => i).filter(i => !usedTopicIndexes.includes(i));
    const pool = unused.length > 0 ? unused : TOPICS.map((_, i) => i);
    topicIndex = pool[Math.floor(Math.random() * pool.length)];
  }
  const topic = TOPICS[topicIndex];

  // Pick layout — avoid recent two
  const availableLayouts = LAYOUT_CONFIGS.filter(l => !recentLayouts.slice(-2).includes(l.variant));
  const layout = availableLayouts[Math.floor(Math.random() * availableLayouts.length)] ?? LAYOUT_CONFIGS[0];

  // Determine day frame based on actual day of week
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Chicago" });
  const dayFrame = DAY_FRAMES[dayName] ?? DAY_FRAMES["Wednesday"];

  // Build prompt and generate copy
  const prompt = customPrompt
    ? `${BRAND_SYSTEM}\n\nASSIGNMENT — CUSTOM POST:\n${customPrompt}\n\nGenerate the same JSON output format as a standard post (eyebrow, headline, body, cta, dallePromptSquare, dallePromptLandscape, layoutVariant, linkedinCaption, instagramCaption, facebookCaption). Choose layout variant ${layout.variant}.`
    : buildPrompt(topic, dayFrame, layout, recentTopics.slice(-4), recentLayouts.slice(-4));

  const copy = await callOpenAI(prompt);
  if (!copy) {
    return NextResponse.json({ ok: false, error: "Copy generation failed", raw: _lastRaw.slice(0, 2000) }, { status: 500 });
  }

  // Generate DALL-E images (square for Instagram, landscape for Facebook/LinkedIn)
  const [squarePhoto, landscapePhoto] = await Promise.all([
    generateDalleImage(copy.dallePromptSquare, true),
    generateDalleImage(copy.dallePromptLandscape, false),
  ]);

  // Update anti-repetition state
  const newTopics = [...recentTopics, topic.topic].slice(-8);
  const newLayouts = [...recentLayouts, copy.layoutVariant ?? layout.variant].slice(-8);
  const newUsed = [...usedTopicIndexes, topicIndex];
  if (newUsed.length >= TOPICS.length) {
    await redis.set("social:used_topic_indexes", []);
  } else {
    await redis.set("social:used_topic_indexes", newUsed);
  }
  await Promise.all([
    redis.set("social:recent_topics", newTopics),
    redis.set("social:recent_layouts", newLayouts),
  ]);

  return NextResponse.json({
    ok: true,
    topicIndex,
    topic: topic.topic,
    day: dayName,
    frame: dayFrame.frame,
    layoutVariant: copy.layoutVariant ?? layout.variant,
    copy,
    photoUrl: squarePhoto,
    landscapePhotoUrl: landscapePhoto,
  });
}

export { TOPICS };
