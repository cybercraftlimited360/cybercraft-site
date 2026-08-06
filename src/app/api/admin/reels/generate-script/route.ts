import { NextRequest, NextResponse } from "next/server";

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
function verifyAdmin(req: NextRequest) {
  const t = req.headers.get("x-admin-token"), s = process.env.ADMIN_SECRET;
  return !!(t && s && t === makeToken(s));
}

// ── 12-Week Reel Campaign (36 commercials) ────────────────────────────────────
export const REEL_CAMPAIGNS = [
  // WEEK 1 — We Don't Build Software
  { week:1, day:"Monday",    campaign:"We Don't Build Software",           angle:"Position CyberCraft360 as an engineering firm, not a software vendor. The distinction between infrastructure and tools. Why architecture beats features every time.", industry:null, pexelsQueries:["luxury executive boardroom dark cinematic","glass headquarters architectural editorial","modern corporate lobby minimal"] },
  { week:1, day:"Wednesday", campaign:"We Don't Build Software",           angle:"Most businesses buy tools hoping for transformation. Tools don't transform — architecture does. CRM is a tool. A connected intelligence system is infrastructure.", industry:null, pexelsQueries:["architectural office interior dark","premium corporate interior glass","editorial executive workspace minimal"] },
  { week:1, day:"Friday",    campaign:"We Don't Build Software",           angle:"Engineering a business means understanding its operations before its technology. CyberCraft360 starts with operations. The technology is the last decision.", industry:null, pexelsQueries:["modern glass office architecture","dark concrete premium interior","luxury boardroom cinematic"] },

  // WEEK 2 — Every Great Business Runs On Great Systems
  { week:2, day:"Monday",    campaign:"Every Great Business Runs On Great Systems", angle:"Behind every great business is a system no one sees. Tesla has manufacturing precision. Apple has supply chain engineering. Invisible operational excellence.", industry:null, pexelsQueries:["luxury architectural corporate headquarters","executive strategy workspace editorial","premium planning office minimal"] },
  { week:2, day:"Wednesday", campaign:"Every Great Business Runs On Great Systems", angle:"A business that grows faster than its systems will collapse. Most small businesses hit a ceiling not because of market — because of internal chaos.", industry:null, pexelsQueries:["modern commercial office architectural","executive workspace premium cinematic","luxury interior business editorial"] },
  { week:2, day:"Friday",    campaign:"Every Great Business Runs On Great Systems", angle:"Operational excellence is the difference between a business that scales and one that survives. CyberCraft360 engineers the systems that make scaling possible.", industry:null, pexelsQueries:["corporate architecture glass facade","luxury office minimal design","editorial executive dark interior"] },

  // WEEK 3 — The Best Systems Are Invisible
  { week:3, day:"Monday",    campaign:"The Best Systems Are Invisible",    angle:"The mark of great engineering is that no one notices it. Appointments booked. Inquiries answered. Follow-ups sent. The owner experiences freedom.", industry:null, pexelsQueries:["luxury hotel lobby architecture cinematic","golden hour executive office","architectural interior warm light"] },
  { week:3, day:"Wednesday", campaign:"The Best Systems Are Invisible",    angle:"AI that announces itself has failed. The best automation works in silence — answering calls at 2am, routing leads in milliseconds, sending follow-ups perfectly.", industry:null, pexelsQueries:["architectural boardroom dark editorial","premium office natural light","minimal executive workspace warm"] },
  { week:3, day:"Friday",    campaign:"The Best Systems Are Invisible",    angle:"Your customers should never know automation exists. They should only know that your business responds faster and delivers more consistently than competitors.", industry:null, pexelsQueries:["luxury architectural interior editorial","executive meeting room premium","dark minimal corporate interior cinematic"] },

  // WEEK 4 — Automation Should Feel Human
  { week:4, day:"Monday",    campaign:"Automation Should Feel Human",      angle:"The failure of most chatbots is that they feel like chatbots. CyberCraft360 engineers conversational systems that feel like your best employee.", industry:null, pexelsQueries:["premium hospitality interior warm cinematic","luxury hotel reception minimal","warm natural business interior"] },
  { week:4, day:"Wednesday", campaign:"Automation Should Feel Human",      angle:"A customer calling after hours deserves a real response. AI voice systems handle calls, book appointments, answer questions with the precision of a trained team.", industry:null, pexelsQueries:["warm office lighting minimal architectural","premium customer service interior","natural light architectural workspace editorial"] },
  { week:4, day:"Friday",    campaign:"Automation Should Feel Human",      angle:"Technology should amplify human connection. When automation handles repetitive communication, your team focuses on relationships that require human judgment.", industry:null, pexelsQueries:["executive consultation warm light architectural","premium business meeting natural","hospitality interior warm architectural"] },

  // WEEK 5 — Industry Series
  { week:5, day:"Monday",    campaign:"Designed For HVAC",                 angle:"HVAC companies missing calls during peak season have a systems problem. AI voice agents answer every call, qualify every lead, schedule every appointment. Revenue stops leaking.", industry:"HVAC", pexelsQueries:["commercial HVAC rooftop system industrial","mechanical room building automation","facility management engineer professional"] },
  { week:5, day:"Wednesday", campaign:"Designed For Real Estate",          angle:"In real estate, speed wins the client. AI follow-up systems ensure every inquiry receives an intelligent response within 60 seconds — 24 hours a day.", industry:"Real Estate", pexelsQueries:["luxury real estate architecture cinematic","premium property development aerial","modern commercial building architectural editorial"] },
  { week:5, day:"Friday",    campaign:"Designed For Healthcare",           angle:"Healthcare practices lose thousands monthly to missed appointments. CyberCraft360 engineers patient communication systems that reduce no-shows and automate reminders.", industry:"Healthcare", pexelsQueries:["premium medical office minimal","modern clinic interior architectural","healthcare administration clean professional"] },

  // WEEK 6 — Remove The Friction
  { week:6, day:"Monday",    campaign:"Remove The Friction",               angle:"Every manual process is a tax on your time. Repetitive data entry, follow-up emails, appointment confirmations — these are engineering problems. CyberCraft360 solves them.", industry:null, pexelsQueries:["minimal concrete office dark cinematic","architectural interior precision","executive workspace clean editorial"] },
  { week:6, day:"Wednesday", campaign:"Remove The Friction",               angle:"The businesses that win aren't working hardest. They've engineered friction out of their operations. Less friction means faster decisions and higher margins.", industry:null, pexelsQueries:["modern glass architecture commercial","premium workspace editorial dark","minimal corporate interior architectural"] },
  { week:6, day:"Friday",    campaign:"Remove The Friction",               angle:"Operational friction is invisible until it costs you a client. A missed follow-up. A slow response. An unanswered call. CyberCraft360 removes these failure points.", industry:null, pexelsQueries:["luxury editorial office lighting","architectural minimal corporate dark","premium interior concrete editorial"] },

  // WEEK 7 — Every Minute Matters
  { week:7, day:"Monday",    campaign:"Every Minute Matters",              angle:"Time is the only resource that cannot be recovered. Businesses that automate intelligently gain back hours every week — hours that compound into competitive advantage.", industry:null, pexelsQueries:["executive boardroom precision cinematic","luxury minimal office editorial","architectural corporate interior clean"] },
  { week:7, day:"Wednesday", campaign:"Every Minute Matters",              angle:"The average service business spends 30% of its time on administrative work that could be automated. For a 10-person team, that's three full-time positions worth of capacity.", industry:null, pexelsQueries:["modern architectural office glass natural","premium workspace natural light","executive interior minimal warm editorial"] },
  { week:7, day:"Friday",    campaign:"Every Minute Matters",              angle:"Speed is a competitive moat. The business that books in seconds, responds to leads instantly, and follows up without delay wins better clients.", industry:null, pexelsQueries:["dark editorial corporate architecture","luxury office interior precise","minimal concrete workspace premium cinematic"] },

  // WEEK 8 — From Chaos To Clarity
  { week:8, day:"Monday",    campaign:"From Chaos To Clarity",             angle:"Disconnected systems create invisible chaos. Your CRM doesn't talk to your scheduling software. Your phone system isn't connected to follow-up. CyberCraft360 builds the connection layer.", industry:null, pexelsQueries:["architectural planning office premium","executive strategy workspace editorial","blueprint architectural dark minimal"] },
  { week:8, day:"Wednesday", campaign:"From Chaos To Clarity",             angle:"Clarity is not a feeling — it's a system. When operations are designed correctly, every team member knows what to do, every customer gets the right response.", industry:null, pexelsQueries:["modern glass corporate interior cinematic","premium architectural office design","editorial executive workspace minimal dark"] },
  { week:8, day:"Friday",    campaign:"From Chaos To Clarity",             angle:"The first sign of business maturity is when operations stop depending on the founder. CyberCraft360 engineers systems that remove you from the day-to-day.", industry:null, pexelsQueries:["luxury concrete architecture dark editorial","minimal executive office precise","architectural interior warm cinematic"] },

  // WEEK 9 — Intelligence That Learns
  { week:9, day:"Monday",    campaign:"Intelligence That Learns",          angle:"Static automation is a ceiling. Adaptive AI systems improve with every interaction — learning what customers ask, how your team responds, where the gaps are.", industry:null, pexelsQueries:["dark architectural minimal office editorial","premium corporate interior glass","executive boardroom precise cinematic"] },
  { week:9, day:"Wednesday", campaign:"Intelligence That Learns",          angle:"A well-engineered AI system doesn't just answer questions — it understands context. Industry-specific, company-specific, customer-specific. The difference between a chatbot and intelligent infrastructure.", industry:null, pexelsQueries:["luxury editorial interior design architectural","workspace premium clean minimal","modern corporate office minimal dark"] },
  { week:9, day:"Friday",    campaign:"Intelligence That Learns",          angle:"The businesses that will lead their industries in five years are building adaptive AI infrastructure today. Intelligence compounds — and compound advantage is insurmountable.", industry:null, pexelsQueries:["premium architectural dark interior","glass headquarters modern minimal","executive office natural light editorial cinematic"] },

  // WEEK 10 — Your Business. One System.
  { week:10, day:"Monday",   campaign:"Your Business. One System.",        angle:"Most businesses run on ten tools that don't speak to each other. CyberCraft360 builds the unified intelligence layer — one system connecting operations, communication, and customer experience.", industry:null, pexelsQueries:["architectural blueprint planning editorial","executive workspace unified minimal","premium corporate interior precision"] },
  { week:10, day:"Wednesday",campaign:"Your Business. One System.",        angle:"Integration is a design problem, not a technical one. The best AI systems are designed around business outcomes, not technology constraints. CyberCraft360 designs from outcome backward.", industry:null, pexelsQueries:["modern glass architecture office editorial","luxury minimal corporate interior","architectural workspace dark precise"] },
  { week:10, day:"Friday",   campaign:"Your Business. One System.",        angle:"One connected system means one source of truth. Every lead, every customer interaction, every appointment — visible, traceable, and intelligent. This is what operational clarity looks like.", industry:null, pexelsQueries:["premium editorial executive boardroom cinematic","concrete architectural office warm","glass corporate headquarters minimal"] },

  // WEEK 11 — Built To Scale
  { week:11, day:"Monday",   campaign:"Built To Scale",                    angle:"Scaling with broken systems means scaling the chaos. CyberCraft360 builds infrastructure designed for the business you are becoming — not just the business you are today.", industry:null, pexelsQueries:["luxury architectural commercial building","premium modern headquarters glass","editorial executive office dark cinematic"] },
  { week:11, day:"Wednesday",campaign:"Built To Scale",                    angle:"Enterprise operations don't require enterprise headcount. The right AI infrastructure allows a 10-person team to operate with the responsiveness of a 50-person organization.", industry:null, pexelsQueries:["minimal concrete corporate interior editorial","architectural office premium design","executive workspace clean precise"] },
  { week:11, day:"Friday",   campaign:"Built To Scale",                    angle:"The ceiling of most businesses is not market size — it's operational capacity. When operations scale automatically, growth becomes a design feature, not a crisis.", industry:null, pexelsQueries:["dark architectural premium office cinematic","luxury glass headquarters modern","editorial corporate interior architectural"] },

  // WEEK 12 — The Future Is Already Working
  { week:12, day:"Monday",   campaign:"The Future Is Already Working",     angle:"The future of business operations is not coming — it's already deployed inside the companies that will define their industries. CyberCraft360 builds that infrastructure.", industry:null, pexelsQueries:["luxury executive boardroom editorial cinematic","architectural interior premium dark","minimal glass corporate modern"] },
  { week:12, day:"Wednesday",campaign:"The Future Is Already Working",     angle:"AI is not a competitive advantage anymore — it's a competitive requirement. The question is not whether to build intelligent systems — it's whether you build them before your competitors.", industry:null, pexelsQueries:["premium architectural concrete office","executive workspace warm editorial","modern corporate interior glass dark"] },
  { week:12, day:"Friday",   campaign:"The Future Is Already Working",     angle:"CyberCraft360 exists to give ambitious businesses the operational intelligence that was previously available only to enterprises with hundreds of engineers. That gap is now closed.", industry:null, pexelsQueries:["architectural editorial interior luxury cinematic","dark corporate headquarters minimal","premium office warm concrete glass"] },
];

