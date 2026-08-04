import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

// ── 12-Week Campaign Structure (36 posts: Mon/Wed/Fri) ────────────────────────
const CAMPAIGNS = [
  // WEEK 1 — We Don't Build Software
  { week: 1, day: "Monday",    campaign: "We Don't Build Software",              angle: "CyberCraft360 doesn't sell software. We design intelligent systems. The distinction matters because software creates dependency — systems create capability. Position this as a philosophy, not a feature.",                                                    pexelsQueries: ["luxury executive boardroom minimal", "dark concrete architecture office", "modern glass headquarters interior"],          industry: null },
  { week: 1, day: "Wednesday", campaign: "We Don't Build Software",              angle: "Most businesses buy tools hoping for transformation. Tools don't transform — architecture does. A CRM is a tool. A connected intelligence system is infrastructure. Teach the difference.",                                                                    pexelsQueries: ["minimal architectural workspace", "premium concrete office lighting", "editorial corporate interior dark"],               industry: null },
  { week: 1, day: "Friday",    campaign: "We Don't Build Software",              angle: "Engineering a business means understanding its operations first. CyberCraft360 starts with operations, not technology. The technology is the last decision, not the first.",                                                                                   pexelsQueries: ["glass steel commercial office", "luxury business interior minimal", "architectural office editorial"],                    industry: null },

  // WEEK 2 — Every Great Business Runs On Great Systems
  { week: 2, day: "Monday",    campaign: "Every Great Business Runs On Great Systems", angle: "Behind every great business is a system no one sees. Tesla has manufacturing precision. Apple has supply chain engineering. The best businesses are built on invisible operational excellence.",                                                           pexelsQueries: ["executive boardroom strategy", "architectural blueprint office", "premium planning workspace minimal"],                    industry: null },
  { week: 2, day: "Wednesday", campaign: "Every Great Business Runs On Great Systems", angle: "A business that grows faster than its systems collapse. Most small businesses hit a ceiling not because of market — because of internal chaos. Systems are the foundation growth is built on.",                                                             pexelsQueries: ["modern commercial office interior", "executive workspace architectural", "premium business interior editorial"],           industry: null },
  { week: 2, day: "Friday",    campaign: "Every Great Business Runs On Great Systems", angle: "Operational excellence is not a startup problem. It's the difference between a business that scales and one that survives. CyberCraft360 engineers the systems that make scaling possible.",                                                              pexelsQueries: ["corporate architecture glass", "luxury office minimal design", "editorial executive interior"],                           industry: null },

  // WEEK 3 — The Best Systems Are Invisible
  { week: 3, day: "Monday",    campaign: "The Best Systems Are Invisible",       angle: "The mark of great engineering is that no one notices it. Appointments are booked. Inquiries are answered. Follow-ups are sent. The customer experiences seamlessness. The owner experiences freedom.",                                                          pexelsQueries: ["luxury hotel lobby architecture", "golden hour executive office", "architectural interior warm lighting"],                 industry: null },
  { week: 3, day: "Wednesday", campaign: "The Best Systems Are Invisible",       angle: "AI that announces itself has failed. The best automation works in silence — answering calls at 2am, routing leads in milliseconds, sending follow-ups at the perfect moment. Invisible by design.",                                                              pexelsQueries: ["architectural boardroom editorial", "premium office natural light", "minimal executive workspace warm"],                   industry: null },
  { week: 3, day: "Friday",    campaign: "The Best Systems Are Invisible",       angle: "Your customers should never know automation exists. They should only know that your business responds faster, communicates better, and delivers more consistently than any competitor.",                                                                         pexelsQueries: ["luxury architectural interior editorial", "executive meeting room premium", "dark minimal corporate interior"],            industry: null },

  // WEEK 4 — Automation Should Feel Human
  { week: 4, day: "Monday",    campaign: "Automation Should Feel Human",         angle: "The failure of most chatbots is that they feel like chatbots. CyberCraft360 engineers conversational systems that feel like your best employee — informed, professional, and always available.",                                                                 pexelsQueries: ["premium hospitality interior warm", "luxury hotel reception minimal", "warm natural business interaction"],               industry: null },
  { week: 4, day: "Wednesday", campaign: "Automation Should Feel Human",         angle: "A customer calling after hours deserves a real response — not a voicemail. AI voice systems built by CyberCraft360 handle calls, book appointments, and answer questions with the precision of a trained team member.",                                         pexelsQueries: ["warm office lighting minimal", "premium customer service interior", "natural light architectural workspace"],             industry: null },
  { week: 4, day: "Friday",    campaign: "Automation Should Feel Human",         angle: "Technology should amplify human connection, not replace it. When automation handles repetitive communication, your team is free to focus on relationships that actually require human judgment.",                                                                 pexelsQueries: ["executive consultation warm light", "premium business meeting natural", "architectural interior warm hospitality"],        industry: null },

  // WEEK 5 — Designed For Your Industry (rotating industries)
  { week: 5, day: "Monday",    campaign: "Designed For Your Industry — HVAC",    angle: "An HVAC company missing calls during peak season isn't a staffing problem — it's a systems problem. AI voice agents answer every call, qualify every lead, and schedule every appointment. Revenue stops leaking.",                                             pexelsQueries: ["commercial HVAC rooftop system", "mechanical room industrial", "building automation commercial"],                         industry: "HVAC" },
  { week: 5, day: "Wednesday", campaign: "Designed For Your Industry — Real Estate", angle: "In real estate, speed is everything. The agent who responds first wins the client. AI follow-up systems built for real estate ensure every inquiry receives an intelligent response within 60 seconds — 24 hours a day.",                                  pexelsQueries: ["luxury real estate architecture", "premium property development", "modern commercial building architectural"],             industry: "Real Estate" },
  { week: 5, day: "Friday",    campaign: "Designed For Your Industry — Healthcare", angle: "Healthcare practices lose thousands monthly to missed appointments and slow follow-up. CyberCraft360 engineers patient communication systems that reduce no-shows, automate reminders, and ensure every patient feels heard.",                               pexelsQueries: ["premium medical office minimal", "modern clinic interior architectural", "healthcare administration clean"],               industry: "Healthcare" },

  // WEEK 6 — Remove The Friction
  { week: 6, day: "Monday",    campaign: "Remove The Friction",                  angle: "Every manual process in your business is a tax on your time. Repetitive data entry, follow-up emails, appointment confirmations — these are not your job. They are engineering problems. CyberCraft360 solves them.",                                         pexelsQueries: ["minimal concrete office dark", "architectural interior precision", "executive workspace clean editorial"],                 industry: null },
  { week: 6, day: "Wednesday", campaign: "Remove The Friction",                  angle: "The businesses that win aren't the ones working hardest. They're the ones that have engineered friction out of their operations. Less friction means faster decisions, better customers, and higher margins.",                                                  pexelsQueries: ["modern glass architecture commercial", "premium workspace editorial", "dark architectural office minimal"],               industry: null },
  { week: 6, day: "Friday",    campaign: "Remove The Friction",                  angle: "Operational friction is invisible until it costs you a client. A missed follow-up. A slow response. An unanswered call. CyberCraft360 removes these failure points before they become revenue problems.",                                                     pexelsQueries: ["luxury editorial office lighting", "architectural minimal corporate", "premium interior dark concrete"],                  industry: null },

  // WEEK 7 — Every Minute Matters
  { week: 7, day: "Monday",    campaign: "Every Minute Matters",                 angle: "Time is the only resource that cannot be recovered. Businesses that automate intelligently gain back hours every week — hours that compound into competitive advantage over months and years.",                                                                  pexelsQueries: ["executive boardroom precision", "luxury minimal office editorial", "architectural corporate interior clean"],              industry: null },
  { week: 7, day: "Wednesday", campaign: "Every Minute Matters",                 angle: "The average service business spends 30% of its time on administrative work that could be automated. That is not a small number. For a 10-person team, it represents three full-time positions worth of capacity.",                                            pexelsQueries: ["modern architectural office glass", "premium workspace natural light", "executive interior minimal warm"],                industry: null },
  { week: 7, day: "Friday",    campaign: "Every Minute Matters",                 angle: "Speed is a competitive moat. The business that books appointments in seconds, responds to leads instantly, and follows up without delay doesn't just win more clients — it wins better clients.",                                                               pexelsQueries: ["dark editorial corporate architecture", "luxury office interior precise", "minimal concrete workspace premium"],           industry: null },

  // WEEK 8 — From Chaos To Clarity
  { week: 8, day: "Monday",    campaign: "From Chaos To Clarity",                angle: "Disconnected systems create invisible chaos. Your CRM doesn't talk to your scheduling software. Your phone system doesn't connect to your follow-up. CyberCraft360 engineers the connection layer that makes everything work as one.",                        pexelsQueries: ["architectural planning office premium", "executive strategy workspace", "blueprint architectural editorial minimal"],      industry: null },
  { week: 8, day: "Wednesday", campaign: "From Chaos To Clarity",                angle: "Clarity is not a feeling — it's a system. When your operations are designed correctly, every team member knows what to do, every customer gets the right response, and every process runs without supervision.",                                               pexelsQueries: ["modern glass corporate interior", "premium architectural office design", "editorial executive workspace minimal"],         industry: null },
  { week: 8, day: "Friday",    campaign: "From Chaos To Clarity",                angle: "The first sign of business maturity is when operations stop depending on the founder. CyberCraft360 engineers the systems that remove you from the day-to-day — so you can focus on the decade-to-decade.",                                                   pexelsQueries: ["luxury concrete architecture dark", "minimal executive office editorial", "architectural interior warm precision"],        industry: null },

  // WEEK 9 — Intelligence That Learns
  { week: 9, day: "Monday",    campaign: "Intelligence That Learns",             angle: "Static automation is a ceiling. Adaptive AI systems improve with every interaction — learning what your customers ask, how your team responds, and where the gaps are. The system gets smarter so your business gets better.",                                  pexelsQueries: ["dark architectural minimal office", "premium corporate interior glass", "executive boardroom editorial precise"],         industry: null },
  { week: 9, day: "Wednesday", campaign: "Intelligence That Learns",             angle: "A well-engineered AI system doesn't just answer questions — it understands context. Industry-specific, company-specific, customer-specific. This is the difference between a chatbot and an intelligent system.",                                               pexelsQueries: ["luxury editorial interior design", "architectural workspace premium clean", "modern corporate office minimal"],           industry: null },
  { week: 9, day: "Friday",    campaign: "Intelligence That Learns",             angle: "The businesses that will lead their industries in five years are building adaptive AI infrastructure today. Not because it's trendy. Because intelligence compounds — and compound advantage is insurmountable.",                                                pexelsQueries: ["premium architectural dark interior", "glass headquarters modern minimal", "executive office natural light editorial"],   industry: null },

  // WEEK 10 — Your Business. One System.
  { week: 10, day: "Monday",   campaign: "Your Business. One System.",           angle: "Most businesses run on ten tools that don't speak to each other. CyberCraft360 builds the unified intelligence layer — one system that connects your operations, your communication, and your customer experience.",                                          pexelsQueries: ["architectural blueprint planning", "executive workspace unified minimal", "premium corporate interior precision"],         industry: null },
  { week: 10, day: "Wednesday",campaign: "Your Business. One System.",           angle: "Integration is not a technical problem — it's a design problem. The best AI systems are designed around business outcomes, not technology constraints. CyberCraft360 designs from the outcome backward.",                                                    pexelsQueries: ["modern glass architecture office", "luxury minimal corporate interior", "architectural editorial workspace dark"],         industry: null },
  { week: 10, day: "Friday",   campaign: "Your Business. One System.",           angle: "One connected system means one source of truth. Every lead, every customer interaction, every appointment — visible, traceable, and intelligent. This is what operational clarity looks like.",                                                                pexelsQueries: ["premium editorial executive boardroom", "concrete architectural office warm", "glass corporate headquarters minimal"],     industry: null },

  // WEEK 11 — Built To Scale
  { week: 11, day: "Monday",   campaign: "Built To Scale",                       angle: "Scaling a business with broken systems means scaling the chaos. CyberCraft360 builds infrastructure designed for the business you are becoming — not just the business you are today.",                                                                         pexelsQueries: ["luxury architectural commercial building", "premium modern headquarters glass", "editorial executive office dark"],       industry: null },
  { week: 11, day: "Wednesday",campaign: "Built To Scale",                       angle: "Enterprise operations don't require enterprise headcount. The right AI infrastructure allows a 10-person team to operate with the responsiveness, consistency, and professionalism of a 50-person organization.",                                               pexelsQueries: ["minimal concrete corporate interior", "architectural office premium design", "executive workspace editorial clean"],      industry: null },
  { week: 11, day: "Friday",   campaign: "Built To Scale",                       angle: "The ceiling of most businesses is not market size — it's operational capacity. CyberCraft360 removes the ceiling. When operations scale automatically, growth becomes a design feature, not a crisis.",                                                         pexelsQueries: ["dark architectural premium office", "luxury glass headquarters modern", "editorial corporate interior architectural"],    industry: null },

  // WEEK 12 — The Future Is Already Working
  { week: 12, day: "Monday",   campaign: "The Future Is Already Working",        angle: "The future of business operations is not coming — it's already deployed inside the companies that will define their industries. CyberCraft360 builds that infrastructure for businesses that are ready to lead.",                                              pexelsQueries: ["luxury executive boardroom editorial", "architectural interior premium dark", "minimal glass corporate modern"],          industry: null },
  { week: 12, day: "Wednesday",campaign: "The Future Is Already Working",        angle: "AI is not a competitive advantage anymore — it's a competitive requirement. The question is not whether to build intelligent systems. The question is whether you build them before or after your competitors.",                                                 pexelsQueries: ["premium architectural concrete office", "executive workspace warm editorial", "modern corporate interior glass"],         industry: null },
  { week: 12, day: "Friday",   campaign: "The Future Is Already Working",        angle: "CyberCraft360 exists for one reason: to give ambitious businesses the operational intelligence that was previously available only to enterprises with hundreds of engineers. That gap is now closed.",                                                           pexelsQueries: ["architectural editorial interior luxury", "dark corporate headquarters minimal", "premium office warm concrete glass"],   industry: null },
];

