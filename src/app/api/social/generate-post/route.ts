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

async function generateCopy(campaign: typeof CAMPAIGNS[0], ctaIndex: number): Promise<{
  imageHeadline: string;
  imageSubline: string;
  imageBody: string;
  linkedinCaption: string;
  instagramCaption: string;
  facebookCaption: string;
  photoKeyword: string;
} | null> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  const cta = CTA_OPTIONS[ctaIndex % CTA_OPTIONS.length];
  const industryContext = campaign.industry ? `\n\nThis post targets the ${campaign.industry} industry. Every word and image should be directly relevant to ${campaign.industry} businesses.` : "";

  const prompt = `You are the Creative Director and Brand Strategist for CyberCraft360 — an AI Engineering company based in Houston, TX that designs intelligent automation systems for small and mid-size businesses.

BRAND POSITIONING:
CyberCraft360 is NOT a software company, chatbot company, or automation tool.
CyberCraft360 IS: an AI Engineering Company, Intelligent Systems Partner, Business Infrastructure Partner.

CAMPAIGN: "${campaign.campaign}"
WEEK ${campaign.week} — ${campaign.day}
CONTENT ANGLE: ${campaign.angle}${industryContext}

BRAND PERSONALITY:
Confident. Minimal. Sophisticated. Calm. Intelligent. Executive. Modern. Editorial.
Never loud. Never salesy. Never desperate. Never exaggerated.
Write like Apple. Not like marketers.

RULES:
- Never use: "leverage", "revolutionize", "game-changer", "seamlessly", "cutting-edge", "dive in", "in today's world", "unlock", "empower", "harness", "transform"
- Never describe CyberCraft360 as software, tool, or chatbot company
- Every sentence must earn its place
- Avoid buzzwords, hype, emojis, excessive punctuation
- Use confidence instead of excitement

imageHeadline: Maximum 8 words. Bold, direct, minimal. No question marks. Examples: "The Best Systems Are Invisible." / "Built For Scale." / "Complexity Ends Here." / "Infrastructure Wins."

imageSubline: 4-6 words. Calm, editorial. Category or context line. Example: "AI Engineering · Houston, TX" or "Intelligent Systems Design"

imageBody: ONE sentence only. 12-18 words max. Expand the headline with a calm, intelligent insight. No pitch.

linkedinCaption: Executive tone. 120-160 words. Teach one idea. Position CyberCraft360 naturally — never force it. End with: "${cta}  CyberCraft360.com" then a blank line then exactly: "${LINKEDIN_BASE_TAGS}"

instagramCaption: Strong opening line. 60-80 words. Editorial, confident. End with: "${cta}  CyberCraft360.com" then a blank line then exactly: "${INSTAGRAM_BASE_TAGS}"

facebookCaption: Storytelling approach. 80-110 words. Educational. No hashtags. End with: "${cta}  CyberCraft360.com"

photoKeyword: A premium, descriptive Pexels search phrase. Use the visual direction of this campaign. Examples from the brand: "luxury executive boardroom minimal", "dark concrete architecture office", "modern glass headquarters interior", "architectural interior warm editorial". Return a phrase that will find a cinematic, premium image relevant to this post's content.

Return ONLY valid JSON, no markdown fences:
{
  "imageHeadline": "HEADLINE HERE",
  "imageSubline": "Category · Context",
  "imageBody": "One precise sentence that expands the headline.",
  "linkedinCaption": "...",
  "instagramCaption": "...",
  "facebookCaption": "...",
  "photoKeyword": "premium descriptive phrase"
}`;

  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "zai-glm-4.7",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.8,
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

  // Determine campaign index — rotate through all 36 posts
  let campaignIndex: number;
  if (typeof body.campaignIndex === "number") {
    campaignIndex = body.campaignIndex % CAMPAIGNS.length;
  } else {
    const used = await redis.get<number[]>("social:used_campaign_indexes") ?? [];
    const unused = CAMPAIGNS.map((_, i) => i).filter(i => !used.includes(i));
    if (unused.length === 0) {
      // Full rotation complete — start over
      await redis.set("social:used_campaign_indexes", []);
      campaignIndex = 0;
    } else {
      campaignIndex = unused[0]; // Always take the next in sequence
    }
  }

  const campaign = CAMPAIGNS[campaignIndex];
  const ctaIndex = campaignIndex % CTA_OPTIONS.length;

  const copy = await generateCopy(campaign, ctaIndex);
  if (!copy) {
    return NextResponse.json({ ok: false, error: "Copy generation failed" }, { status: 500 });
  }

  // Use campaign's curated Pexels queries + the AI-generated keyword as fallback
  const pexelsQueries = [...campaign.pexelsQueries, copy.photoKeyword];
  const photoUrl = await fetchPexelsPhoto(pexelsQueries);

  return NextResponse.json({
    ok: true,
    campaignIndex,
    campaign: campaign.campaign,
    week: campaign.week,
    day: campaign.day,
    copy,
    photoUrl,
  });
}

export { CAMPAIGNS };