const BRAND_VOICE = `
ROLE: You are the Global Executive Creative Director of CyberCraft360 — an AI Engineering firm in Houston, TX.
Your work is the creative standard of Apple, Porsche, Stripe, McLaren, DJI, and Linear.

MISSION: Write a 30-second cinematic brand commercial script — not a social media reel.
The platform is Instagram/Facebook/LinkedIn. The standard is an Apple product film.

BRAND POSITIONING:
- CyberCraft360 is an AI Engineering Company and Intelligent Systems Partner
- NOT: software company, chatbot company, automation tool, SaaS startup
- We engineer operational infrastructure for ambitious businesses

TONE: An experienced consultant speaking to a CEO. Never a salesperson. Never a YouTuber.
Short sentences. Precision. Allow silence. Confidence through restraint.

PROHIBITED WORDS & PHRASES (any of these = failure):
leverage, revolutionize, game-changer, seamlessly, cutting-edge, unlock, empower, harness, transform, disrupt, innovative, solution, ecosystem, synergy, streamline, robust, scalable, paradigm, holistic, world-class, best-in-class, state-of-the-art, next-level, unprecedented
No exclamation marks. No rhetorical questions as openers. No emoji. No filler adjectives.

VISUAL REFERENCES: Apple, Porsche, McLaren, Stripe, OpenAI, DJI, Leica, Herman Miller, Architectural Digest
FEEL: restraint, simplicity, precision, confidence, negative space, cinematic composition

SUCCESS TEST: Would this commercial feel natural between two Apple keynote segments?`;