const CTA_OPTIONS = [
  "Explore More →",
  "Discover More →",
  "See How We Build →",
  "Book A Strategy Call →",
  "Request A Demo →",
  "Build Smarter →",
  "Schedule Discovery →",
  "See What's Possible →",
  "Create Your System →",
];

const INSTAGRAM_BASE_TAGS = "#AIEngineering #BusinessAutomation #AIAgency #HoustonBusiness #WorkflowAutomation #IntelligentSystems #BusinessInfrastructure #AIArchitecture #SmallBusiness #OperationalExcellence #BusinessSystems #AutomationDesign #HoustonTX #CyberCraft360 #EnterpriseAI #BusinessGrowth";

const LINKEDIN_BASE_TAGS = "#AIEngineering #BusinessAutomation #IntelligentSystems #OperationalExcellence #BusinessInfrastructure #AIArchitecture #HoustonBusiness #CyberCraft360";

type CopyResult = {
  imageHeadline: string;
  imageSubline: string;
  imageBody: string;
  linkedinCaption: string;
  instagramCaption: string;
  facebookCaption: string;
  photoKeyword: string;
};

const BRAND_SYSTEM = `You are the Chief Creative Officer of CyberCraft360 — an AI Engineering firm based in Houston, TX. You write copy that gets mistaken for Apple, Stripe, Linear, or Porsche marketing. Your work appears on billboards, not brochures.

WHO WE ARE:
CyberCraft360 engineers intelligent business infrastructure for ambitious small and mid-size companies. We are NOT a software vendor, chatbot company, or automation tool. We are an AI Engineering Company — the operational backbone behind businesses that outperform their size.

VOICE & TONE — STUDY THESE BRANDS:
• Apple: declarative, present tense, no adjectives that don't earn their place. "The best camera is the one that's always with you." Not "our innovative camera solution empowers users."
• Stripe: precise, confident, never breathless. "Payments infrastructure for the internet." Not "a revolutionary payment platform that transforms businesses."
• Linear: dry wit, intelligence assumed, zero fluff. "Built for the ones who care." Not "designed for passionate teams who want to make a difference."
• Porsche: restraint as a power move. One fact. Silence does the rest. "0–60 in 2.9 seconds." Not "an exhilarating driving experience that excites every sense."
• McLaren: technical authority, earned swagger. "Every component questioned." Not "cutting-edge engineering innovations."

THE VOICE IS:
Intelligent. Calm. Precise. Declarative. Confident without arrogance. Strategic without jargon. Editorial without pretension.

ABSOLUTE PROHIBITIONS — any of these is a failure:
• Banned words: leverage, revolutionize, game-changer, seamlessly, cutting-edge, dive in, unlock, empower, harness, transform, disrupt, innovative, solution, ecosystem, synergy, streamline, robust, scalable (as a lazy adjective), paradigm, holistic, world-class, best-in-class, state-of-the-art, next-level, skyrocket, unprecedented
• No exclamation marks
• No rhetorical questions (especially to open a caption)
• No "in today's fast-paced world" or similar throat-clearing
• No emoji in captions (they cheapen the brand)
• No passive voice unless intentional
• Never describe CyberCraft360 as a tool, platform, software, or chatbot company
• Never say "we help you" — say what we do, not how it helps
• Never pad word count — every word must justify its existence`;

const COPY_FORMAT = (cta: string) => `
IMAGE TEXT RULES (these appear large on a visual — they must be elegant at scale):

imageHeadline:
• Maximum 8 words. Ideally 3–6.
• Statement, not a question. Present tense. No punctuation except a period at the end if it reads as a complete thought.
• Think: billboard at 90mph. It must land in 1 second.
• STRONG examples: "The System Runs. You Lead." / "Complexity Is a Design Problem." / "Infrastructure That Disappears." / "Precision Runs the Business." / "Built Once. Runs Forever."
• WEAK examples (reject these): "Transform Your Business With AI" / "Unlock Your Potential Today" / "Revolutionize How You Work"

imageSubline:
• 3–5 words. Calm category label or location anchor.
• Examples: "AI Engineering · Houston, TX" / "Intelligent Systems Design" / "Business Infrastructure" / "Operational Intelligence"
• Not a sentence. Not a pitch. A quiet label.

imageBody:
• 2–3 sentences. 35–60 words total. This is the paragraph clients read and share.
• Opens with a sharp, earned insight. Builds with one specific truth. Closes with the consequence or the implication — something that makes the reader pause.
• Editorial in register. Precise nouns. Active verbs. No hedging, no qualifying, no pitching.
• Think: the kind of copy that gets screenshotted and texted to a business partner.
• Strong example: "Most businesses confuse tools with infrastructure. A CRM is a tool. A connected intelligence system that routes leads, answers calls, and triggers follow-ups without human input — that is infrastructure. The distinction is what separates businesses that scale from businesses that survive."
• NOT: "CyberCraft360 helps your business grow with powerful automation solutions designed for success."

CAPTION RULES:

linkedinCaption:
• 130–180 words. Executive register. Reads like a memo from a senior partner, not a marketing post.
• Structure: open with a sharp observation or counterintuitive truth (not a question). Build the idea for 3–4 sentences. Land CyberCraft360 once, naturally, as the punchline — never upfront. Close with a single direct sentence.
• End exactly with: "${cta}  CyberCraft360.com" then one blank line then exactly: "${LINKEDIN_BASE_TAGS}"

instagramCaption:
• 70–100 words. First line must be the strongest — it's the preview text. No fluff opener.
• Tone: confident editorial. More personal than LinkedIn but still precise. Like a thoughtful industry insider sharing an observation, not a brand shouting.
• End exactly with: "${cta}  CyberCraft360.com" then one blank line then exactly: "${INSTAGRAM_BASE_TAGS}"

facebookCaption:
• 90–130 words. Narrative. Tell a story or scenario — a business problem, a moment of clarity, a before/after. More accessible than LinkedIn, more structured than Instagram.
• No hashtags. End exactly with: "${cta}  CyberCraft360.com"

photoKeyword:
• A precise Pexels search phrase for a cinematic, premium background image.
• Think: what would a luxury brand use as their campaign backdrop?
• Strong examples: "minimalist executive boardroom dark", "architectural glass facade headquarters", "warm concrete luxury office interior", "aerial city dusk premium editorial", "industrial precision machinery dark"
• NOT: "business people working" / "happy team meeting" / "technology abstract"

Return ONLY valid JSON — no markdown, no explanation, no preamble:
{
  "imageHeadline": "...",
  "imageSubline": "...",
  "imageBody": "...",
  "linkedinCaption": "...",
  "instagramCaption": "...",
  "facebookCaption": "...",
  "photoKeyword": "..."
}`;