const REEL_STRUCTURE = `
COMMERCIAL STRUCTURE (strict — 30–35 seconds):

1. HOOK (0–3s): One bold declarative statement. Stops the scroll immediately. No question marks.
2. PROBLEM (3–8s): Name a real business pain with precision. One sentence. No exaggeration.
3. INSIGHT (8–18s): One principle that reframes how the viewer thinks about the problem. The intellectual core of the commercial.
4. SOLUTION (18–28s): CyberCraft360's approach. Never promotional. Position as engineering, not selling.
5. CLOSING (28–35s): Premium CTA. "CyberCraft360.com" + one final resonant thought.

PACING: 6–9 scenes. Each scene 3–5 seconds. Smooth dissolves. Cinematic. Never rushed.

OUTPUT FORMAT — return exactly this JSON (no markdown):
{
  "title": "Commercial title (4-6 words, internal reference only)",
  "duration": "32s",
  "hook": "The opening line spoken at 0s. Maximum 10 words.",
  "scenes": [
    {
      "id": 1,
      "timeCode": "0:00–0:03",
      "duration": "3s",
      "narration": "Exact words spoken. Short sentences. Maximum 2 sentences.",
      "visualDirection": "Precise shot description. Lens. Movement. Subject. Lighting. Atmosphere.",
      "pexelsQuery": "Premium Pexels video search query for this specific scene"
    }
  ],
  "voiceoverScript": "Complete voiceover from start to finish. Every word. Read time: 30–35 seconds.",
  "musicDirection": "Music mood and tempo for the full commercial.",
  "colorGrade": "Specific color grading direction for all clips.",
  "endCard": { "headline": "3-4 words max", "cta": "Schedule Your Discovery", "url": "CyberCraft360.com" }
}`;