async function callCerebras(prompt: string): Promise<CopyResult | null> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "zai-glm-4.7",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.75,
      stream: false,
    }),
  });

  if (!res.ok) {
    console.error("[generate-post] Cerebras error", res.status);
    return null;
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
}

async function generateCustomCopy(customPrompt: string, ctaIndex: number): Promise<CopyResult | null> {
  const cta = CTA_OPTIONS[ctaIndex % CTA_OPTIONS.length];

  const prompt = `${BRAND_SYSTEM}

ASSIGNMENT — CUSTOM POST:
The owner has given you specific direction. Execute it with full brand discipline — the direction tells you the topic and angle, but the voice, quality bar, and rules above are non-negotiable.

OWNER'S DIRECTION:
${customPrompt}

${COPY_FORMAT(cta)}`;

  return callCerebras(prompt);
}

async function generateCopy(campaign: typeof CAMPAIGNS[0], ctaIndex: number): Promise<CopyResult | null> {
  const cta = CTA_OPTIONS[ctaIndex % CTA_OPTIONS.length];
  const industryLine = campaign.industry
    ? `\nINDUSTRY FOCUS: Every word must be directly relevant to ${campaign.industry} businesses. Speak their language, reference their reality.`
    : "";

  const prompt = `${BRAND_SYSTEM}

ASSIGNMENT — CAMPAIGN POST:
Campaign: "${campaign.campaign}"
Week ${campaign.week} · ${campaign.day}${industryLine}

STRATEGIC ANGLE (use this as your creative brief — don't copy it, interpret it):
${campaign.angle}

${COPY_FORMAT(cta)}`;

  return callCerebras(prompt);
}