async function generateScript(campaign: typeof REEL_CAMPAIGNS[0], customPrompt?: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const industryLine = campaign.industry
    ? `\nINDUSTRY: ${campaign.industry} — every word, scene, and example must be directly relevant to ${campaign.industry} businesses. Speak their operational reality.`
    : "";

  const assignment = customPrompt
    ? `CUSTOM ASSIGNMENT:\n${customPrompt}`
    : `CAMPAIGN: "${campaign.campaign}"\nWEEK ${campaign.week} · ${campaign.day}${industryLine}\n\nSTRATEGIC ANGLE (interpret this creatively — do not copy it):\n${campaign.angle}`;

  const prompt = `${BRAND_VOICE}\n\n${assignment}\n\n${REEL_STRUCTURE}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.78,
      stream: false,
    }),
  });

  if (!res.ok) { console.error("[generate-reel]", res.status); return null; }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try { return JSON.parse(clean); }
  catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch { /**/ }
    return null;
  }
}

async function fetchClips(): Promise<any[]> {
  // Pull from AI clip library first
  const { redis } = await import("@/lib/redis");
  const library = await redis.get<any[]>("reels:clip_library") ?? [];
  if (library.length > 0) {
    // Shuffle so each reel gets a different mix
    const shuffled = [...library].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10).map((c: any) => ({
      id: c.id,
      url: c.url,
      duration: c.duration ?? 5,
      prompt: c.prompt,
      source: "veo",
    }));
  }

  // Fallback to Pexels if library is empty
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];
  const results: any[] = [];
  for (const q of ["cinematic dark technology abstract", "luxury minimal dark studio", "futuristic light particles"]) {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=6&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) continue;
    const d = await res.json();
    const clips = (d.videos ?? []).map((v: any) => {
      const files: any[] = v.video_files ?? [];
      const portraitHD = files.find((f: any) => f.quality === "hd" && f.height > f.width);
      const anyHD = files.find((f: any) => f.quality === "hd");
      const chosen = portraitHD ?? anyHD ?? files[0];
      return { id: v.id, duration: v.duration, url: chosen?.link, source: "pexels" };
    }).filter((v: any) => v.url && v.duration >= 3);
    results.push(...clips);
    if (results.length >= 10) break;
  }
  return results.slice(0, 10);
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const customPrompt: string | undefined = body.customPrompt?.trim() || undefined;

  let campaignIdx = typeof body.campaignIndex === "number"
    ? body.campaignIndex % REEL_CAMPAIGNS.length
    : Math.floor(Math.random() * REEL_CAMPAIGNS.length);

  const campaign = REEL_CAMPAIGNS[campaignIdx];

  const [script, videos] = await Promise.all([
    generateScript(campaign, customPrompt),
    fetchClips(),
  ]);

  if (!script) return NextResponse.json({ ok: false, error: "Script generation failed" }, { status: 500 });

  return NextResponse.json({
    ok: true,
    campaignIndex: campaignIdx,
    campaign: campaign.campaign,
    week: campaign.week,
    day: campaign.day,
    script,
    suggestedClips: videos,
  });
}

export { REEL_CAMPAIGNS };