async function fetchPexelsPhoto(queries: string[]): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const allPhotos: Array<{ src: { large2x: string } }> = [];

  for (const query of queries) {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) continue;
    const data = await res.json();
    const photos: Array<{ src: { large2x: string } }> = data.photos ?? [];
    allPhotos.push(...photos);
    if (allPhotos.length >= 15) break;
  }

  if (allPhotos.length === 0) return null;

  // Skip first 2 results (most overused), pick from 3rd onward for premium variety
  const startIdx = Math.min(2, allPhotos.length - 1);
  const pool = allPhotos.slice(startIdx);
  const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
  return pick.src.large2x;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const customPrompt: string | undefined = body.customPrompt?.trim() || undefined;

  let copy: Awaited<ReturnType<typeof generateCopy>>;
  let campaignIndex: number;
  let campaignLabel: string;
  let week: number | null;
  let day: string | null;

  if (customPrompt) {
    // Custom prompt mode — skip campaign rotation, generate freely
    campaignIndex = -1;
    campaignLabel = "Custom";
    week = null;
    day = null;
    copy = await generateCustomCopy(customPrompt, Math.floor(Math.random() * CTA_OPTIONS.length));
  } else {
    // Campaign rotation mode
    if (typeof body.campaignIndex === "number") {
      campaignIndex = body.campaignIndex % CAMPAIGNS.length;
    } else {
      const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
      const unused = CAMPAIGNS.map((_, i) => i).filter(i => !used.includes(i));
      if (unused.length === 0) {
        await redis.set("social:used_campaign_indexes", []);
        campaignIndex = 0;
      } else {
        campaignIndex = unused[0];
      }
    }
    const campaign = CAMPAIGNS[campaignIndex];
    campaignLabel = campaign.campaign;
    week = campaign.week;
    day = campaign.day;
    copy = await generateCopy(campaign, campaignIndex % CTA_OPTIONS.length);
  }

  if (!copy) {
    return NextResponse.json({ ok: false, error: "Copy generation failed" }, { status: 500 });
  }

  // Use curated Pexels queries for campaign posts, AI keyword for custom
  let pexelsQueries: string[];
  if (campaignIndex >= 0) {
    pexelsQueries = [...CAMPAIGNS[campaignIndex].pexelsQueries, copy.photoKeyword];
  } else {
    pexelsQueries = [copy.photoKeyword];
  }
  const photoUrl = await fetchPexelsPhoto(pexelsQueries);

  return NextResponse.json({
    ok: true,
    campaignIndex,
    campaign: campaignLabel,
    week,
    day,
    copy,
    photoUrl,
  });
}

export { CAMPAIGNS };
